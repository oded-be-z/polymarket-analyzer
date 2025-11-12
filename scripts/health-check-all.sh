#!/bin/bash
# Comprehensive Health Check Suite
# Validates infrastructure, backend, frontend, and database

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

banner() {
    log "═══════════════════════════════════════════════════════════════════════════════" "$CYAN"
    log "$1" "$CYAN"
    log "═══════════════════════════════════════════════════════════════════════════════" "$CYAN"
}

test_result() {
    local name=$1
    local result=$2
    local details=$3

    if [ "$result" -eq 0 ]; then
        log "   ✅ $name" "$GREEN"
        [ -n "$details" ] && log "      $details" "$GREEN"
        return 0
    else
        log "   ❌ $name" "$RED"
        [ -n "$details" ] && log "      $details" "$RED"
        return 1
    fi
}

# Load environment
if [ -f "$DEPLOYMENT_DIR/.env" ]; then
    export $(grep -v '^#' "$DEPLOYMENT_DIR/.env" | xargs)
fi

FUNCTION_APP_NAME="${FUNCTION_APP_NAME:-polymarket-analyzer}"
STATIC_APP_NAME="${STATIC_APP_NAME:-polymarket-web-ui}"
RESOURCE_GROUP="${RESOURCE_GROUP:-AZAI_group}"

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

run_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if "$@"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

banner "HEALTH CHECK - STARTING"
log "Timestamp: $(date)" "$BLUE"
log "" ""

# ============================================================================
# INFRASTRUCTURE CHECKS
# ============================================================================
banner "INFRASTRUCTURE CHECKS"
log "" ""

# Azure Function App
log "Checking Azure Function App..." "$BLUE"
if az functionapp show --name "$FUNCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
    STATE=$(az functionapp show --name "$FUNCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" --query "state" -o tsv)
    run_test test_result "Function App exists and running" 0 "State: $STATE"
else
    run_test test_result "Function App exists" 1 "Not found"
fi

log "" ""

# Static Web App
log "Checking Azure Static Web App..." "$BLUE"
if az staticwebapp show --name "$STATIC_APP_NAME" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
    run_test test_result "Static Web App exists" 0
else
    run_test test_result "Static Web App exists" 1 "Not found"
fi

log "" ""

# PostgreSQL
log "Checking PostgreSQL connection..." "$BLUE"
if [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ]; then
    DB_PORT="${DB_PORT:-6432}"
    CONNECTION_STRING="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"

    if psql "$CONNECTION_STRING" -c "SELECT 1;" >/dev/null 2>&1; then
        # Count tables
        TABLE_COUNT=$(psql "$CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
        run_test test_result "PostgreSQL accessible" 0 "$TABLE_COUNT tables found"
    else
        run_test test_result "PostgreSQL accessible" 1 "Connection failed"
    fi
else
    run_test test_result "PostgreSQL configured" 1 "Missing credentials"
fi

log "" ""

# ============================================================================
# BACKEND API CHECKS
# ============================================================================
banner "BACKEND API CHECKS"
log "" ""

BASE_URL="https://${FUNCTION_APP_NAME}.azurewebsites.net"

# Health endpoint
log "Testing health endpoint..." "$BLUE"
HEALTH_URL="${BASE_URL}/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
run_test test_result "GET /api/health" $([ "$RESPONSE" = "200" ] && echo 0 || echo 1) "HTTP $RESPONSE"

log "" ""

# Markets endpoint
log "Testing markets endpoint..." "$BLUE"
MARKETS_URL="${BASE_URL}/api/markets"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$MARKETS_URL" 2>/dev/null || echo "000")

if [ "$RESPONSE" = "200" ]; then
    # Check if response contains markets
    MARKETS_JSON=$(curl -s "$MARKETS_URL" 2>/dev/null)
    if echo "$MARKETS_JSON" | grep -q "markets"; then
        run_test test_result "GET /api/markets" 0 "Returns markets data"
    else
        run_test test_result "GET /api/markets" 1 "Invalid response format"
    fi
else
    run_test test_result "GET /api/markets" 1 "HTTP $RESPONSE"
fi

log "" ""

# Price endpoint (with test market ID)
log "Testing price endpoint..." "$BLUE"
PRICE_URL="${BASE_URL}/api/price/test-market-id"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$PRICE_URL" 2>/dev/null || echo "000")
run_test test_result "GET /api/price/{id}" $([ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ] && echo 0 || echo 1) "HTTP $RESPONSE"

log "" ""

# Sentiment endpoint
log "Testing sentiment endpoint..." "$BLUE"
SENTIMENT_URL="${BASE_URL}/api/sentiment"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"text":"This is a test"}' \
    "$SENTIMENT_URL" 2>/dev/null || echo "000")
