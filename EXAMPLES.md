# Example API Calls

## Operator Mode Examples

### 1. Sales Channel - Customization Request (Should Refuse)

```bash
curl -X POST http://localhost:3000/v1/agent \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "mode": "operator",
    "channel": "sales",
    "message": "We need you to customize the platform for our specific manufacturing process"
  }'
```

**Expected Response**: Refusal template explaining no customization available, offering standard solution.

### 2. Sales Channel - Pricing Inquiry

```bash
curl -X POST http://localhost:3000/v1/agent \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "mode": "operator",
    "channel": "sales",
    "message": "What are your pricing plans?"
  }'
```

**Expected Response**: Pricing from `config/pricing.json` only, with plan suggestions.

### 3. Support Channel - How-To Question

```bash
curl -X POST http://localhost:3000/v1/agent \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "mode": "operator",
    "channel": "support",
    "message": "How do I post an RFQ?"
  }'
```

**Expected Response**: Documentation link + step-by-step instructions, citation to `kb/onboarding_steps.md`.

### 4. Support Channel - Bug Report

```bash
curl -X POST http://localhost:3000/v1/agent \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "mode": "operator",
    "channel": "support",
    "message": "I'm getting an error when trying to submit a bid. The page crashes."
  }'
```

**Expected Response**: Ticket created with HIGH priority, includes `create_ticket` action.

### 5. Onboarding Channel - First Win

```bash
curl -X POST http://localhost:3000/v1/agent \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "mode": "operator",
    "channel": "onboarding",
    "message": "I just completed my first RFQ post!"
  }'
```

**Expected Response**: Acknowledgment, next steps from canonical workflow.

## Marketing Mode Examples

### 1. Landing Page Draft (Requires API Key)

```bash
curl -X POST http://localhost:3000/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-internal-api-key" \
  -d '{
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create a landing page draft for ShopLink free tier launch. Include 3 variants: short, medium, and aggressive."
  }'
```

**Expected Response**: Content draft with 3 variants, claims checklist, citations to marketing playbook.

### 2. Email Campaign Draft

```bash
curl -X POST http://localhost:3000/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-internal-api-key" \
  -d '{
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create an email campaign draft for re-engaging inactive users"
  }'
```

**Expected Response**: Email draft with claims checklist.

### 3. Campaign Plan

```bash
curl -X POST http://localhost:3000/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-internal-api-key" \
  -d '{
    "sessionId": "123e4567-e89b-12d3-a456-426614174000",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create a campaign plan for Q1 product launch across blog, email, and social channels"
  }'
```

**Expected Response**: Campaign plan with `create_campaign_plan` action.

## Internal API Examples

### Create Lead

```bash
curl -X POST http://localhost:3000/internal/v1/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "companyName": "Acme Manufacturing",
    "contactEmail": "contact@acme.com",
    "notes": "Interested in ShopFlow",
    "source": "sales"
  }'
```

### Create Ticket

```bash
curl -X POST http://localhost:3000/internal/v1/tickets \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "priority": "high",
    "summary": "Bid submission error",
    "details": "User reports page crash when submitting bid",
    "sessionId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Get Audit Logs

```bash
curl -X GET http://localhost:3000/internal/v1/sessions/123e4567-e89b-12d3-a456-426614174000/audit \
  -H "X-API-Key: your-api-key"
```

## Testing Guardrails

### Test Customization Refusal

```bash
curl -X POST http://localhost:3000/v1/agent \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-1",
    "mode": "operator",
    "channel": "sales",
    "message": "Can you build a custom feature for us?"
  }'
```

**Expected**: Immediate refusal, no LLM call, template response.

### Test Roadmap Refusal

```bash
curl -X POST http://localhost:3000/v1/agent \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-2",
    "mode": "operator",
    "channel": "support",
    "message": "When will feature X be available?"
  }'
```

**Expected**: Immediate refusal, no LLM call, template response.

### Test Marketing Mode Security

```bash
# Without API key (should fail)
curl -X POST http://localhost:3000/v1/agent \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session-3",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create a draft"
  }'
```

**Expected**: 403 Forbidden - Marketing mode requires internal API key.

