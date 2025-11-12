#!/bin/bash
#
# Test Backend Core APIs locally
# Usage: ./test_local.sh
#

set -e

BASE_URL="http://localhost:7071/api"

echo "=========================================="
echo "Testing Backend Core APIs (Local)"
echo "=========================================="
echo ""

# Test health endpoint
echo "1. Testing /health endpoint..."
curl -s "$BASE_URL/health" | python3 -m json.tool
echo ""
echo ""

# Test markets endpoint
echo "2. Testing /markets endpoint..."
curl -s "$BASE_URL/markets" | python3 -m json.tool | head -50
echo ""
echo ""

# Test markets with refresh
echo "3. Testing /markets?refresh=true..."
curl -s "$BASE_URL/markets?refresh=true" | python3 -m json.tool | head -50
echo ""
echo ""

# Note about price endpoint
echo "4. Price endpoint requires token_id:"
echo "   Example: curl $BASE_URL/price/0x123..."
echo ""

echo "=========================================="
echo "Local testing complete!"
echo "=========================================="
