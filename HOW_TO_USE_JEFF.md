# How to Use Jeff - Complete Guide

Jeff is your AI Customer Success Engineer & Marketing Agent, deployed and ready to use!

## 🚀 Quick Start

### 1. Get Jeff's URL

Jeff is deployed at: **Check Super Admin dashboard → Employees section** (or DigitalOcean dashboard)

The URL will be something like: `https://jeff-ai-agent-xxxxx.ondigitalocean.app`

### 2. Get Your API Keys

You'll need these environment variables (set in DigitalOcean):
- `API_KEY` - For internal endpoints
- `INTERNAL_API_KEY` - For MARKETING mode (can be same as API_KEY)

**To get your API keys:**
1. Go to DigitalOcean dashboard → Apps → jeff-ai-agent
2. Go to Settings → App-Level Environment Variables
3. Copy the values for `API_KEY` and `INTERNAL_API_KEY`

## 📋 Two Modes of Operation

### OPERATOR Mode (Customer-Facing)
- **Public endpoint** - No API key required
- Handles: Sales, Onboarding, Support
- Strict guardrails: No customization promises, pricing from config only
- Rate limited: 60 requests/minute per IP

### MARKETING Mode (Internal-Only)
- **Requires API key** - Must include `X-API-Key` header
- Creates: Marketing drafts, campaign plans, content calendars
- Internal use only - protected by API key

## 🔌 API Endpoints

### Public Endpoint: `/v1/agent`

**POST** `https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent`

#### OPERATOR Mode Example (Sales)

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "unique-session-id-123",
    "mode": "operator",
    "channel": "sales",
    "message": "What are your pricing plans?"
  }'
```

**Response:**
```json
{
  "reply": "Here are our pricing plans...",
  "actions": [],
  "confidence": 0.9,
  "citations": [
    {
      "doc": "pricing.json",
      "anchor": "basic-tier"
    }
  ]
}
```

#### OPERATOR Mode Example (Support)

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "unique-session-id-456",
    "mode": "operator",
    "channel": "support",
    "message": "How do I post an RFQ?"
  }'
```

#### OPERATOR Mode Example (Onboarding)

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "unique-session-id-789",
    "mode": "operator",
    "channel": "onboarding",
    "message": "I just completed my first RFQ post!"
  }'
```

#### MARKETING Mode Example (Requires API Key)

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{
    "sessionId": "internal-session-001",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create a landing page draft for ShopLink free tier launch"
  }'
```

### Health Check: `/healthz`

```bash
curl https://jeff-ai-agent-xxxxx.ondigitalocean.app/healthz
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-15T15:00:00.000Z"
}
```

## 🔐 Internal Endpoints (Require API Key)

All internal endpoints require `X-API-Key` header.

### Create Lead

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/internal/v1/leads \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "companyName": "Acme Manufacturing",
    "contactEmail": "contact@acme.com",
    "notes": "Interested in ShopFlow",
    "source": "sales"
  }'
```

### Create Support Ticket

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/internal/v1/tickets \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "priority": "high",
    "summary": "Bid submission error",
    "details": "User reports page crash when submitting bid",
    "sessionId": "unique-session-id-123"
  }'
```

### Get Audit Logs

```bash
curl -X GET https://jeff-ai-agent-xxxxx.ondigitalocean.app/internal/v1/sessions/unique-session-id-123/audit \
  -H "X-API-Key: YOUR_API_KEY"
```

## 💻 Integration Examples

### JavaScript/TypeScript

```typescript
const JEFF_URL = 'https://jeff-ai-agent-xxxxx.ondigitalocean.app';
const API_KEY = 'your-api-key'; // For MARKETING mode only

// OPERATOR Mode - Customer Support
async function askJeff(message: string, sessionId: string) {
  const response = await fetch(`${JEFF_URL}/v1/agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      mode: 'operator',
      channel: 'support', // or 'sales', 'onboarding'
      message,
    }),
  });
  
  return await response.json();
}

