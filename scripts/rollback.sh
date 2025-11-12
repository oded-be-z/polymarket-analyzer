#!/bin/bash
# Emergency Rollback Script
# Reverts deployments to previous stable state

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "${2:-$NC}$1${NC}"
}

# Load environment
if [ -f "$DEPLOYMENT_DIR/.env" ]; then
    export $(grep -v '^#' "$DEPLOYMENT_DIR/.env" | xargs)
fi

FUNCTION_APP_NAME="${FUNCTION_APP_NAME:-polymarket-analyzer}"
STATIC_APP_NAME="${STATIC_APP_NAME:-polymarket-web-ui}"
RESOURCE_GROUP="${RESOURCE_GROUP:-AZAI_group}"

log "═══════════════════════════════════════════════════════════════════════════════" "$CYAN"
log "EMERGENCY ROLLBACK" "$RED"
log "═══════════════════════════════════════════════════════════════════════════════" "$CYAN"
log "" ""

log "⚠️  WARNING: This will rollback all recent deployments!" "$YELLOW"
log "" ""

# Prompt for confirmation
log "Enter rollback reason:" "$YELLOW"
read -r ROLLBACK_REASON

if [ -z "$ROLLBACK_REASON" ]; then
    log "❌ Rollback reason required" "$RED"
    exit 1
fi

log "" ""
log "Are you sure you want to proceed? (yes/NO)" "$YELLOW"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log "Rollback cancelled" "$BLUE"
    exit 0
fi

log "" ""
log "═══════════════════════════════════════════════════════════════════════════════" "$CYAN"

# Log rollback
ROLLBACK_LOG="$DEPLOYMENT_DIR/rollback.log"
echo "$(date): Rollback initiated - $ROLLBACK_REASON" >> "$ROLLBACK_LOG"

# ============================================================================
# ROLLBACK FUNCTION APP
# ============================================================================
log "" ""
log "Rolling back Function App: $FUNCTION_APP_NAME" "$BLUE"

# Get previous deployment
PREVIOUS_DEPLOYMENT=$(az functionapp deployment list \
    --name "$FUNCTION_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "[1].id" -o tsv 2>/dev/null || echo "")

if [ -n "$PREVIOUS_DEPLOYMENT" ]; then
    log "   Previous deployment found: $PREVIOUS_DEPLOYMENT" "$BLUE"

    # Note: Azure Functions don't have direct slot swapping without deployment slots
    # Alternative: Redeploy from previous commit
    log "   ⚠️  Automatic rollback not available" "$YELLOW"
    log "   Manual steps required:" "$YELLOW"
    log "      1. Identify previous stable commit" "$YELLOW"
    log "      2. Checkout that commit" "$YELLOW"
    log "      3. Run: bash scripts/deploy-backend.sh" "$YELLOW"
else
    log "   ⚠️  No previous deployment found" "$YELLOW"
fi

# Stop Function App temporarily
log "" ""
log "   Stopping Function App..." "$BLUE"
if az functionapp stop \
    --name "$FUNCTION_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
    log "   ✅ Function App stopped" "$GREEN"
    echo "$(date): Function App stopped" >> "$ROLLBACK_LOG"
else
    log "   ❌ Failed to stop Function App" "$RED"
fi

# ============================================================================
# ROLLBACK STATIC WEB APP
# ============================================================================
log "" ""
log "Rolling back Static Web App: $STATIC_APP_NAME" "$BLUE"

# Note: Static Web Apps require redeployment
log "   ⚠️  Automatic rollback not available" "$YELLOW"
log "   Manual steps required:" "$YELLOW"
log "      1. Identify previous stable commit" "$YELLOW"
log "      2. Checkout that commit" "$YELLOW"
log "      3. Run: bash scripts/deploy-frontend.sh" "$YELLOW"

# ============================================================================
# DATABASE SNAPSHOT (if configured)
# ============================================================================
log "" ""
log "Checking for database backup..." "$BLUE"

if [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ]; then
    # Note: PostgreSQL backup/restore is complex
    log "   ⚠️  Automatic database rollback not implemented" "$YELLOW"
    log "   Manual steps required:" "$YELLOW"
    log "      1. Identify backup timestamp" "$YELLOW"
    log "      2. Run: pg_restore with appropriate backup file" "$YELLOW"
    log "      OR" "$YELLOW"
    log "      3. Contact DBA for point-in-time recovery" "$YELLOW"
else
    log "   ⚠️  Database credentials not configured" "$YELLOW"
fi

# ============================================================================
# SUMMARY
# ============================================================================
log "" ""
log "═══════════════════════════════════════════════════════════════════════════════" "$CYAN"
log "ROLLBACK SUMMARY" "$YELLOW"
log "═══════════════════════════════════════════════════════════════════════════════" "$CYAN"
log "" ""

log "Reason: $ROLLBACK_REASON" "$YELLOW"
log "Timestamp: $(date)" "$YELLOW"
log "" ""

log "Actions taken:" "$BLUE"
log "   - Function App stopped" "$GREEN"
log "   - Manual rollback required for code deployment" "$YELLOW"
log "   - Manual rollback required for database" "$YELLOW"
log "" ""

log "Next steps:" "$BLUE"
log "   1. Identify root cause of failure" "$BLUE"
log "   2. Find last stable git commit" "$BLUE"
log "   3. Checkout stable commit" "$BLUE"
log "   4. Redeploy backend: bash scripts/deploy-backend.sh" "$BLUE"
log "   5. Redeploy frontend: bash scripts/deploy-frontend.sh" "$BLUE"
log "   6. Start Function App: az functionapp start --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP" "$BLUE"
log "   7. Run health checks: bash scripts/health-check-all.sh" "$BLUE"
log "" ""

log "Rollback log saved to: $ROLLBACK_LOG" "$BLUE"
log "═══════════════════════════════════════════════════════════════════════════════" "$CYAN"

echo "$(date): Rollback completed - manual steps required" >> "$ROLLBACK_LOG"

exit 0