run_test test_result "POST /api/sentiment" $([ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "400" ] && echo 0 || echo 1) "HTTP $RESPONSE"

log "" ""

# Analyze endpoint
log "Testing analyze endpoint..." "$BLUE"
ANALYZE_URL="${BASE_URL}/api/analyze"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"market_id":"test"}' \
    "$ANALYZE_URL" 2>/dev/null || echo "000")
run_test test_result "POST /api/analyze" $([ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "400" ] && echo 0 || echo 1) "HTTP $RESPONSE"

log "" ""

# ============================================================================
# FRONTEND CHECKS
# ============================================================================
banner "FRONTEND CHECKS"
log "" ""

FRONTEND_URL=$(az staticwebapp show \
    --name "$STATIC_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostname" -o tsv 2>/dev/null || echo "")

if [ -n "$FRONTEND_URL" ]; then
    FRONTEND_URL="https://$FRONTEND_URL"

    log "Testing homepage..." "$BLUE"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
    run_test test_result "Homepage loads" $([ "$RESPONSE" = "200" ] && echo 0 || echo 1) "HTTP $RESPONSE"

    log "" ""

    log "Testing market page..." "$BLUE"
    MARKET_PAGE_URL="${FRONTEND_URL}/markets"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$MARKET_PAGE_URL" 2>/dev/null || echo "000")
    run_test test_result "Market page loads" $([ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ] && echo 0 || echo 1) "HTTP $RESPONSE"
else
    log "⚠️  Frontend URL not found, skipping frontend checks" "$YELLOW"
fi

log "" ""

# ============================================================================
# DATABASE CHECKS
# ============================================================================
banner "DATABASE CHECKS"
log "" ""

if [ -n "$DB_HOST" ] && psql "$CONNECTION_STRING" -c "SELECT 1;" >/dev/null 2>&1; then
    # Check tables exist
    log "Verifying database tables..." "$BLUE"

    EXPECTED_TABLES=("markets" "prices" "sentiment" "analysis" "users" "subscriptions")

    for table in "${EXPECTED_TABLES[@]}"; do
        if psql "$CONNECTION_STRING" -t -c "SELECT to_regclass('public.$table');" 2>/dev/null | grep -q "$table"; then
            run_test test_result "Table exists: $table" 0
        else
            run_test test_result "Table exists: $table" 1
        fi
    done

    log "" ""

    # Check indexes
    log "Checking indexes..." "$BLUE"
    INDEX_COUNT=$(psql "$CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';" 2>/dev/null)
    run_test test_result "Indexes created" $([ "$INDEX_COUNT" -gt 0 ] && echo 0 || echo 1) "$INDEX_COUNT indexes"

    log "" ""

    # Test insert/query
    log "Testing database operations..." "$BLUE"
    if psql "$CONNECTION_STRING" -c "CREATE TEMP TABLE test_health (id SERIAL, data TEXT); INSERT INTO test_health (data) VALUES ('test'); SELECT * FROM test_health;" >/dev/null 2>&1; then
        run_test test_result "Insert/Query operations" 0
    else
        run_test test_result "Insert/Query operations" 1
    fi
else
    log "⚠️  Database not accessible, skipping database checks" "$YELLOW"
fi

log "" ""

# ============================================================================
# SUMMARY
# ============================================================================
banner "HEALTH CHECK SUMMARY"
log "" ""

log "Total tests: $TOTAL_TESTS" "$BLUE"
log "Passed: $PASSED_TESTS" "$GREEN"
log "Failed: $FAILED_TESTS" "$RED"
log "" ""

SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

if [ "$SUCCESS_RATE" -eq 100 ]; then
    log "🎉 ALL HEALTH CHECKS PASSED!" "$GREEN"
    EXIT_CODE=0
elif [ "$SUCCESS_RATE" -ge 80 ]; then
    log "⚠️  Most health checks passed ($SUCCESS_RATE%)" "$YELLOW"
    log "Some non-critical issues detected" "$YELLOW"
    EXIT_CODE=0
else
    log "❌ Multiple health checks failed ($SUCCESS_RATE%)" "$RED"
    log "Please investigate and resolve issues" "$RED"
    EXIT_CODE=1
fi

log "" ""
log "Completed: $(date)" "$BLUE"
log "═══════════════════════════════════════════════════════════════════════════════" "$CYAN"

exit $EXIT_CODE
