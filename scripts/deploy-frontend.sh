#!/bin/bash
# Frontend Deployment Script
# Builds and deploys Next.js to Azure Static Web Apps

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(dirname "$SCRIPT_DIR")"
WORKTREE_BASE="$HOME/polymarket-worktrees"
FRONTEND_SCAFFOLD="$WORKTREE_BASE/05-frontend-scaffold"
FRONTEND_UI="$WORKTREE_BASE/06-frontend-ui"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${2:-$NC}$1${NC}"
}

log "================================================================================" "$BLUE"
log "FRONTEND DEPLOYMENT" "$BLUE"
log "================================================================================" "$BLUE"

# Load environment variables
if [ -f "$DEPLOYMENT_DIR/.env" ]; then
    log "Loading environment variables from .env..." "$BLUE"
    export $(grep -v '^#' "$DEPLOYMENT_DIR/.env" | xargs)
fi

# Configuration
STATIC_APP_NAME="${STATIC_APP_NAME:-polymarket-web-ui}"
RESOURCE_GROUP="${RESOURCE_GROUP:-AZAI_group}"
LOCATION="${LOCATION:-swedencentral}"

log "Static Web App: $STATIC_APP_NAME" "$GREEN"
log "Resource Group: $RESOURCE_GROUP" "$GREEN"
log "" ""

# Determine which frontend to use
FRONTEND_DIR=""
if [ -d "$FRONTEND_UI/src" ] || [ -d "$FRONTEND_UI/app" ]; then
    FRONTEND_DIR="$FRONTEND_UI"
    log "Using frontend-ui worktree" "$GREEN"
elif [ -d "$FRONTEND_SCAFFOLD/src" ] || [ -d "$FRONTEND_SCAFFOLD/app" ]; then
    FRONTEND_DIR="$FRONTEND_SCAFFOLD"
    log "Using frontend-scaffold worktree" "$GREEN"
else
    log "❌ No frontend code found in worktrees" "$RED"
    exit 1
fi

log "" ""

# Check if Static Web App exists
log "Checking if Static Web App exists..." "$BLUE"
if az staticwebapp show --name "$STATIC_APP_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
    log "✅ Static Web App found" "$GREEN"
else
    log "⚠️  Static Web App not found, creating..." "$YELLOW"

    if az staticwebapp create \
        --name "$STATIC_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku Free; then
        log "✅ Static Web App created" "$GREEN"
    else
        log "❌ Failed to create Static Web App" "$RED"
        exit 1
    fi
fi

log "" ""

# Build frontend
log "Building frontend..." "$BLUE"
cd "$FRONTEND_DIR"

# Check for package.json
if [ ! -f "package.json" ]; then
    log "❌ No package.json found in $FRONTEND_DIR" "$RED"
    exit 1
fi

# Install dependencies
log "Installing dependencies..." "$BLUE"
if command -v npm >/dev/null 2>&1; then
    npm install >/dev/null 2>&1 || log "⚠️  npm install had warnings" "$YELLOW"
    log "✅ Dependencies installed" "$GREEN"
else
    log "❌ npm not found" "$RED"
    exit 1
fi

log "" ""

# Set API URL environment variable
FUNCTION_APP_NAME="${FUNCTION_APP_NAME:-polymarket-analyzer}"
API_URL="https://${FUNCTION_APP_NAME}.azurewebsites.net/api"

log "Configuring API URL: $API_URL" "$BLUE"
export NEXT_PUBLIC_API_URL="$API_URL"

# Create .env.production
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=$API_URL
EOF

log "✅ .env.production created" "$GREEN"
log "" ""

# Build
log "Building Next.js application..." "$BLUE"
log "This may take 2-3 minutes..." "$YELLOW"

if npm run build; then
    log "✅ Build successful" "$GREEN"
else
    log "❌ Build failed" "$RED"
    exit 1
fi

log "" ""

# Deploy to Static Web App
log "Deploying to Azure Static Web App..." "$BLUE"

# Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$STATIC_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" -o tsv 2>/dev/null || echo "")

if [ -z "$DEPLOYMENT_TOKEN" ]; then
    log "❌ Failed to get deployment token" "$RED"
    exit 1
fi

# Determine output directory
OUTPUT_DIR="out"  # Next.js default for static export
if [ -d ".next/standalone" ]; then
    OUTPUT_DIR=".next/standalone"
elif [ -d ".next/static" ]; then
    OUTPUT_DIR=".next/static"
elif [ ! -d "$OUTPUT_DIR" ]; then
    log "⚠️  Standard output directory not found, using .next" "$YELLOW"
    OUTPUT_DIR=".next"
fi

log "Output directory: $OUTPUT_DIR" "$BLUE"

# Deploy using Azure Static Web Apps CLI
if command -v swa >/dev/null 2>&1; then
    log "Deploying with SWA CLI..." "$BLUE"
    swa deploy "$OUTPUT_DIR" \
        --deployment-token "$DEPLOYMENT_TOKEN" \
        --env production
else
    log "⚠️  SWA CLI not installed, using alternative method..." "$YELLOW"

    # Alternative: Use az staticwebapp directly
    # Note: This requires the static files to be uploaded manually
    log "Please install SWA CLI for automated deployment:" "$YELLOW"
    log "   npm install -g @azure/static-web-apps-cli" "$YELLOW"
    log "" ""
    log "Manual deployment steps:" "$YELLOW"
    log "   1. Go to Azure Portal" "$YELLOW"
    log "   2. Open Static Web App: $STATIC_APP_NAME" "$YELLOW"
    log "   3. Use deployment token to upload $OUTPUT_DIR" "$YELLOW"
fi

log "" ""

# Get Static Web App URL
APP_URL=$(az staticwebapp show \
    --name "$STATIC_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostname" -o tsv 2>/dev/null || echo "")

if [ -n "$APP_URL" ]; then
    APP_URL="https://$APP_URL"
    log "Testing deployment..." "$BLUE"

    sleep 10  # Wait for deployment

    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")

    if [ "$RESPONSE" = "200" ]; then
        log "✅ Homepage loads successfully" "$GREEN"
    else
        log "⚠️  Homepage returned: $RESPONSE" "$YELLOW"
        log "Deployment may need more time to propagate" "$YELLOW"
    fi
else
    log "⚠️  Unable to determine Static Web App URL" "$YELLOW"
fi

log "" ""

log "================================================================================" "$GREEN"
log "FRONTEND DEPLOYMENT COMPLETE" "$GREEN"
log "================================================================================" "$GREEN"
log "Static Web App: $STATIC_APP_NAME" "$GREEN"
if [ -n "$APP_URL" ]; then
    log "URL: $APP_URL" "$GREEN"
fi
log "API URL: $API_URL" "$GREEN"
log "Status: $([ "$RESPONSE" = "200" ] && echo "Deployed" || echo "Check Azure Portal")" "$GREEN"
log "================================================================================" "$GREEN"

exit 0
