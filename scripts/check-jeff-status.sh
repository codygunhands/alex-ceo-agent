#!/bin/bash

# Quick script to check Jeff's deployment status

DO_API_TOKEN="${DO_API_TOKEN:-dop_v1_ad6c6d36222d74448c4beb2d6b6af78958288d4d117728e8d64038835fd797e6}"
APP_ID="f9d379c9-9bd3-40f8-9ff0-a33cbbd4926b"

echo "🔍 Checking Jeff's Status..."
echo ""

# Get app info
APP_RESP=$(curl -s -X GET "https://api.digitalocean.com/v2/apps/$APP_ID" \
  -H "Authorization: Bearer $DO_API_TOKEN")

LIVE_URL=$(echo "$APP_RESP" | python3 -c "import sys, json; print(json.load(sys.stdin)['app'].get('live_url', 'Not deployed yet'))" 2>/dev/null)

# Get latest deployment
DEPLOY_RESP=$(curl -s -X GET "https://api.digitalocean.com/v2/apps/$APP_ID/deployments?page=1&per_page=1" \
  -H "Authorization: Bearer $DO_API_TOKEN")

PHASE=$(echo "$DEPLOY_RESP" | python3 -c "import sys, json; deployments = json.load(sys.stdin).get('deployments', []); print(deployments[0].get('phase', 'unknown') if deployments else 'no deployments')" 2>/dev/null)
CREATED=$(echo "$DEPLOY_RESP" | python3 -c "import sys, json; deployments = json.load(sys.stdin).get('deployments', []); print(deployments[0].get('created_at', 'unknown') if deployments else 'unknown')" 2>/dev/null)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Jeff AI Agent Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Live URL: $LIVE_URL"
echo "Latest Deployment Phase: $PHASE"
echo "Deployment Created: $CREATED"
echo ""

if [ "$LIVE_URL" != "Not deployed yet" ] && [ "$LIVE_URL" != "None" ]; then
    echo "✅✅✅ JEFF IS DEPLOYED! ✅✅✅"
    echo ""
    echo "URL: $LIVE_URL"
    echo ""
    echo "Testing health check..."
    HEALTH=$(curl -s -X GET "$LIVE_URL/healthz" 2>/dev/null)
    if [ $? -eq 0 ]; then
        echo "✅ Health check passed!"
    else
        echo "⚠️  Health check failed (may need a moment)"
    fi
else
    echo "⏳ Still deploying... Phase: $PHASE"
    if [ "$PHASE" = "ERROR" ] || [ "$PHASE" = "FAILED" ]; then
        echo ""
        echo "❌ Deployment failed! Check DigitalOcean dashboard for logs."
    fi
fi

echo ""

