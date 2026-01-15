#!/bin/bash

# Jeff Marketing CLI - Simple script for Dustin to use Jeff for marketing
# Usage: ./jeff-marketing.sh "Create a landing page draft for ShopLink"

# Configuration - Update these!
JEFF_URL="${JEFF_API_URL:-https://jeff-ai-agent-xxxxx.ondigitalocean.app}"
API_KEY="${JEFF_API_KEY:-your-api-key-here}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if API key is set
if [ "$API_KEY" = "your-api-key-here" ]; then
    echo -e "${YELLOW}⚠️  Warning: API_KEY not set!${NC}"
    echo "Set it with: export JEFF_API_KEY=your-actual-key"
    echo "Or edit this script and update API_KEY"
    exit 1
fi

# Get prompt from command line or prompt user
if [ -z "$1" ]; then
    echo -e "${BLUE}Enter your marketing request:${NC}"
    read -r PROMPT
else
    PROMPT="$*"
fi

# Generate session ID
SESSION_ID="marketing-$(date +%s)"

echo -e "${BLUE}📝 Sending to Jeff...${NC}"
echo ""

# Make request
RESPONSE=$(curl -s -X POST "$JEFF_URL/v1/agent" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"mode\": \"marketing\",
    \"channel\": \"marketing\",
    \"message\": \"$PROMPT\"
  }")

# Check for errors
if echo "$RESPONSE" | grep -q '"error"'; then
    echo -e "${YELLOW}❌ Error:${NC}"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

# Extract and display reply
REPLY=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('reply', 'No reply'))" 2>/dev/null)

if [ -z "$REPLY" ]; then
    echo -e "${YELLOW}⚠️  Could not parse response${NC}"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
    echo -e "${GREEN}✅ Jeff's Response:${NC}"
    echo ""
    echo "$REPLY"
    echo ""
    
    # Show citations if any
    CITATIONS=$(echo "$RESPONSE" | python3 -c "import sys, json; citations = json.load(sys.stdin).get('citations', []); print('\n'.join([f\"📚 {c.get('doc', 'unknown')}\" for c in citations]))" 2>/dev/null)
    if [ ! -z "$CITATIONS" ]; then
        echo -e "${BLUE}📚 Citations:${NC}"
        echo "$CITATIONS"
    fi
fi

