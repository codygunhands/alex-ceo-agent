# How Dustin Uses Jeff for Marketing

Jeff's MARKETING mode is designed specifically for internal marketing tasks. Here's how Dustin can use it.

## 🚀 Quick Start (TL;DR)

**The Easiest Way**:
```bash
# 1. Set up credentials (one time)
export JEFF_API_URL="https://jeff-ai-agent-xxxxx.ondigitalocean.app"
export JEFF_API_KEY="your-api-key-here"

# 2. Use the script
cd jeff-ai-agent
./scripts/jeff-marketing.sh "Create a LinkedIn ad for ShopLink"
```

**See `DUSTIN_QUICK_START.md` for the complete quick start guide.**

---

## 🔐 Accessing MARKETING Mode

MARKETING mode requires an **internal API key** for security. This ensures only authorized team members can use it.

### Step 1: Get Your API Key

1. Go to **DigitalOcean Dashboard** → **Apps** → **jeff-ai-agent**
2. Go to **Settings** → **App-Level Environment Variables**
3. Copy the value for `INTERNAL_API_KEY` (or `API_KEY`)

**OR** check Super Admin Dashboard → Employees → Jeff → Environment Variables

### Step 2: Get Jeff's URL

1. Go to **Super Admin Dashboard** → **Employees** section
2. Find Jeff's card
3. Copy the URL (e.g., `https://jeff-ai-agent-xxxxx.ondigitalocean.app`)

## 📝 Using MARKETING Mode

### Basic Request Format

All MARKETING mode requests require:
- `X-API-Key` header with your internal API key
- `mode: "marketing"` in the request body
- `channel: "marketing"` in the request body

### Example: Create Landing Page Draft

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_INTERNAL_API_KEY" \
  -d '{
    "sessionId": "marketing-session-001",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create a landing page draft for ShopLink free tier launch. Include 3 variants: short, medium, and aggressive."
  }'
```

**Response:**
```json
{
  "reply": "Here are 3 landing page variants for ShopLink free tier launch...",
  "actions": [
    {
      "type": "create_content_draft",
      "payload": {
        "type": "landing",
        "topic": "ShopLink free tier launch",
        "draft": "..."
      }
    }
  ],
  "confidence": 0.9,
  "citations": [
    {
      "doc": "marketing_playbook.md",
      "anchor": "landing-pages"
    }
  ]
}
```

## 🎯 Common Marketing Tasks

### 1. Landing Page Drafts

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "sessionId": "marketing-001",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create a landing page draft for [Product Name] launch. Focus on [key benefits]."
  }'
```

### 2. Email Campaigns

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "sessionId": "marketing-002",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create an email campaign draft for re-engaging inactive users. Include subject lines and 3 email variants."
  }'
```

### 3. Campaign Plans

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "sessionId": "marketing-003",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create a campaign plan for Q1 product launch across blog, email, and social channels."
  }'
```

### 4. Social Media Content

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "sessionId": "marketing-004",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create 10 social media posts for LinkedIn and Twitter promoting ShopLink free tier. Mix of educational and promotional."
  }'
```

### 5. Blog Post Drafts

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "sessionId": "marketing-005",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create a blog post draft about 'How Small Machine Shops Can Compete with Large Manufacturers' - 1500 words, SEO optimized."
  }'
```

### 6. Content Calendar

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "sessionId": "marketing-006",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create a content calendar for January 2026. Include blog posts, social media, and email campaigns for ShopWare, Dealio, and ShopLink."
  }'
```

### 7. Ad Copy

```bash
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "sessionId": "marketing-007",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create Google Ads copy for ShopLink. 3 headlines and 2 descriptions per ad group. Focus on free tier benefits."
  }'
```

## 💻 Using from Code

### Python Script

```python
import requests

JEFF_URL = 'https://jeff-ai-agent-xxxxx.ondigitalocean.app'
API_KEY = 'your-internal-api-key'

def ask_jeff_marketing(prompt: str, session_id: str = 'marketing-session'):
    response = requests.post(
        f'{JEFF_URL}/v1/agent',
        headers={
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
        },
        json={
            'sessionId': session_id,
            'mode': 'marketing',
            'channel': 'marketing',
            'message': prompt,
        }
    )
    return response.json()

# Example
result = ask_jeff_marketing(
    'Create a landing page draft for ShopLink free tier launch'
)
print(result['reply'])
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

const JEFF_URL = 'https://jeff-ai-agent-xxxxx.ondigitalocean.app';
const API_KEY = 'your-internal-api-key';

async function askJeffMarketing(prompt, sessionId = 'marketing-session') {
  const response = await axios.post(
    `${JEFF_URL}/v1/agent`,
    {
      sessionId,
      mode: 'marketing',
      channel: 'marketing',
      message: prompt,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
    }
  );
  return response.data;
}

// Example
const result = await askJeffMarketing(
  'Create an email campaign for re-engaging inactive users'
);
console.log(result.reply);
```

## 🎨 What MARKETING Mode Can Do

- ✅ Create landing page drafts
- ✅ Write email campaigns
- ✅ Generate social media content
- ✅ Create blog post drafts
- ✅ Plan multi-channel campaigns
- ✅ Generate ad copy
- ✅ Create content calendars
- ✅ Write case studies
- ✅ Generate objection handling content
- ✅ Create marketing playbooks

## 🚫 What MARKETING Mode Cannot Do

- ❌ Make pricing claims (uses pricing.json only)
- ❌ Promise features not in roadmap
- ❌ Create customer-facing content without review
- ❌ Access OPERATOR mode data (separate sessions)

## 📋 Workflow Example

### Complete Marketing Campaign Creation

```bash
# Step 1: Create campaign plan
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "sessionId": "campaign-001",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create a campaign plan for ShopLink free tier launch"
  }'

