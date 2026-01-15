#!/bin/bash
# Create GitHub repository using curl (no dependencies needed)

set -e

GITHUB_TOKEN="${GITHUB_TOKEN:-${GH_TOKEN}}"
GITHUB_USER="${GITHUB_USER:-codygunhands}"
REPO_NAME="jeff-ai-agent"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN or GH_TOKEN environment variable required"
  echo "   Create a token at: https://github.com/settings/tokens"
  echo "   Required scopes: repo"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 CREATING GITHUB REPOSITORY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if repo exists
echo "🔍 Checking if repository exists..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Repository already exists: https://github.com/${GITHUB_USER}/${REPO_NAME}"
  echo "   Updating remote and pushing code..."
  echo ""
  
  # Set remote and push
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git" 2>/dev/null || \
    git remote set-url origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git"
  git push -u origin main || echo "⚠️  Could not push automatically. Push manually with: git push -u origin main"
  
  echo ""
  echo "✅ Done!"
  exit 0
fi

# Create repository
echo "📦 Creating repository: ${GITHUB_USER}/${REPO_NAME}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"${REPO_NAME}\",
    \"description\": \"Jeff - AI Customer Success & Marketing Agent (DigitalOcean Native)\",
    \"private\": false,
    \"auto_init\": false
  }" \
  "https://api.github.com/user/repos")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "201" ]; then
  echo "❌ Failed to create repository"
  echo "Response ($HTTP_CODE): $BODY"
  exit 1
fi

REPO_URL=$(echo "$BODY" | grep -o '"html_url":"[^"]*' | cut -d'"' -f4)
echo "✅ Repository created: $REPO_URL"
echo ""

# Set remote and push
echo "📤 Pushing code to GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${REPO_NAME}.git"
git push -u origin main || echo "⚠️  Could not push automatically. Push manually with: git push -u origin main"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ REPOSITORY CREATED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Repository: https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo ""
echo "Next steps:"
echo "1. Update .do/app.yaml: Replace YOUR_GITHUB_USERNAME with ${GITHUB_USER}"
echo "2. Deploy: doctl apps create --spec .do/app.yaml"
echo ""

