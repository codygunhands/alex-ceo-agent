# Deploy Jeff Now 🚀

## Quick Deployment Steps

### 1. Set Up Gradient AI

1. Go to: https://cloud.digitalocean.com/gradient
2. Create a model access key (if you don't have one)
3. Note your model name (e.g., `llama2-7b-chat`)
4. Save your API key

### 2. Deploy via DigitalOcean Dashboard

**Easiest method:**

1. Go to: https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Select **"GitHub"** tab
4. Connect your GitHub account if needed
5. Select repository: **`codygunhands/jeff-ai-agent`**
6. Select branch: **`main`**
7. Click **"Next"**

8. **Configure Services:**
   - **API Service:**
     - Name: `api`
     - Dockerfile: `Dockerfile.api`
     - Port: `3000`
     - Health check: `/healthz`
   
   - **Worker Service:**
     - Name: `worker`
     - Dockerfile: `Dockerfile.worker`
     - (No HTTP port needed)

9. **Add Databases:**
   - Click **"Add Database"**
   - Select **PostgreSQL 15**
   - Name: `db`
   - Click **"Add Database"** again
   - Select **Redis 7**
   - Name: `redis`

10. **Set Environment Variables:**
    - `GRADIENT_API_KEY`: (your Gradient API key)
    - `GRADIENT_MODEL`: (your model name, e.g., `llama2-7b-chat`)
    - `GRADIENT_BASE_URL`: `https://api.gradient.ai/api/v1`
    - `API_KEY`: (generate: `openssl rand -hex 32`)
    - `INTERNAL_API_KEY`: (can be same as API_KEY)
    - `PORT`: `3000`
    - `HOST`: `0.0.0.0`
    - `LOG_LEVEL`: `info`
    - `NODE_ENV`: `production`

11. Click **"Create Resources"**

12. Wait for deployment (2-3 minutes)

### 3. Run Migrations

After deployment completes:

1. Get your database connection string from DigitalOcean dashboard
2. Set `DATABASE_URL` environment variable
3. Run:
   ```bash
   npm run prisma:migrate deploy
   ```

Or use Prisma Studio:
```bash
npm run prisma:studio
```

### 4. Test

Once deployed, test the health endpoint:
```bash
curl https://your-app.ondigitalocean.app/healthz
```

## Alternative: Use app.yaml with doctl

If you have `doctl` installed:

```bash
# Install doctl if needed
brew install doctl

# Authenticate
doctl auth init

# Deploy
doctl apps create --spec .do/app.yaml
```

Then set environment variables in the dashboard.

## Generated API Keys

Run this to generate secure API keys:
```bash
openssl rand -hex 32
```

Save these keys securely!

---

**Status**: Ready to deploy! 🎉

