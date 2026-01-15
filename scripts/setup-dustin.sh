#!/bin/bash

# Setup script for Dustin - One-time configuration
# This sets up environment variables for using Jeff

echo "🔧 Setting up Jeff for Dustin..."
echo ""

# Get Jeff's URL
echo "📋 Step 1: Get Jeff's URL"
echo "   Go to: Super Admin Dashboard → Employees → Jeff"
echo "   Copy the URL (e.g., https://jeff-ai-agent-xxxxx.ondigitalocean.app)"
echo ""
read -p "Enter Jeff's URL: " JEFF_URL

# Get API Key
echo ""
echo "📋 Step 2: Get Your API Key"
echo "   Go to: DigitalOcean Dashboard → Apps → jeff-ai-agent → Settings → Environment Variables"
echo "   Copy INTERNAL_API_KEY (or API_KEY)"
echo ""
read -p "Enter your API Key: " API_KEY

# Determine shell config file
if [ -f "$HOME/.zshrc" ]; then
    CONFIG_FILE="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    CONFIG_FILE="$HOME/.bashrc"
else
    CONFIG_FILE="$HOME/.profile"
fi

# Add to shell config
echo "" >> "$CONFIG_FILE"
echo "# Jeff AI Agent Configuration" >> "$CONFIG_FILE"
echo "export JEFF_API_URL=\"$JEFF_URL\"" >> "$CONFIG_FILE"
echo "export JEFF_API_KEY=\"$API_KEY\"" >> "$CONFIG_FILE"

echo ""
echo "✅ Configuration saved to $CONFIG_FILE"
echo ""
echo "📝 To use Jeff now, run:"
echo "   source $CONFIG_FILE"
echo "   cd jeff-ai-agent"
echo "   ./scripts/jeff-marketing.sh \"Your request here\""
echo ""
