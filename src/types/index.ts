import { z } from 'zod';

export type Mode = 'operator' | 'marketing' | 'strategic';
export type Channel = 'sales' | 'onboarding' | 'support' | 'marketing' | 'board';

export const AgentRequestSchema = z.object({
  sessionId: z.string().uuid(),
  mode: z.enum(['operator', 'marketing', 'strategic']),
  channel: z.enum(['sales', 'onboarding', 'support', 'marketing', 'board']),
  message: z.string().min(1).max(5000),
  metadata: z.record(z.unknown()).optional(),
});

export type AgentRequest = z.infer<typeof AgentRequestSchema>;

export const AgentResponseSchema = z.object({
  reply: z.string(),
  actions: z.array(z.object({
    type: z.string(),
    payload: z.record(z.unknown()),
  })),
  confidence: z.number().min(0).max(1),
  citations: z.array(z.object({
    doc: z.string(),
    anchor: z.string().optional(),
  })).optional(),
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

export const CreateLeadSchema = z.object({
  companyName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
});

export const UpdateLeadStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(['new', 'qualified', 'contacted', 'converted', 'lost']),
});

export const CreateTicketSchema = z.object({
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  summary: z.string(),
  details: z.string(),
  sessionId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
});

export const SuggestPlanSchema = z.object({
  tier: z.enum(['Basic', 'Core', 'Premium']),
  seats: z.number().int().positive().optional(),
  reasoning: z.string().optional(),
});

export const BookCallRequestSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  timezone: z.string().optional(),
  preferredTimes: z.array(z.string()).optional(),
});

export const SendDocLinkSchema = z.object({
  url: z.string().url(),
  title: z.string(),
});

export const CreateContentDraftSchema = z.object({
  type: z.enum(['post', 'email', 'landing', 'case_study', 'ad_copy']),
  topic: z.string(),
  draft: z.string(),
});

export const CreateCampaignPlanSchema = z.object({
  channels: z.array(z.string()),
  plan: z.string(),
});

export const CreateObjectionReportSchema = z.object({
  report: z.string(),
});

export const CreateContentCalendarSchema = z.object({
  calendar: z.string(),
});

export interface Policy {
  mode: Mode;
  description: string;
  allowedChannels: Channel[];
  allowedActions: string[];
  strictRules: Record<string, any>;
  bannedPhrases: string[];
  commitmentPatterns?: string[];
  workflows?: Record<string, any>;
}

export interface Pricing {
  tiers: Record<string, {
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
    seats: {
      included: number;
      additionalPrice: number;
    };
    features: string[];
    onboardingFee: number;
    excluded: string[];
  }>;
  onboardingFee: Record<string, any>;
  addOns: Record<string, any>;
}

export interface KnowledgeBaseDoc {
  filename: string;
  content: string;
  headings: Array<{ level: number; text: string; anchor: string }>;
}

export interface KBVersion {
  hash: string;
  docs: KnowledgeBaseDoc[];
  mode: Mode;
}

