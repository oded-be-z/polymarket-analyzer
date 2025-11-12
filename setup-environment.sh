#!/bin/bash
# Polymarket Analyzer - Environment Setup Script
# Sets up local development environment with all required dependencies
# Author: Agent-INFRASTRUCTURE
# Last Updated: 2025-11-11

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "=========================================="
echo "  Polymarket Analyzer - Environment Setup"
echo "=========================================="
echo ""

# Check sudo access
log_info "Checking sudo access..."
if sudo -v; then
    log_success "Sudo access confirmed"
else
    log_error "Sudo access required"
    exit 1
fi

# Update package lists
log_info "Updating package lists..."
sudo apt-get update -qq

# Install Azure CLI
log_info "Installing Azure CLI..."
if command -v az &> /dev/null; then
    log_success "Azure CLI already installed"
else
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
    log_success "Azure CLI installed"
fi

# Install Python 3.12
log_info "Installing Python 3.12..."
if command -v python3.12 &> /dev/null; then
    log_success "Python 3.12 already installed"
else
    sudo apt-get install -y python3.12 python3.12-venv python3-pip
    log_success "Python 3.12 installed"
fi

# Install Node.js 18
log_info "Installing Node.js 18..."
if command -v node &> /dev/null; then
    log_success "Node.js already installed ($(node --version))"
else
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    log_success "Node.js installed"
fi

# Install PostgreSQL client
log_info "Installing PostgreSQL client..."
if command -v psql &> /dev/null; then
    log_success "PostgreSQL client already installed"
else
    sudo apt-get install -y postgresql-client
    log_success "PostgreSQL client installed"
fi

# Install jq for JSON parsing
log_info "Installing jq..."
if command -v jq &> /dev/null; then
    log_success "jq already installed"
else
    sudo apt-get install -y jq
    log_success "jq installed"
fi

# Install Azure Functions Core Tools
log_info "Installing Azure Functions Core Tools..."
if command -v func &> /dev/null; then
    log_success "Azure Functions Core Tools already installed"
else
    wget -q https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb
    sudo dpkg -i packages-microsoft-prod.deb
    rm packages-microsoft-prod.deb
    sudo apt-get update -qq
    sudo apt-get install -y azure-functions-core-tools-4
    log_success "Azure Functions Core Tools installed"
fi

# Install Azure Static Web Apps CLI
log_info "Installing Azure Static Web Apps CLI..."
if command -v swa &> /dev/null; then
    log_success "SWA CLI already installed"
else
    sudo npm install -g @azure/static-web-apps-cli
    log_success "SWA CLI installed"
fi

# Create Python virtual environment
log_info "Creating Python virtual environment..."
if [ ! -d "venv" ]; then
    python3.12 -m venv venv
    log_success "Virtual environment created"
else
    log_success "Virtual environment already exists"
fi

# Activate and install Python dependencies
log_info "Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip -q
pip install azure-functions azure-identity psycopg2-binary openai requests -q
log_success "Python dependencies installed"

echo ""
echo "=========================================="
echo "  Environment Setup Complete"
echo "=========================================="
echo ""

log_success "All dependencies installed successfully!"
echo ""
log_info "Next steps:"
echo "  1. Authenticate with Azure: az login"
echo "  2. Run health check: ./health-check.sh"
echo "  3. Deploy backend: ./deploy-backend.sh"
echo "  4. Deploy frontend: ./deploy-frontend.sh"
echo ""
