#!/bin/bash
# API Integration Test
# Tests complete API workflow

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOYMENT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${2:-$NC}$1${NC}"
}

# Load environment
if [ -f "$DEPLOYMENT_DIR/.env" ]; then
    export $(grep -v '^#' "$DEPLOYMENT_DIR/.env" | xargs)
fi

FUNCTION_APP_NAME="${FUNCTION_APP_NAME:-polymarket-analyzer}"
BASE_URL="https://${FUNCTION_APP_NAME}.azurewebsites.net/api"

log "═══════════════════════════════════════════════════════════════════════════════"
log "API INTEGRATION TEST"
log "═══════════════════════════════════════════════════════════════════════════════"
log "API Base URL: $BASE_URL"
log ""

PASSED=0
FAILED=0

test_case() {
    local name=$1
    local result=$2

    if [ "$result" -eq 0 ]; then
        log "✅ $name" "$GREEN"
        PASSED=$((PASSED + 1))
    else
        log "❌ $name" "$RED"
        FAILED=$((FAILED + 1))
    fi
}

# ============================================================================
# TEST 1: Fetch Markets
# ============================================================================
log "Test 1: Fetch Markets" "$BLUE"
log "-----------------------------------"

RESPONSE=$(curl -s -X GET "${BASE_URL}/markets")
STATUS=$?

if [ $STATUS -eq 0 ] && echo "$RESPONSE" | jq . >/dev/null 2>&1; then
    # Check if response contains markets array
    MARKET_COUNT=$(echo "$RESPONSE" | jq '.markets | length' 2>/dev/null || echo "0")

    if [ "$MARKET_COUNT" -gt 0 ]; then
        log "Response: Found $MARKET_COUNT markets" "$GREEN"
        FIRST_MARKET_ID=$(echo "$RESPONSE" | jq -r '.markets[0].id' 2>/dev/null)
        log "First market ID: $FIRST_MARKET_ID" "$BLUE"
        test_case "Fetch markets" 0
    else
        log "Response: No markets found" "$YELLOW"
        test_case "Fetch markets" 1
    fi
else
    log "Response: Invalid or empty" "$RED"
    test_case "Fetch markets" 1
fi

log ""

# ============================================================================
# TEST 2: Get Price for First Market
# ============================================================================
log "Test 2: Get Price for Market" "$BLUE"
log "-----------------------------------"

if [ -n "$FIRST_MARKET_ID" ]; then
    PRICE_RESPONSE=$(curl -s -X GET "${BASE_URL}/price/${FIRST_MARKET_ID}")
    STATUS=$?

    if [ $STATUS -eq 0 ] && echo "$PRICE_RESPONSE" | jq . >/dev/null 2>&1; then
        PRICE=$(echo "$PRICE_RESPONSE" | jq -r '.price' 2>/dev/null || echo "")

        if [ -n "$PRICE" ]; then
            log "Response: Price = $PRICE" "$GREEN"
            test_case "Get market price" 0
        else
            log "Response: Price not found in response" "$YELLOW"
            test_case "Get market price" 1
        fi
    else
        log "Response: Invalid or empty" "$RED"
        test_case "Get market price" 1
    fi
else
    log "Skipped: No market ID available" "$YELLOW"
    test_case "Get market price" 1
fi

log ""

# ============================================================================
# TEST 3: Run Sentiment Analysis
# ============================================================================
log "Test 3: Sentiment Analysis" "$BLUE"
log "-----------------------------------"

SENTIMENT_TEXT="Bitcoin price is surging to new highs! Very bullish sentiment in the market."
SENTIMENT_RESPONSE=$(curl -s -X POST "${BASE_URL}/sentiment" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$SENTIMENT_TEXT\"}")

STATUS=$?

if [ $STATUS -eq 0 ] && echo "$SENTIMENT_RESPONSE" | jq . >/dev/null 2>&1; then
    SENTIMENT=$(echo "$SENTIMENT_RESPONSE" | jq -r '.sentiment' 2>/dev/null || echo "")
    SCORE=$(echo "$SENTIMENT_RESPONSE" | jq -r '.score' 2>/dev/null || echo "")

    if [ -n "$SENTIMENT" ]; then
        log "Response: Sentiment = $SENTIMENT (score: $SCORE)" "$GREEN"
        test_case "Sentiment analysis" 0
    else
        log "Response: Sentiment not found" "$YELLOW"
        test_case "Sentiment analysis" 1
    fi
else
    log "Response: Invalid or empty" "$RED"
    test_case "Sentiment analysis" 1
fi

log ""

# ============================================================================
# TEST 4: Full Market Analysis
# ============================================================================
log "Test 4: Full Market Analysis" "$BLUE"
log "-----------------------------------"

if [ -n "$FIRST_MARKET_ID" ]; then
    ANALYZE_RESPONSE=$(curl -s -X POST "${BASE_URL}/analyze" \
        -H "Content-Type: application/json" \
        -d "{\"market_id\":\"$FIRST_MARKET_ID\"}")

    STATUS=$?

    if [ $STATUS -eq 0 ] && echo "$ANALYZE_RESPONSE" | jq . >/dev/null 2>&1; then
        ANALYSIS=$(echo "$ANALYZE_RESPONSE" | jq -r '.analysis' 2>/dev/null || echo "")

        if [ -n "$ANALYSIS" ]; then
            log "Response: Analysis completed" "$GREEN"
            test_case "Full market analysis" 0
        else
            log "Response: Analysis not found" "$YELLOW"
            test_case "Full market analysis" 1
        fi
    else
        log "Response: Invalid or empty" "$RED"
        test_case "Full market analysis" 1
    fi
else
    log "Skipped: No market ID available" "$YELLOW"
    test_case "Full market analysis" 1
fi

log ""

# ============================================================================
# TEST 5: Verify Data in Database
# ============================================================================
log "Test 5: Verify Database Storage" "$BLUE"
log "-----------------------------------"

if [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ]; then
    DB_PORT="${DB_PORT:-6432}"
    CONNECTION_STRING="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"

    # Check if data was stored
    MARKET_COUNT=$(psql "$CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM markets;" 2>/dev/null || echo "0")
    PRICE_COUNT=$(psql "$CONNECTION_STRING" -t -c "SELECT COUNT(*) FROM prices;" 2>/dev/null || echo "0")

    if [ "$MARKET_COUNT" -gt 0 ]; then
        log "Database: $MARKET_COUNT markets, $PRICE_COUNT prices" "$GREEN"
        test_case "Database storage" 0
    else
        log "Database: No data found" "$YELLOW"
        test_case "Database storage" 1
    fi
else
    log "Skipped: Database not configured" "$YELLOW"
    test_case "Database storage" 1
fi

log ""

# ============================================================================
# SUMMARY
# ============================================================================
log "═══════════════════════════════════════════════════════════════════════════════"
log "TEST SUMMARY"
log "═══════════════════════════════════════════════════════════════════════════════"

TOTAL=$((PASSED + FAILED))
log "Total tests: $TOTAL"
log "Passed: $PASSED" "$GREEN"
log "Failed: $FAILED" "$RED"

if [ $FAILED -eq 0 ]; then
    log ""
    log "🎉 ALL TESTS PASSED!" "$GREEN"
    exit 0
else
    log ""
    log "⚠️  Some tests failed" "$YELLOW"
    exit 1
fi
