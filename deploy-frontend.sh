#!/bin/bash
# Polymarket Analyzer - Frontend Deployment Script
# Deploys Next.js application to Azure Static Web Apps
# Author: Agent-INFRASTRUCTURE
# Last Updated: 2025-11-11

set -e  # Exit on error
set -u  # Exit on undefined variable

# Configuration
STATIC_WEB_APP_NAME="polymarket-analyzer-frontend"
RESOURCE_GROUP="AZAI_group"
LOCATION="swedencentral"
FRONTEND_DIR="../frontend"  # Relative to this script's location
BUILD_DIR="${FRONTEND_DIR}/out"
SKU="Free"  # Free tier for Static Web Apps
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

# Check if Node.js is installed
check_nodejs() {
    log_info "Checking Node.js installation..."

    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install it first:"
        echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
        echo "  sudo apt-get install -y nodejs"
        exit 1
    fi

    local node_version=$(node --version)
    log_success "Node.js is installed: $node_version"
}

# Check if npm is installed
check_npm() {
    log_info "Checking npm installation..."

    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install Node.js with npm."
        exit 1
    fi

    local npm_version=$(npm --version)
    log_success "npm is installed: v$npm_version"
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

# Check if frontend directory exists
check_frontend_dir() {
    log_info "Checking frontend directory..."

    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "Frontend directory not found: $FRONTEND_DIR"
        log_info "Please ensure the frontend code is in the correct location"
        exit 1
    fi

    log_success "Frontend directory found: $FRONTEND_DIR"
}

# Install dependencies
install_dependencies() {
    log_info "Installing npm dependencies..."

    cd "$FRONTEND_DIR"

    if [ ! -f "package.json" ]; then
        log_error "package.json not found in $FRONTEND_DIR"
        exit 1
    fi

    if ! retry_command "npm install --production=false" "npm install"; then
        log_error "Failed to install dependencies"
        exit 1
    fi

    cd - > /dev/null

    log_success "Dependencies installed successfully"
}

# Build Next.js application
build_frontend() {
    log_info "Building Next.js application..."

    cd "$FRONTEND_DIR"

    # Check for next.config.js
    if [ ! -f "next.config.js" ] && [ ! -f "next.config.mjs" ]; then
        log_warning "next.config.js not found - creating default configuration"

        cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
EOF
    fi

    # Build the application
    if ! retry_command "npm run build" "Next.js build"; then
        log_error "Build failed"
        cd - > /dev/null
        exit 1
    fi

    cd - > /dev/null

    # Verify build output
    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Build output directory not found: $BUILD_DIR"
        exit 1
    fi

    local file_count=$(find "$BUILD_DIR" -type f | wc -l)
    log_success "Build completed successfully ($file_count files generated)"
}

# Create or update Static Web App
ensure_static_web_app() {
    log_info "Checking if Static Web App exists..."

    local app_exists=$(az staticwebapp show \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "name" -o tsv 2>/dev/null || echo "NOT_FOUND")

    if [ "$app_exists" = "NOT_FOUND" ]; then
        log_info "Static Web App not found. Creating..."

        if ! retry_command \
            "az staticwebapp create \
                --name '$STATIC_WEB_APP_NAME' \
                --resource-group '$RESOURCE_GROUP' \
                --location '$LOCATION' \
                --sku '$SKU' \
                &> /dev/null" \
            "Static Web App creation"; then
            log_error "Failed to create Static Web App"
            exit 1
        fi

        log_success "Static Web App created: $STATIC_WEB_APP_NAME"
    else
        log_success "Static Web App already exists: $STATIC_WEB_APP_NAME"
    fi
}

# Deploy to Static Web App
deploy_to_azure() {
    log_info "Deploying to Azure Static Web App..."

    # Get deployment token
    local deployment_token=$(az staticwebapp secrets list \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.apiKey" -o tsv)

    if [ -z "$deployment_token" ]; then
        log_error "Failed to retrieve deployment token"
        exit 1
    fi

    # Install SWA CLI if not available
    if ! command -v swa &> /dev/null; then
        log_info "Installing Azure Static Web Apps CLI..."
        npm install -g @azure/static-web-apps-cli
        log_success "SWA CLI installed"
    fi

    # Deploy using SWA CLI
    cd "$FRONTEND_DIR"

    if ! retry_command \
        "swa deploy ./out --deployment-token '$deployment_token' --env production" \
        "Static Web App deployment"; then
        log_error "Deployment failed"
        cd - > /dev/null
        exit 1
    fi

    cd - > /dev/null

    log_success "Deployment completed successfully"

    # Wait for deployment to propagate
    log_info "Waiting for deployment to propagate (10 seconds)..."
    sleep 10
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."

    # Get app URL
    local app_url=$(az staticwebapp show \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "defaultHostname" -o tsv)

    if [ -z "$app_url" ]; then
        log_warning "Could not retrieve app URL"
        return
    fi

    log_info "Static Web App URL: https://$app_url"

    # Test HTTP endpoint
    log_info "Testing endpoint: https://$app_url"

    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "https://$app_url" || echo "000")

    if [ "$http_code" = "200" ]; then
        log_success "Frontend is accessible (HTTP $http_code)"
    else
        log_warning "Frontend returned HTTP $http_code"
    fi
}

# Cleanup
cleanup() {
    log_info "Cleaning up..."

    # Clean npm cache (optional)
    # npm cache clean --force

    log_info "Cleanup completed"
}

# Main deployment flow
main() {
    echo "=========================================="
    echo " Polymarket Analyzer Frontend Deployment"
    echo "=========================================="
    echo ""

    # Pre-deployment checks
    check_azure_cli
    check_nodejs
    check_npm
    check_azure_auth
    check_frontend_dir

    echo ""
    echo "=========================================="
    echo "  Building Application"
    echo "=========================================="
    echo ""

    install_dependencies
    build_frontend

    echo ""
    echo "=========================================="
    echo "  Deploying to Azure"
    echo "=========================================="
    echo ""

    ensure_static_web_app
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

    local app_url=$(az staticwebapp show \
        --name "$STATIC_WEB_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "defaultHostname" -o tsv)

    log_success "Frontend deployment completed successfully!"
    log_info "Static Web App URL: https://$app_url"
    log_info "View in portal: https://portal.azure.com/#@318030de-752f-42b3-9848-abd6ec3809e3/resource/subscriptions/08b0ac81-a17e-421c-8c1b-41b59ee758a3/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.Web/staticSites/$STATIC_WEB_APP_NAME"

    cleanup

    exit 0
}

# Trap errors and cleanup
trap cleanup EXIT

# Run main function
main "$@"
