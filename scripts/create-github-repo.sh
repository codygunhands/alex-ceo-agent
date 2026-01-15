#!/bin/bash
# Script to create GitHub repository for Jeff

set -e

REPO_NAME="jeff-ai-agent"
GITHUB_USER="${GITHUB_USER:-codygunhands}"

echo "📦 Creating GitHub repository: $GITHUB_USER/$REPO_NAME"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) not installed. Install from https://cli.github.com/"
  exit 1
fi

# Create repo
gh repo create "$GITHUB_USER/$REPO_NAME" \
  --public \
  --description "Jeff - AI Customer Success & Marketing Agent (DigitalOcean Native)" \
  --source=. \
  --remote=origin \
  --push

echo "✅ Repository created: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""
echo "Next steps:"
echo "1. Update .do/app.yaml with your GitHub username"
echo "2. Deploy to DigitalOcean: doctl apps create --spec .do/app.yaml"

