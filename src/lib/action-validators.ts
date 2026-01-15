import {
  CreateLeadSchema,
  UpdateLeadStatusSchema,
  CreateTicketSchema,
  SuggestPlanSchema,
  BookCallRequestSchema,
  SendDocLinkSchema,
  CreateContentDraftSchema,
  CreateCampaignPlanSchema,
  CreateObjectionReportSchema,
  CreateContentCalendarSchema,
} from '../types';
import { z } from 'zod';

const ActionSchemas = {
  create_lead: CreateLeadSchema,
  update_lead_status: UpdateLeadStatusSchema,
  create_ticket: CreateTicketSchema,
  suggest_plan: SuggestPlanSchema,
  book_call_request: BookCallRequestSchema,
  send_doc_link: SendDocLinkSchema,
  create_content_draft: CreateContentDraftSchema,
  create_campaign_plan: CreateCampaignPlanSchema,
  create_objection_report: CreateObjectionReportSchema,
  create_content_calendar: CreateContentCalendarSchema,
};

export function validateActionPayload(
  actionType: string,
  payload: any
): { valid: boolean; error?: string; validated?: any } {
  const schema = ActionSchemas[actionType as keyof typeof ActionSchemas];
  
  if (!schema) {
    return {
      valid: false,
      error: `Unknown action type: ${actionType}`,
    };
  }

  try {
    const validated = schema.parse(payload);
    return {
      valid: true,
      validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: `Validation error: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
      };
    }
    return {
      valid: false,
      error: `Unknown validation error`,
    };
  }
}

