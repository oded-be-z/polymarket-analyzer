#!/bin/bash
#
# Deploy Backend Core APIs to Azure Function App
# Usage: ./deploy.sh [environment]
# Environment: dev (default) | prod
#

set -e

ENVIRONMENT="${1:-dev}"
FUNCTION_APP_NAME="polymarket-analyzer"
RESOURCE_GROUP="AZAI_group"

echo "=========================================="
echo "Polymarket Analyzer - Backend Deployment"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo "Function App: $FUNCTION_APP_NAME"
echo "Resource Group: $RESOURCE_GROUP"
echo ""

# Check if logged into Azure
echo "Checking Azure login..."
if ! az account show &> /dev/null; then
    echo "Not logged into Azure. Running 'az login'..."
    az login
fi

# Verify Function App exists
echo "Verifying Function App exists..."
if ! az functionapp show --name "$FUNCTION_APP_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo "Error: Function App '$FUNCTION_APP_NAME' not found in resource group '$RESOURCE_GROUP'"
    exit 1
fi

# Show current git status
echo ""
echo "Git status:"
git status --short

# Confirm deployment
echo ""
read -p "Deploy to Azure? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Deploy to Azure
echo ""
echo "Deploying to Azure Function App..."
func azure functionapp publish "$FUNCTION_APP_NAME" --python

# Check deployment status
if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "Deployment successful!"
    echo "=========================================="
    echo ""
    echo "Health check: https://${FUNCTION_APP_NAME}.azurewebsites.net/api/health"
    echo "Markets API: https://${FUNCTION_APP_NAME}.azurewebsites.net/api/markets"
    echo "Price API: https://${FUNCTION_APP_NAME}.azurewebsites.net/api/price/{token_id}"
    echo ""

    # Test health endpoint
    echo "Testing health endpoint..."
    sleep 5
    curl -s "https://${FUNCTION_APP_NAME}.azurewebsites.net/api/health" | python3 -m json.tool || echo "Health check failed"

else
    echo ""
    echo "=========================================="
    echo "Deployment failed!"
    echo "=========================================="
    exit 1
fi
