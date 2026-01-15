import { Policy, Pricing, Mode, Channel, KBVersion } from '../types';
import { KnowledgeBase } from './knowledge-base';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface Violation {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  matchedText?: string;
}

export class Guardrails {
  private policy!: Policy;
  private pricing!: Pricing;
  private kb: KnowledgeBase;
  private kbVersion: KBVersion | null = null;

  constructor(mode: Mode) {
    this.kb = new KnowledgeBase();
    this.loadPolicy(mode);
    this.loadPricing();
    this.kbVersion = this.kb.loadForMode(mode);
  }

  private loadPolicy(mode: Mode): void {
    let policyFile: string;
    if (mode === 'operator') {
      policyFile = 'config/policy.operator.json';
    } else if (mode === 'marketing') {
      policyFile = 'config/policy.marketing.json';
    } else if (mode === 'strategic') {
      policyFile = 'config/policy.strategic.json';
    } else {
      policyFile = 'config/policy.operator.json'; // Default
    }
    
    const policyPath = join(process.cwd(), policyFile);
    const policyContent = readFileSync(policyPath, 'utf-8');
    this.policy = JSON.parse(policyContent);
  }

  private loadPricing(): void {
    const pricingPath = join(process.cwd(), 'config/pricing.json');
    const pricingContent = readFileSync(pricingPath, 'utf-8');
    this.pricing = JSON.parse(pricingContent);
  }

  getKBVersion(): KBVersion {
    if (!this.kbVersion) {
      throw new Error('KB version not initialized');
    }
    return this.kbVersion;
  }

  getPolicy(): Policy {
    return this.policy;
  }

  getPricing(): Pricing {
    return this.pricing;
  }

  // Pre-LLM guardrails
  checkPreLLM(message: string, channel: Channel): {
    shouldBlock: boolean;
    response?: string;
    violations: Violation[];
  } {
    const violations: Violation[] = [];

    // Check for customization requests in operator mode
    if (this.policy.mode === 'operator') {
      const customizationKeywords = [
        'customize',
        'custom',
        'modify',
        'change',
        'build',
        'develop',
        'add feature',
        'we need',
      ];

      const hasCustomizationRequest = customizationKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
      );

      if (hasCustomizationRequest && this.policy.strictRules?.noCustomization?.enabled) {
        return {
          shouldBlock: true,
          response: this.policy.strictRules.noCustomization.refusalTemplate.replace(
            '{tier}',
            'Core' // Default suggestion
          ),
          violations: [{
            type: 'customization_request',
            severity: 'high',
            message: 'User requested customization',
            matchedText: message,
          }],
        };
      }
    }

    // Check for roadmap/timeline requests in operator mode
    if (this.policy.mode === 'operator') {
      const roadmapKeywords = [
        'roadmap',
        'timeline',
        'when will',
        'coming soon',
        'next release',
        'future',
        'planned',
      ];

      const hasRoadmapRequest = roadmapKeywords.some(keyword =>
        message.toLowerCase().includes(keyword)
      );

      if (hasRoadmapRequest && this.policy.strictRules?.noRoadmaps?.enabled) {
        return {
          shouldBlock: true,
          response: this.policy.strictRules.noRoadmaps.refusalTemplate,
          violations: [{
            type: 'roadmap_request',
            severity: 'medium',
            message: 'User requested roadmap/timeline',
            matchedText: message,
          }],
        };
      }
    }

    return {
      shouldBlock: false,
      violations,
    };
  }

  // Post-LLM guardrails
  checkPostLLM(response: string): {
    violations: Violation[];
    sanitizedResponse: string;
  } {
    const violations: Violation[] = [];
    let sanitizedResponse = response;

    // Check banned phrases
    for (const phrase of this.policy.bannedPhrases || []) {
      const regex = new RegExp(phrase, 'gi');
      if (regex.test(response)) {
        violations.push({
          type: 'banned_phrase',
          severity: 'high',
          message: `Found banned phrase: ${phrase}`,
          matchedText: phrase,
        });
        sanitizedResponse = sanitizedResponse.replace(regex, '[removed]');
      }
    }

    // Check commitment patterns
    if (this.policy.commitmentPatterns) {
      for (const pattern of this.policy.commitmentPatterns) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
        if (regex.test(response)) {
          violations.push({
            type: 'commitment_pattern',
            severity: 'medium',
            message: `Found commitment pattern: ${pattern}`,
            matchedText: pattern,
          });
        }
      }
    }

    // Verify pricing claims (operator mode only)
    if (this.policy.mode === 'operator' && this.policy.strictRules?.mustQuotePricing?.enabled) {
      const pricingRegex = /\$(\d+)/g;
      const matches = response.match(pricingRegex);
      
      if (matches) {
        for (const match of matches) {
          const amount = parseInt(match.replace('$', ''));
          const isValidPrice = Object.values(this.pricing.tiers).some(tier =>
            tier.monthlyPrice === amount || tier.yearlyPrice === amount
          );
          
          if (!isValidPrice) {
            violations.push({
              type: 'invalid_pricing',
              severity: 'high',
              message: `Invalid price mentioned: ${match}`,
              matchedText: match,
            });
            sanitizedResponse = sanitizedResponse.replace(match, '[price removed - invalid]');
          }
        }
      }
    }

    return {
      violations,
      sanitizedResponse,
    };
  }

  // Validate actions
  validateActions(actions: Array<{ type: string; payload: any }>): {
    valid: Array<{ type: string; payload: any }>;
    invalid: Array<{ type: string; payload: any; reason: string }>;
  } {
    const valid: Array<{ type: string; payload: any }> = [];
    const invalid: Array<{ type: string; payload: any; reason: string }> = [];

    for (const action of actions) {
      if (this.policy.allowedActions.includes(action.type)) {
        valid.push(action);
      } else {
        invalid.push({
          ...action,
          reason: `Action type '${action.type}' not allowed in ${this.policy.mode} mode`,
        });
      }
    }

    return { valid, invalid };
  }
}

