# Monitor Jeff Deployment

The phase shows as "unknown" in the app object because DigitalOcean doesn't populate `active_deployment` until the deployment completes successfully.

## Quick Status Check

Run this script to check Jeff's status:

```bash
cd jeff-ai-agent
./scripts/check-jeff-status.sh
```

## Auto-Update URLs When Deployed

Run this script to automatically wait for deployment and update all URLs:

```bash
cd jeff-ai-agent
node scripts/wait-and-update-urls.js
```

This will:
1. Monitor deployment status every 15 seconds
2. Wait for live URL to be available
3. Automatically update URLs in:
   - `index.html`
   - `shopware/components/JeffChat.tsx`
   - `rfq-app/components/JeffChat.tsx`
   - `assets/jeff-chat-widget.js`
   - `scripts/jeff-marketing.sh`
   - `scripts/jeff-marketing.js`

## Manual Check

Check deployment status via API:

```bash
curl -s -X GET "https://api.digitalocean.com/v2/apps/f9d379c9-9bd3-40f8-9ff0-a33cbbd4926b/deployments?page=1&per_page=1" \
  -H "Authorization: Bearer $DO_API_TOKEN" | python3 -m json.tool
```

Check app for live URL:

```bash
curl -s -X GET "https://api.digitalocean.com/v2/apps/f9d379c9-9bd3-40f8-9ff0-a33cbbd4926b" \
  -H "Authorization: Bearer $DO_API_TOKEN" | python3 -c "import sys, json; print(json.load(sys.stdin)['app'].get('live_url', 'Not deployed yet'))"
```

## Current Status

The latest deployment is in **DEPLOYING** phase, which means:
- ✅ Build succeeded
- ✅ Containers are being deployed
- ⏳ Waiting for health checks to pass
- ⏳ Waiting for live URL to be assigned

Once the deployment completes, the `live_url` field will be populated and we can update all the URLs!

