import { PrismaClient } from '@prisma/client';
import { GradientProvider } from '../lib/gradient-client';
import { Guardrails } from '../lib/guardrails';
import { KnowledgeBase } from '../lib/knowledge-base';
import { Mode, Channel, AgentRequest, AgentResponse } from '../types';
import { validateActionPayload } from '../lib/action-validators';
import { readFileSync } from 'fs';
import { join } from 'path';

export class AgentService {
  private prisma: PrismaClient;
  private prismaRead: PrismaClient;
  private gradient: GradientProvider;
  private kb: KnowledgeBase;

  constructor() {
    // Write client (primary database)
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
    });
    
    // Read client (read replica)
    this.prismaRead = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_READ_URL || process.env.DATABASE_URL },
      },
    });
    
    this.gradient = new GradientProvider();
    this.kb = new KnowledgeBase();
  }

  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();

    // Initialize guardrails for this mode
    const guardrails = new Guardrails(request.mode);
    const policy = guardrails.getPolicy();
    const kbVersion = guardrails.getKBVersion();

    // Get AI employee name from environment (defaults to 'jeff')
    const aiEmployee = process.env.AI_EMPLOYEE_NAME || 'jeff';
    
    // Update or create session
    const session = await this.prisma.session.upsert({
      where: { id: request.sessionId },
      create: {
        id: request.sessionId,
        mode: request.mode,
        lastChannel: request.channel,
        aiEmployee: aiEmployee,
      },
      update: {
        lastChannel: request.channel,
        updatedAt: new Date(),
      },
    });

    // Save user message
    await this.prisma.message.create({
      data: {
        sessionId: request.sessionId,
        role: 'user',
        channel: request.channel,
        content: request.message,
      },
    });

    // Pre-LLM guardrails check
    const preCheck = guardrails.checkPreLLM(request.message, request.channel);
    if (preCheck.shouldBlock && preCheck.response) {
      // Save assistant response
      await this.prisma.message.create({
        data: {
          sessionId: request.sessionId,
          role: 'assistant',
          channel: request.channel,
          content: preCheck.response,
        },
      });

      return {
        reply: preCheck.response,
        actions: [],
        confidence: 0.9,
        citations: [],
      };
    }

    // Build system prompt
    const systemPrompt = this.buildSystemPrompt(request.mode, request.channel, policy, kbVersion);

    // Build messages
    const messages = await this.buildMessages(request.sessionId, systemPrompt, request.message);

    // Call LLM
    let rawModelResponse: string;
    let modelLatency: number;
    try {
      const llmStartTime = Date.now();
      const completion = await this.gradient.complete({
        model: process.env.GRADIENT_MODEL || '',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });
      modelLatency = Date.now() - llmStartTime;
      rawModelResponse = completion.choices[0]?.message?.content || '';
    } catch (error: any) {
      const errorResponse = `Sorry, I'm having some trouble right now. Can you try again in a moment? If it keeps happening, feel free to reach out to support.`;
      await this.prisma.message.create({
        data: {
          sessionId: request.sessionId,
          role: 'assistant',
          channel: request.channel,
          content: errorResponse,
        },
      });
      return {
        reply: errorResponse,
        actions: [],
        confidence: 0.1,
        citations: [],
      };
    }

    // Parse response (expect JSON with reply and actions)
    let parsedResponse: { reply: string; actions?: Array<{ type: string; payload: any }> };
    try {
      // Try to parse as JSON first
      const jsonMatch = rawModelResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        parsedResponse = { reply: rawModelResponse, actions: [] };
      }
    } catch {
      parsedResponse = { reply: rawModelResponse, actions: [] };
    }

    // Post-LLM guardrails
    const postCheck = guardrails.checkPostLLM(parsedResponse.reply);
    const finalResponse = postCheck.sanitizedResponse;

    // Validate actions
    const actionValidation = guardrails.validateActions(parsedResponse.actions || []);
    const validActions = [];

    for (const action of actionValidation.valid) {
      const payloadValidation = validateActionPayload(action.type, action.payload);
      if (payloadValidation.valid) {
        validActions.push({
          type: action.type,
          payload: payloadValidation.validated || action.payload,
        });
      }
    }

    // Find citations
    const citations = this.kb.findCitations(finalResponse, kbVersion);

    // Save assistant message
    await this.prisma.message.create({
      data: {
        sessionId: request.sessionId,
        role: 'assistant',
        channel: request.channel,
        content: finalResponse,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        sessionId: request.sessionId,
        mode: request.mode,
        channel: request.channel,
        rawPrompt: JSON.stringify(messages),
        rawModelResponse,
        finalResponse,
        violationsJson: JSON.stringify(postCheck.violations),
        actionsJson: JSON.stringify(validActions),
        model: process.env.GRADIENT_MODEL || 'unknown',
        latencyMs: modelLatency,
      },
    });

    const totalLatency = Date.now() - startTime;

    // Track decision if this was a decision-making interaction (CEO only)
    const currentEmployee = process.env.AI_EMPLOYEE_NAME || 'alex-ceo';
    if (currentEmployee === 'alex-ceo' && validActions.some(a => 
      ['approve_initiative', 'reject_initiative', 'make_decision', 'allocate_resources'].includes(a.type)
    )) {
      try {
        const { DecisionTracker } = await import('./decision-tracker');
        const tracker = new DecisionTracker();
        
        // Calculate confidence based on response quality
        const confidence = this.calculateConfidence(finalResponse, validActions, citations);
        
        // Assess risk based on budget impact
        const budgetImpact = validActions.reduce((sum, a) => {
          if (a.type === 'allocate_resources' && a.payload?.amount) {
            return sum + (a.payload.amount || 0);
          }
          return sum;
        }, 0);
        
        const riskLevel = tracker.assessRisk(
          budgetImpact,
          'medium', // strategic impact
          true, // reversibility
          citations.length // consultation count
        );
        
        tracker.recordDecision({
          member: aiEmployee,
          type: validActions.find(a => a.type === 'approve_initiative') ? 'approval' :
                validActions.find(a => a.type === 'reject_initiative') ? 'rejection' :
                validActions.find(a => a.type === 'allocate_resources') ? 'resource_allocation' : 'proposal',
          description: finalResponse.substring(0, 200),
          confidence,
          riskLevel,
          consultedMembers: [],
          budgetImpact,
          rationale: finalResponse,
        });
      } catch (error) {
        // Don't fail the request if decision tracking fails
        console.error('Failed to track decision:', error);
      }
    }

    return {
      reply: finalResponse,
      actions: validActions,
      confidence: 0.8, // Could be computed from model response
      citations: citations.map(c => ({
        doc: c.doc,
        anchor: c.anchor || '',
      })),
    };
  }

  private calculateConfidence(
    response: string,
    actions: Array<{ type: string; payload: any }>,
    citations: Array<{ doc: string; anchor?: string }>
  ): number {
    let confidence = 50; // Base confidence
    
    // Citations increase confidence
    confidence += Math.min(citations.length * 10, 20);
    
    // Actions with payloads increase confidence
    if (actions.length > 0) {
      confidence += 10;
    }
    
    // Response length indicates thoughtfulness
    if (response.length > 200) {
      confidence += 10;
    }
    
    // Check for uncertainty phrases (decrease confidence)
    const uncertaintyPhrases = ['maybe', 'perhaps', 'might', 'could', 'possibly', 'uncertain'];
    const lowerResponse = response.toLowerCase();
    uncertaintyPhrases.forEach(phrase => {
      if (lowerResponse.includes(phrase)) {
        confidence -= 5;
      }
    });
    
    return Math.max(0, Math.min(100, confidence));
  }

  private buildSystemPrompt(
    mode: Mode,
    channel: Channel,
    policy: any,
    kbVersion: any
  ): string {
    const kbContent = kbVersion.docs.map((doc: { filename: string; content: string }) => 
      `## ${doc.filename}\n${doc.content}`
    ).join('\n\n');

    const pricing = readFileSync(join(process.cwd(), 'config/pricing.json'), 'utf-8');

    const agentName = process.env.AI_EMPLOYEE_NAME || 'alex';
    const agentRole = process.env.AI_ROLE || 'CEO';
    
    let prompt = `You are ${agentName === 'alex' ? 'Alex' : agentName}, ${agentRole === 'CEO' ? 'Chief Executive Officer' : agentRole}.

MODE: ${mode.toUpperCase()}
CHANNEL: ${channel.toUpperCase()}

POLICY:
${JSON.stringify(policy.strictRules, null, 2)}

KNOWLEDGE BASE (Version: ${kbVersion.hash}):
${kbContent}

COMMUNICATION STYLE:
- Speak naturally and professionally, like a real executive
- Use natural language and contractions when appropriate
- Be strategic, confident, and clear
- Never mention AI, artificial intelligence, or being automated
- Never use phrases like "As an AI" or "I'm an AI assistant"
- Respond like a real CEO making decisions

RULES:
`;

    if (mode === 'operator') {
      prompt += `
- You are customer-facing. Be helpful but strict.
- NEVER offer customization, roadmaps, or timelines.
- ALWAYS quote pricing from the pricing source of truth only.
- You can create leads, tickets, suggest plans, book calls, send doc links.
- Maximum 3 questions in sales channel.
- Follow canonical workflows - no deviations.
`;
    } else {
      prompt += `
- You are INTERNAL-ONLY. Never contact customers directly.
- Create drafts only - never publish or send anything.
- Include claims checklist for all factual claims.
- Label hypothetical positioning as "hypothesis".
- You can create content drafts, campaign plans, objection reports, content calendars.
`;
    }

    prompt += `
Respond in JSON format:
{
  "reply": "your response text (use natural, professional language)",
  "actions": [
    {
      "type": "action_type",
      "payload": { ... }
    }
  ]
}

Allowed actions for this mode: ${policy.allowedActions.join(', ')}
`;

    return prompt;
  }

  private async buildMessages(
    sessionId: string,
    systemPrompt: string,
    currentMessage: string
  ): Promise<Array<{ role: 'system' | 'user' | 'assistant'; content: string }>> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Get AI employee name from environment (defaults to 'jeff')
    const aiEmployee = process.env.AI_EMPLOYEE_NAME || 'jeff';
    
    // Get recent conversation history (last 10 messages)
    const recentMessages = await this.prisma.message.findMany({
      where: { 
        sessionId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Add messages in chronological order
    for (const msg of recentMessages.reverse()) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({ role: 'user', content: currentMessage });

    return messages;
  }

  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

