#!/bin/bash
# Master Deployment Script
# Orchestrates full deployment in correct order

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

banner() {
    log "" ""
    log "═══════════════════════════════════════════════════════════════════════════════" "$CYAN"
    log "$1" "$CYAN"
    log "═══════════════════════════════════════════════════════════════════════════════" "$CYAN"
    log "" ""
}

banner "POLYMARKET ANALYZER - MASTER DEPLOYMENT"

log "Started: $(date)" "$BLUE"
log "Working directory: $SCRIPT_DIR" "$BLUE"
log "" ""

# Check prerequisites
log "Checking prerequisites..." "$BLUE"

MISSING_TOOLS=()

# Check Azure CLI
if ! command -v az >/dev/null 2>&1; then
    MISSING_TOOLS+=("az (Azure CLI)")
fi

# Check psql
if ! command -v psql >/dev/null 2>&1; then
    MISSING_TOOLS+=("psql (PostgreSQL client)")
fi

# Check func
if ! command -v func >/dev/null 2>&1; then
    MISSING_TOOLS+=("func (Azure Functions Core Tools)")
fi

# Check npm
if ! command -v npm >/dev/null 2>&1; then
    MISSING_TOOLS+=("npm (Node Package Manager)")
fi

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    log "❌ Missing required tools:" "$RED"
    for tool in "${MISSING_TOOLS[@]}"; do
        log "   - $tool" "$RED"
    done
    log "" ""
    log "Please install missing tools and try again" "$RED"
    exit 1
fi

log "✅ All prerequisites installed" "$GREEN"
log "" ""

# Check Azure login
log "Checking Azure authentication..." "$BLUE"
if az account show >/dev/null 2>&1; then
    SUBSCRIPTION=$(az account show --query "name" -o tsv)
    log "✅ Logged in to Azure: $SUBSCRIPTION" "$GREEN"
else
    log "❌ Not logged in to Azure" "$RED"
    log "Run: az login" "$RED"
    exit 1
fi

log "" ""

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    log "Loading environment variables..." "$BLUE"
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
    log "✅ Environment variables loaded" "$GREEN"
else
    log "⚠️  No .env file found" "$YELLOW"
    log "Create .env file with required credentials" "$YELLOW"
fi

log "" ""

# Deployment stages
STAGES=(
    "1:Database:scripts/deploy-database.sh"
    "2:Backend:scripts/deploy-backend.sh"
    "3:Frontend:scripts/deploy-frontend.sh"
    "4:Health Checks:scripts/health-check-all.sh"
)

FAILED_STAGES=()

for stage_info in "${STAGES[@]}"; do
    IFS=':' read -r stage_num stage_name stage_script <<< "$stage_info"

    banner "STAGE $stage_num: $stage_name"

    SCRIPT_PATH="$SCRIPT_DIR/$stage_script"

    if [ ! -f "$SCRIPT_PATH" ]; then
        log "⚠️  Script not found: $SCRIPT_PATH" "$YELLOW"
        log "Skipping..." "$YELLOW"
        continue
    fi

    log "Executing: $stage_script" "$BLUE"
    log "" ""

    if bash "$SCRIPT_PATH"; then
        log "" ""
        log "✅ STAGE $stage_num COMPLETE: $stage_name" "$GREEN"
    else
        log "" ""
        log "❌ STAGE $stage_num FAILED: $stage_name" "$RED"
        FAILED_STAGES+=("$stage_num:$stage_name")

        log "" ""
        log "Do you want to continue with remaining stages? (y/N)" "$YELLOW"
        read -r -n 1 CONTINUE
        log "" ""

        if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
            log "Deployment aborted by user" "$RED"
            break
        fi
    fi
done

# Summary
banner "DEPLOYMENT SUMMARY"

if [ ${#FAILED_STAGES[@]} -eq 0 ]; then
    log "🎉 ALL STAGES COMPLETED SUCCESSFULLY!" "$GREEN"
    log "" ""
    log "Your Polymarket Analyzer is now deployed and ready!" "$GREEN"
    log "" ""

    # Show URLs if available
    FUNCTION_APP_NAME="${FUNCTION_APP_NAME:-polymarket-analyzer}"
    STATIC_APP_NAME="${STATIC_APP_NAME:-polymarket-web-ui}"

    log "Backend API:" "$CYAN"
    log "   https://${FUNCTION_APP_NAME}.azurewebsites.net/api" "$CYAN"
    log "" ""

    FRONTEND_URL=$(az staticwebapp show \
        --name "$STATIC_APP_NAME" \
        --resource-group "${RESOURCE_GROUP:-AZAI_group}" \
        --query "defaultHostname" -o tsv 2>/dev/null || echo "")

    if [ -n "$FRONTEND_URL" ]; then
        log "Frontend URL:" "$CYAN"
        log "   https://$FRONTEND_URL" "$CYAN"
    fi

    log "" ""
    log "Next steps:" "$BLUE"
    log "   1. Test the application manually" "$BLUE"
    log "   2. Run integration tests: bash integration-tests/test-api-flow.sh" "$BLUE"
    log "   3. Configure monitoring and alerts" "$BLUE"
    log "   4. Set up CI/CD pipelines" "$BLUE"

    EXIT_CODE=0
else
    log "⚠️  Some stages failed:" "$YELLOW"
    for stage in "${FAILED_STAGES[@]}"; do
        IFS=':' read -r num name <<< "$stage"
        log "   ❌ Stage $num: $name" "$RED"
    done

    log "" ""
    log "Please review the logs and fix issues before proceeding" "$YELLOW"
    EXIT_CODE=1
fi

log "" ""
log "Completed: $(date)" "$BLUE"
log "═══════════════════════════════════════════════════════════════════════════════" "$CYAN"

exit $EXIT_CODE
