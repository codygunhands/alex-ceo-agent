# Deployment Guide

## Quick Start

### 1. Create GitHub Repository

```bash
./scripts/create-github-repo.sh
```

Or manually:
```bash
gh repo create codygunhands/jeff-ai-agent --public --source=. --push
```

### 2. Update app.yaml

Edit `.do/app.yaml` and replace `YOUR_GITHUB_USERNAME` with your GitHub username.

### 3. Set Up Gradient AI

1. Go to [DigitalOcean Gradient AI Platform](https://cloud.digitalocean.com/gradient)
2. Create a model access key
3. Note your model name (e.g., `llama2-7b-chat`)

### 4. Deploy to DigitalOcean

```bash
doctl apps create --spec .do/app.yaml
```

### 5. Configure Environment Variables

In DigitalOcean dashboard, set:
- `GRADIENT_API_KEY`: Your Gradient API key
- `GRADIENT_MODEL`: Your model name
- `API_KEY`: Generate a secure random key (e.g., `openssl rand -hex 32`)
- `INTERNAL_API_KEY`: Can be same as `API_KEY`

### 6. Run Migrations

After deployment, connect to your database and run:

```bash
npm run prisma:migrate deploy
```

Or use Prisma Studio:
```bash
npm run prisma:studio
```

## Updating the App

```bash
doctl apps update <app-id> --spec .do/app.yaml
```

Or push to GitHub (if auto-deploy is enabled):
```bash
git push origin main
```

## Troubleshooting

### Database Connection

- Verify `DATABASE_URL` is set correctly
- Check database is accessible from app
- Ensure migrations have run

### Redis Connection

- Verify `REDIS_URL` is set correctly
- Check Redis is accessible
- Test with `redis-cli ping`

### Gradient API

- Verify API key is correct
- Check model name matches available models
- Verify API endpoint is correct
- Check rate limits

### Mode Enforcement

- Marketing mode requires `X-API-Key` header
- Verify `INTERNAL_API_KEY` matches header value
- Check mode is set correctly in request

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `GRADIENT_API_KEY` | Yes | DigitalOcean Gradient API key |
| `GRADIENT_MODEL` | Yes | Model name (e.g., `llama2-7b-chat`) |
| `GRADIENT_BASE_URL` | No | API endpoint (default: `https://api.gradient.ai/api/v1`) |
| `API_KEY` | Yes | Internal API key for protected endpoints |
| `INTERNAL_API_KEY` | No | Internal API key (defaults to `API_KEY`) |
| `PORT` | No | Server port (default: `3000`) |
| `HOST` | No | Server host (default: `0.0.0.0`) |
| `LOG_LEVEL` | No | Log level (default: `info`) |
| `NODE_ENV` | No | Environment (default: `development`) |

## Health Checks

The API includes a health check endpoint:

```bash
curl https://your-app.ondigitalocean.app/healthz
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-15T12:00:00.000Z"
}
```

## Monitoring

- Check app logs: `doctl apps logs <app-id>`
- Check worker logs: `doctl apps logs <app-id> --component worker`
- Monitor metrics in DigitalOcean dashboard