// MARKETING Mode - Internal Use
async function createMarketingDraft(prompt: string, sessionId: string) {
  const response = await fetch(`${JEFF_URL}/v1/agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY, // Required for MARKETING mode
    },
    body: JSON.stringify({
      sessionId,
      mode: 'marketing',
      channel: 'marketing',
      message: prompt,
    }),
  });
  
  return await response.json();
}

// Usage
const reply = await askJeff('How do I post an RFQ?', 'user-123');
console.log(reply.reply);
```

### Python

```python
import requests

JEFF_URL = 'https://jeff-ai-agent-xxxxx.ondigitalocean.app'
API_KEY = 'your-api-key'  # For MARKETING mode only

# OPERATOR Mode
def ask_jeff(message: str, session_id: str, channel: str = 'support'):
    response = requests.post(
        f'{JEFF_URL}/v1/agent',
        json={
            'sessionId': session_id,
            'mode': 'operator',
            'channel': channel,
            'message': message,
        }
    )
    return response.json()

# MARKETING Mode
def create_marketing_draft(prompt: str, session_id: str):
    response = requests.post(
        f'{JEFF_URL}/v1/agent',
        headers={'X-API-Key': API_KEY},
        json={
            'sessionId': session_id,
            'mode': 'marketing',
            'channel': 'marketing',
            'message': prompt,
        }
    )
    return response.json()

# Usage
reply = ask_jeff('What are your pricing plans?', 'user-123', 'sales')
print(reply['reply'])
```

## 🎯 Use Cases

### Customer Support Chat
Integrate Jeff into your support chat widget:
- Users ask questions → Jeff responds with knowledge base citations
- Bug reports → Automatically creates tickets
- How-to questions → Provides step-by-step instructions

### Sales Qualification
Use Jeff for initial sales conversations:
- Pricing inquiries → Quotes from `config/pricing.json` only
- Customization requests → Automatically refused with template response
- Feature requests → Routes to appropriate channels

### Onboarding Assistance
Help new users get started:
- First-time user questions
- Workflow guidance
- Next steps after completing actions

### Marketing Content Creation
Internal use for creating:
- Landing page drafts
- Email campaigns
- Social media content
- Blog posts
- Campaign plans

## 🛡️ Guardrails & Safety

Jeff has built-in guardrails:

1. **No Customization Promises**: Automatically refuses customization requests
2. **Pricing Accuracy**: Only quotes from `config/pricing.json`
3. **No Roadmap/Timeline Promises**: Refuses to commit to future features
4. **Action Validation**: Only executes allowed actions
5. **Audit Logging**: All interactions are logged

## 📊 Monitoring

Check Jeff's status in **Super Admin Dashboard → Employees Section**:
- Health status
- Response times
- Deployment phase
- Service metrics

## 🔧 Troubleshooting

### 403 Forbidden (MARKETING Mode)
- Make sure you're including `X-API-Key` header
- Verify API key matches `INTERNAL_API_KEY` in DigitalOcean

### Rate Limit Exceeded
- OPERATOR mode: 60 requests/minute per IP
- Use session IDs to maintain context across requests

### No Response
- Check health: `GET /healthz`
- Verify deployment status in DigitalOcean dashboard
- Check Super Admin dashboard for health issues

## 📚 Knowledge Base

Jeff uses these knowledge base documents:
- `kb/product_overview.md` - Product information
- `kb/onboarding_steps.md` - Onboarding workflows
- `kb/faq.md` - Frequently asked questions
- `kb/support_playbook.md` - Support procedures
- `kb/marketing_playbook.md` - Marketing guidance

All responses include citations to source documents.

## 🎉 Ready to Use!

Jeff is deployed and ready. Start by:
1. Getting the live URL from Super Admin dashboard
2. Testing with `/healthz` endpoint
3. Sending your first OPERATOR mode request
4. Integrating into your applications

For questions or issues, check the Super Admin dashboard or DigitalOcean logs.

## 💬 Adding Jeff to Your Customer-Facing Apps

**See `INTEGRATION_GUIDE.md` for complete instructions on adding Jeff as a chat widget to your apps!**

Quick steps:
1. Add the chat widget HTML/CSS/JS to your app
2. Update `JEFF_API_URL` with Jeff's actual URL
3. Customers can now chat with Jeff directly from your app!

The integration guide includes:
- Ready-to-use HTML/CSS/JS code
- React component for React apps
- Session management
- Dynamic channel selection
- Action handling

**Demo:** Open `chat-widget.html` in your browser to see a working example!