# Step 2: Create landing page
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "sessionId": "campaign-001",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Now create the landing page draft for this campaign"
  }'

# Step 3: Create email sequence
curl -X POST https://jeff-ai-agent-xxxxx.ondigitalocean.app/v1/agent \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{
    "sessionId": "campaign-001",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create a 3-email sequence for this campaign"
  }'
```

## 🔍 Tips for Best Results

1. **Be Specific**: The more details you provide, the better the output
   - ✅ "Create a landing page for ShopLink free tier targeting small machine shops"
   - ❌ "Create a landing page"

2. **Request Variants**: Ask for multiple options
   - "Create 3 variants: short, medium, and aggressive"

3. **Specify Format**: Tell Jeff what format you need
   - "Create a blog post (1500 words, SEO optimized)"
   - "Create social media posts (LinkedIn format, 280 chars max)"

4. **Use Sessions**: Maintain context across requests
   - Use the same `sessionId` for related requests
   - Jeff remembers the conversation

5. **Iterate**: Refine based on responses
   - "Make it more aggressive"
   - "Add more technical details"
   - "Focus on cost savings"

## 🛡️ Security Notes

- MARKETING mode is **internal-only** - requires API key
- Never expose your `INTERNAL_API_KEY` publicly
- Store API key securely (environment variables, secrets manager)
- Use different API keys for different team members if needed

## 📊 Monitoring

Check Jeff's performance in:
- **Super Admin Dashboard** → **Employees** → **Jeff**
- View response times, health status, deployment info

## 🎉 Ready to Use!

Once Jeff is deployed:
1. Get your API key from DigitalOcean
2. Get Jeff's URL from Super Admin dashboard
3. Start creating marketing content!

Jeff will help Dustin create:
- Landing pages
- Email campaigns
- Social media content
- Blog posts
- Campaign plans
- **Brand-consistent graphics** (social posts, email headers, blog images, ad creatives)
- **Screenshots** (app features, mockups, comparisons)
- And more!

All content includes citations to the marketing playbook and follows Double Vision brand guidelines.

## 🎨 High-Converting Ad Generation

### Focus: Don't Waste Time, Drive Conversions

Jeff creates **conversion-focused ads** using proven templates:

**Available Templates**:
- `linkedin-ad` - LinkedIn/Facebook ads (1200x628px) - **Proven CTR**
- `google-display` - Google Display ads (300x250px) - **Standard format**
- `square-ad` - Instagram/Facebook square ads (1080x1080px) - **Feed format**

**Brand Guidelines Enforced**:
- ✅ Grayscale palette only (black, white, grays)
- ✅ Inter font (Google Fonts)
- ✅ Clean, minimal design
- ✅ High contrast for readability

**Example Request**:
```bash
curl -X POST "$JEFF_URL/v1/internal/graphics/generate" \
  -H "x-api-key: $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "linkedin-ad",
    "data": {
      "headline": "Stop Losing Deals to Competitors",
      "benefit": "ShopWare helps you price accurately and win more bids",
      "cta": "Start Free Trial"
    },
    "format": "png"
  }'
```

**What Makes These Ads Convert**:
- ✅ Clear value proposition (what problem does it solve?)
- ✅ Benefit-focused headlines (outcomes, not features)
- ✅ Action-oriented CTAs ("Start Free Trial" not "Learn More")
- ✅ Simple, uncluttered design (one main message)
- ✅ High contrast (black on white, easy to read)

**Response**: Returns base64-encoded image + metadata

### Screenshot Capabilities

Jeff can capture screenshots using Puppeteer:

**URL Screenshots**:
```bash
curl -X POST "$JEFF_URL/v1/internal/screenshots/capture" \
  -H "x-api-key: $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://shopware.doublevision.company/dashboard",
    "options": {
      "width": 1200,
      "height": 630,
      "fullPage": false
    }
  }'
```

**HTML Rendering**:
```bash
curl -X POST "$JEFF_URL/v1/internal/screenshots/render" \
  -H "x-api-key: $INTERNAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<div style=\"background: white; padding: 40px;\"><h1>Hello</h1></div>",
    "css": "h1 { color: black; font-family: Inter; }",
    "options": {
      "width": 1200,
      "height": 630
    }
  }'
```

**Use Cases**:
- Screenshot app features for marketing
- Generate product mockups
- Create "before/after" comparisons
- Capture dashboard views for case studies

### Integration with Jeff's Responses

When Jeff generates content, he can also include graphics:

**Example**:
```json
{
  "text": "LinkedIn ad: Stop Losing Deals to Competitors - ShopWare helps you price accurately and win more bids",
  "graphics": {
    "template": "linkedin-ad",
    "data": {
      "headline": "Stop Losing Deals to Competitors",
      "benefit": "ShopWare helps you price accurately and win more bids",
      "cta": "Start Free Trial"
    }
  }
}
```

Jeff will automatically generate the ad graphic and include it in the response.

**Conversion Focus**:
- Headlines focus on pain points and outcomes
- CTAs are specific and action-oriented
- Design is simple and uncluttered
- All ads follow proven formats that convert

**Note**: All generated ads are flagged for review before use. Test variations and optimize based on CTR and conversion data.

