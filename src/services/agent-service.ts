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
  private gradient: GradientProvider;
  private kb: KnowledgeBase;

  constructor() {
    this.prisma = new PrismaClient();
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
      const errorResponse = `I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or contact support if the issue persists.`;
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

    return {
      reply: finalResponse,
      actions: validActions,
      confidence: 0.8, // Could be computed from model response
      citations: citations.map(c => ({
        doc: c.doc,
        anchor: c.anchor,
      })),
    };
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

    let prompt = `You are Jeff, an AI Customer Success Engineer and Marketing Agent.

MODE: ${mode.toUpperCase()}
CHANNEL: ${channel.toUpperCase()}

POLICY:
${JSON.stringify(policy.strictRules, null, 2)}

KNOWLEDGE BASE (Version: ${kbVersion.hash}):
${kbContent}

PRICING (Source of Truth):
${pricing}

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
  "reply": "your response text",
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

