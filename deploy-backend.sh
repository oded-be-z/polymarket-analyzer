#!/bin/bash
# Polymarket Analyzer - Backend Deployment Script
# Deploys Python Azure Functions to polymarket-analyzer Function App
# Author: Agent-INFRASTRUCTURE
# Last Updated: 2025-11-11

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
FUNCTION_APP_NAME="polymarket-analyzer"
RESOURCE_GROUP="AZAI_group"
BACKEND_DIR="../backend"  # Relative to this script's location
DEPLOY_PACKAGE="deploy-package.zip"
MAX_RETRIES=3
RETRY_DELAY=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Retry function with exponential backoff
retry_command() {
    local command="$1"
    local description="$2"
    local attempt=1

    while [ $attempt -le $MAX_RETRIES ]; do
        log_info "Attempt $attempt/$MAX_RETRIES: $description"

        if eval "$command"; then
            log_success "$description completed successfully"
            return 0
        else
            if [ $attempt -lt $MAX_RETRIES ]; then
                local wait_time=$((RETRY_DELAY * attempt))
                log_warning "Failed. Retrying in ${wait_time}s..."
                sleep $wait_time
            else
                log_error "Failed after $MAX_RETRIES attempts: $description"
                return 1
            fi
        fi

        ((attempt++))
    done
}

# Check if Azure CLI is installed
check_azure_cli() {
    log_info "Checking Azure CLI installation..."

    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed. Please install it first:"
        echo "  curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
        exit 1
    fi

    log_success "Azure CLI is installed"
}

# Check Azure authentication
check_azure_auth() {
    log_info "Checking Azure authentication..."

    if ! retry_command "az account show &> /dev/null" "Azure authentication"; then
        log_error "Not authenticated with Azure. Please run: az login"
        exit 1
    fi

    local account_name=$(az account show --query "name" -o tsv)
    log_success "Authenticated as: $account_name"
}

# Verify Function App exists
check_function_app() {
    log_info "Verifying Function App exists..."

    local app_state=$(az functionapp show \
        --name "$FUNCTION_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "state" -o tsv 2>/dev/null || echo "NOT_FOUND")

    if [ "$app_state" = "NOT_FOUND" ]; then
        log_error "Function App '$FUNCTION_APP_NAME' not found in resource group '$RESOURCE_GROUP'"
        exit 1
    fi

    log_success "Function App exists (State: $app_state)"
}

# Check if backend directory exists
check_backend_dir() {
    log_info "Checking backend directory..."

    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "Backend directory not found: $BACKEND_DIR"
        log_info "Please ensure the backend code is in the correct location"
        exit 1
    fi

    log_success "Backend directory found: $BACKEND_DIR"
}

# Create deployment package
create_deployment_package() {
    log_info "Creating deployment package..."

    # Clean up old package
    if [ -f "$DEPLOY_PACKAGE" ]; then
        rm "$DEPLOY_PACKAGE"
        log_info "Removed old deployment package"
    fi

    # Create ZIP package
    cd "$BACKEND_DIR"

    # Check for requirements.txt
    if [ ! -f "requirements.txt" ]; then
        log_warning "requirements.txt not found in backend directory"
    fi

    # Create ZIP with all Python files and requirements
    zip -r "../01-infrastructure/$DEPLOY_PACKAGE" . \
        -x "*.pyc" \
        -x "__pycache__/*" \
        -x ".git/*" \
        -x ".env" \
        -x "venv/*" \
        -x "*.log" \
        &> /dev/null

    cd - > /dev/null

    if [ ! -f "$DEPLOY_PACKAGE" ]; then
        log_error "Failed to create deployment package"
        exit 1
    fi

    local package_size=$(du -h "$DEPLOY_PACKAGE" | cut -f1)
    log_success "Deployment package created: $DEPLOY_PACKAGE ($package_size)"
}

# Deploy to Azure Function App
deploy_to_azure() {
    log_info "Deploying to Azure Function App..."

    if ! retry_command \
        "az functionapp deployment source config-zip \
            --resource-group '$RESOURCE_GROUP' \
            --name '$FUNCTION_APP_NAME' \
            --src '$DEPLOY_PACKAGE' \
            --build-remote true \
            --timeout 600 \
            &> /dev/null" \
        "Deployment upload"; then
        log_error "Deployment failed"
        return 1
    fi

    log_success "Deployment completed successfully"

    # Wait for app to stabilize
    log_info "Waiting for app to stabilize (10 seconds)..."
    sleep 10
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."

    # Check app state
    local app_state=$(az functionapp show \
        --name "$FUNCTION_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "state" -o tsv)

    if [ "$app_state" != "Running" ]; then
        log_warning "Function App state: $app_state (expected: Running)"
    else
        log_success "Function App is running"
    fi

    # Try to ping health endpoint
    local app_url="https://${FUNCTION_APP_NAME}.azurewebsites.net"
    log_info "Testing health endpoint: ${app_url}/api/health"

    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "${app_url}/api/health" || echo "000")

    if [ "$http_code" = "200" ]; then
        log_success "Health endpoint responding (HTTP $http_code)"
    elif [ "$http_code" = "404" ]; then
        log_warning "Health endpoint not found (HTTP $http_code) - may need implementation"
    else
        log_warning "Health endpoint returned HTTP $http_code"
    fi
}

# Cleanup
cleanup() {
    log_info "Cleaning up..."

    if [ -f "$DEPLOY_PACKAGE" ]; then
        rm "$DEPLOY_PACKAGE"
        log_info "Removed deployment package"
    fi
}

# Main deployment flow
main() {
    echo "=========================================="
    echo "  Polymarket Analyzer Backend Deployment"
    echo "=========================================="
    echo ""

    # Pre-deployment checks
    check_azure_cli
    check_azure_auth
    check_function_app
    check_backend_dir

    echo ""
    echo "=========================================="
    echo "  Starting Deployment"
    echo "=========================================="
    echo ""

    # Deployment
    create_deployment_package
    deploy_to_azure

    echo ""
    echo "=========================================="
    echo "  Post-Deployment Verification"
    echo "=========================================="
    echo ""

    verify_deployment

    echo ""
    echo "=========================================="
    echo "  Deployment Complete"
    echo "=========================================="
    echo ""

    log_success "Backend deployment completed successfully!"
    log_info "Function App URL: https://${FUNCTION_APP_NAME}.azurewebsites.net"
    log_info "View logs: az webapp log tail --resource-group $RESOURCE_GROUP --name $FUNCTION_APP_NAME"

    cleanup

    exit 0
}

# Trap errors and cleanup
trap cleanup EXIT

# Run main function
main "$@"
