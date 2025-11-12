#!/bin/bash
# Backend Deployment Script
# Packages and deploys Python Azure Functions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(dirname "$SCRIPT_DIR")"
WORKTREE_BASE="$HOME/polymarket-worktrees"
BACKEND_CORE="$WORKTREE_BASE/03-backend-core"
BACKEND_AI="$WORKTREE_BASE/04-backend-ai"

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
log "BACKEND DEPLOYMENT" "$BLUE"
log "================================================================================" "$BLUE"

# Load environment variables
if [ -f "$DEPLOYMENT_DIR/.env" ]; then
    log "Loading environment variables from .env..." "$BLUE"
    export $(grep -v '^#' "$DEPLOYMENT_DIR/.env" | xargs)
fi

# Check required variables
FUNCTION_APP_NAME="${FUNCTION_APP_NAME:-polymarket-analyzer}"
RESOURCE_GROUP="${RESOURCE_GROUP:-AZAI_group}"

log "Function App: $FUNCTION_APP_NAME" "$GREEN"
log "Resource Group: $RESOURCE_GROUP" "$GREEN"
log "" ""

# Check if Function App exists
log "Checking if Function App exists..." "$BLUE"
if az functionapp show --name "$FUNCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
    log "✅ Function App found" "$GREEN"
else
    log "❌ Function App not found: $FUNCTION_APP_NAME" "$RED"
    log "" ""
    log "To create Function App, run:" "$YELLOW"
    log "   bash ~/azure-automation/create-function-app.sh $FUNCTION_APP_NAME" "$YELLOW"
    exit 1
fi

log "" ""

# Package backend functions
log "Packaging backend functions..." "$BLUE"

# Create temporary deployment directory
DEPLOY_DIR=$(mktemp -d)
log "Deployment directory: $DEPLOY_DIR" "$BLUE"

# Copy backend core functions
if [ -d "$BACKEND_CORE" ]; then
    log "Copying backend-core functions..." "$BLUE"
    cp -r "$BACKEND_CORE"/* "$DEPLOY_DIR/" 2>/dev/null || true
fi

# Copy backend AI functions
if [ -d "$BACKEND_AI" ]; then
    log "Copying backend-ai functions..." "$BLUE"
    cp -r "$BACKEND_AI"/* "$DEPLOY_DIR/" 2>/dev/null || true
fi

log "✅ Functions packaged" "$GREEN"
log "" ""

# Install dependencies
log "Installing Python dependencies..." "$BLUE"
if [ -f "$DEPLOY_DIR/requirements.txt" ]; then
    cd "$DEPLOY_DIR"
    python3 -m pip install -r requirements.txt --target .python_packages/lib/site-packages >/dev/null 2>&1 || true
    log "✅ Dependencies installed" "$GREEN"
else
    log "⚠️  No requirements.txt found" "$YELLOW"
fi

log "" ""

# Configure environment variables
log "Configuring environment variables..." "$BLUE"

# Read .env file and set in Function App
if [ -f "$DEPLOYMENT_DIR/.env" ]; then
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue

        # Remove quotes from value
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

        # Set in Function App
        log "   Setting: $key" "$BLUE"
        az functionapp config appsettings set \
            --name "$FUNCTION_APP_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --settings "$key=$value" \
            >/dev/null 2>&1 || log "   ⚠️  Failed to set $key" "$YELLOW"
    done < "$DEPLOYMENT_DIR/.env"
    log "✅ Environment variables configured" "$GREEN"
else
    log "⚠️  No .env file found" "$YELLOW"
fi

log "" ""

# Deploy to Azure
log "Deploying to Azure Function App..." "$BLUE"
log "This may take 2-3 minutes..." "$YELLOW"

cd "$DEPLOY_DIR"
if func azure functionapp publish "$FUNCTION_APP_NAME" --python; then
    log "✅ Deployment successful" "$GREEN"
else
    log "❌ Deployment failed" "$RED"
    exit 1
fi

log "" ""

# Restart Function App
log "Restarting Function App..." "$BLUE"
az functionapp restart \
    --name "$FUNCTION_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    >/dev/null 2>&1

log "✅ Function App restarted" "$GREEN"
log "" ""

# Test health endpoint
log "Testing health endpoint..." "$BLUE"
FUNCTION_URL="https://${FUNCTION_APP_NAME}.azurewebsites.net"
HEALTH_URL="${FUNCTION_URL}/api/health"

sleep 10  # Wait for restart

log "GET $HEALTH_URL" "$BLUE"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")

if [ "$RESPONSE" = "200" ]; then
    log "✅ Health check passed (200 OK)" "$GREEN"
else
    log "⚠️  Health check returned: $RESPONSE" "$YELLOW"
    log "Function App may need more time to warm up" "$YELLOW"
fi

log "" ""

# List available functions
log "Available endpoints:" "$GREEN"
FUNCTIONS=$(az functionapp function list \
    --name "$FUNCTION_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "[].{name:name}" -o tsv 2>/dev/null || echo "")

if [ -n "$FUNCTIONS" ]; then
    echo "$FUNCTIONS" | while read -r func; do
        log "   - ${FUNCTION_URL}/api/${func}" "$GREEN"
    done
else
    log "   Unable to list functions (check Azure portal)" "$YELLOW"
fi

log "" ""

# Cleanup
log "Cleaning up..." "$BLUE"
rm -rf "$DEPLOY_DIR"

log "================================================================================" "$GREEN"
log "BACKEND DEPLOYMENT COMPLETE" "$GREEN"
log "================================================================================" "$GREEN"
log "Function App: $FUNCTION_APP_NAME" "$GREEN"
log "URL: $FUNCTION_URL" "$GREEN"
log "Health: $HEALTH_URL" "$GREEN"
log "Status: $([ "$RESPONSE" = "200" ] && echo "Healthy" || echo "Check logs")" "$GREEN"
log "================================================================================" "$GREEN"

exit 0
