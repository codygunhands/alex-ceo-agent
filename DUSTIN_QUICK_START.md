# Dustin's Quick Start Guide - How to Use Jeff

## 🚀 The Easiest Way (Recommended)

### Step 1: Get Your Credentials

1. **Get Jeff's URL**:
   - Go to **Super Admin Dashboard** → **Employees** → **Jeff**
   - Copy the URL (e.g., `https://jeff-ai-agent-xxxxx.ondigitalocean.app`)

2. **Get Your API Key**:
   - Go to **DigitalOcean Dashboard** → **Apps** → **jeff-ai-agent**
   - Go to **Settings** → **App-Level Environment Variables**
   - Copy `INTERNAL_API_KEY` (or `API_KEY`)

### Step 2: Set Up Environment Variables

**On Mac/Linux**:
```bash
export JEFF_API_URL="https://jeff-ai-agent-xxxxx.ondigitalocean.app"
export JEFF_API_KEY="your-actual-api-key-here"
```

**Add to your `~/.zshrc` or `~/.bashrc`** to make it permanent:
```bash
echo 'export JEFF_API_URL="https://jeff-ai-agent-xxxxx.ondigitalocean.app"' >> ~/.zshrc
echo 'export JEFF_API_KEY="your-actual-api-key-here"' >> ~/.zshrc
source ~/.zshrc
```

### Step 3: Use the Scripts

**Option A: Shell Script (Easiest)**
```bash
cd jeff-ai-agent
chmod +x scripts/jeff-marketing.sh
./scripts/jeff-marketing.sh "Create a LinkedIn ad for ShopLink free tier"
```

**Option B: Node.js Script**
```bash
cd jeff-ai-agent
node scripts/jeff-marketing.js "Create a LinkedIn ad for ShopLink free tier"
```

**Option C: Interactive Mode**
```bash
# Just run without arguments - it will prompt you
./scripts/jeff-marketing.sh
# or
node scripts/jeff-marketing.js
```

## 📝 Examples

### Create a LinkedIn Ad
```bash
./scripts/jeff-marketing.sh "Create a LinkedIn ad for ShopLink free tier. Focus on connecting suppliers with shops."
```

### Create Landing Page Copy
```bash
./scripts/jeff-marketing.sh "Create landing page copy for ShopWare. Include headline, subheadline, and 3 value props."
```

### Create Email Campaign
```bash
./scripts/jeff-marketing.sh "Create an email campaign for re-engaging inactive ShopWare users. Include subject line and 3 email variants."
```

### Generate High-Converting Ad
```bash
./scripts/jeff-marketing.sh "Create a high-converting LinkedIn ad for Dealio. Headline should focus on winning more deals."
```

## 🔧 Direct API Calls (Alternative)

If you prefer using `curl` directly:

```bash
curl -X POST "$JEFF_API_URL/v1/agent" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $JEFF_API_KEY" \
  -d '{
    "sessionId": "dustin-'$(date +%s)'",
    "mode": "marketing",
    "channel": "marketing",
    "message": "Create a LinkedIn ad for ShopLink free tier"
  }'
```

## 💡 Pro Tips

1. **Use Sessions**: Keep the same `sessionId` for related requests - Jeff remembers context
   ```bash
   # First request
   ./scripts/jeff-marketing.sh "Create a landing page for ShopLink"
   
   # Follow-up (use same session ID)
   ./scripts/jeff-marketing.sh "Make it more aggressive"
   ```

2. **Be Specific**: Tell Jeff exactly what you need
   - ✅ "Create a LinkedIn ad for ShopLink. Focus on connecting suppliers."
   - ❌ "Create an ad"

3. **Request Variants**: Ask for multiple options
   - "Create 3 variants: short, medium, and aggressive"

4. **Include Context**: Mention your target audience
   - "Create a LinkedIn ad targeting small machine shops"

## 🎯 What Jeff Can Do

- ✅ Create landing page drafts
- ✅ Generate email campaigns
- ✅ Create high-converting ads (LinkedIn, Google Display, Square)
- ✅ Write blog posts
- ✅ Create campaign plans
- ✅ Generate objection handling responses
- ✅ Create content calendars

## 🚫 What Jeff Cannot Do

- ❌ Publish content (all outputs are drafts for review)
- ❌ Contact customers directly
- ❌ Make commitments or promises
- ❌ Spend money or create tickets

## 📊 Check Jeff's Status

**Super Admin Dashboard** → **Employees** → **Jeff**
- See health status
- View deployment info
- Check response times

## 🆘 Troubleshooting

**"API key not set" error**:
```bash
export JEFF_API_KEY="your-actual-key"
```

**"Connection refused" error**:
- Check Jeff's URL is correct
- Check Super Admin dashboard for Jeff's status
- Make sure Jeff is deployed and healthy

**"Unauthorized" error**:
- Check your API key is correct
- Make sure you're using `INTERNAL_API_KEY` or `API_KEY`

## 📚 More Info

- **Full Guide**: See `HOW_DUSTIN_USES_JEFF_MARKETING.md`
- **API Reference**: See `HOW_TO_USE_JEFF.md`
- **Conversion-Focused Ads**: See `kb/brand-assets/CONVERSION_FOCUSED_ADS.md`

