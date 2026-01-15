# Deploy Jeff - Step by Step Instructions

## Quick Deploy (5 minutes)

### Step 1: Go to DigitalOcean Apps
👉 **Click here**: https://cloud.digitalocean.com/apps

### Step 2: Create App
1. Click **"Create App"** button
2. Select **"GitHub"** tab
3. If not connected, connect your GitHub account
4. Select repository: **`codygunhands/jeff-ai-agent`**
5. Select branch: **`main`**
6. Click **"Next"**

### Step 3: Review Configuration
DigitalOcean will auto-detect your `app.yaml` file and show:
- ✅ **API Service** (Dockerfile.api, port 3000)
- ✅ **Worker Service** (Dockerfile.worker)
- ✅ **PostgreSQL Database** (15)
- ✅ **Redis Database** (7)

**Just click "Next"** - everything is already configured!

### Step 4: Set Environment Variables
Before creating, you need to add these environment variables:

**Required:**
- `GRADIENT_API_KEY` - Get from https://cloud.digitalocean.com/gradient
- `GRADIENT_MODEL` - Your model name (e.g., `llama2-7b-chat`)

**Already Set (but verify):**
- `API_KEY`: `485cabb25244073a3c877e2ee7459ea50ecf2de9f86ffa0e8f455d3935f22417`
- `INTERNAL_API_KEY`: `485cabb25244073a3c877e2ee7459ea50ecf2de9f86ffa0e8f455d3935f22417`
- `GRADIENT_BASE_URL`: `https://api.gradient.ai/api/v1`
- `PORT`: `3000`
- `HOST`: `0.0.0.0`
- `LOG_LEVEL`: `info`
- `NODE_ENV`: `production`

**Database URLs are auto-set** - don't change them!

### Step 5: Create Resources
1. Click **"Create Resources"**
2. Wait 2-3 minutes for deployment
3. ✅ Done!

### Step 6: Run Migrations (After Deployment)
Once deployed, run:
```bash
# Get database URL from DigitalOcean dashboard
export DATABASE_URL="your_db_url_here"

# Run migrations
cd jeff-ai-agent
npm install
npm run prisma:generate
npm run prisma:migrate deploy
```

## Get Gradient AI Credentials

1. Go to: https://cloud.digitalocean.com/gradient
2. Click **"Create Access Key"** (if you don't have one)
3. Copy the API key
4. Note your model name (e.g., `llama2-7b-chat`)

## Test After Deployment

```bash
# Health check
curl https://your-app.ondigitalocean.app/healthz

# Should return:
# {"status":"ok","timestamp":"..."}
```

## Troubleshooting

**If deployment fails:**
- Check build logs in DigitalOcean dashboard
- Verify Dockerfiles are correct
- Check environment variables are set

**If migrations fail:**
- Verify DATABASE_URL is correct
- Check database is accessible
- Run `npm run prisma:studio` to inspect database

---

**That's it!** Jeff will be live in ~3 minutes! 🚀

