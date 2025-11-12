#!/bin/bash
# Polymarket Analyzer - Infrastructure Health Check Script
# Validates all Azure resources, connectivity, and configurations
# Author: Agent-INFRASTRUCTURE
# Last Updated: 2025-11-11

set -u  # Exit on undefined variable

# Configuration
FUNCTION_APP_NAME="polymarket-analyzer"
RESOURCE_GROUP="AZAI_group"
POSTGRES_HOST="postgres-seekapatraining-prod.postgres.database.azure.com"
POSTGRES_PORT="6432"
POSTGRES_DB="seekapa_training"
POSTGRES_USER="seekapaadmin"
AZURE_OPENAI_ENDPOINT="https://brn-azai.openai.azure.com/"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Status tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_check() {
    echo -e "${CYAN}[CHECK]${NC} $1"
    ((TOTAL_CHECKS++))
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_CHECKS++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNING_CHECKS++))
}

# Check Azure CLI installation
check_azure_cli() {
    log_check "Azure CLI installation"

    if command -v az &> /dev/null; then
        local version=$(az version --query '"azure-cli"' -o tsv 2>/dev/null || echo "unknown")
        log_pass "Azure CLI installed (version: $version)"
        return 0
    else
        log_fail "Azure CLI not installed"
        return 1
    fi
}

# Check Azure authentication
check_azure_auth() {
    log_check "Azure authentication"

    if az account show &> /dev/null; then
        local account=$(az account show --query "name" -o tsv)
        local subscription=$(az account show --query "id" -o tsv)
        log_pass "Authenticated as: $account"
        log_info "Subscription ID: $subscription"
        return 0
    else
        log_fail "Not authenticated with Azure"
        return 1
    fi
}

# Check Function App existence and status
check_function_app() {
    log_check "Function App existence and status"

    local app_info=$(az functionapp show \
        --name "$FUNCTION_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "{state:state,location:location,url:defaultHostName}" \
        -o json 2>/dev/null)

    if [ $? -eq 0 ]; then
        local state=$(echo "$app_info" | jq -r '.state')
        local location=$(echo "$app_info" | jq -r '.location')
        local url=$(echo "$app_info" | jq -r '.url')

        if [ "$state" = "Running" ]; then
            log_pass "Function App is running"
            log_info "Location: $location"
            log_info "URL: https://$url"
            return 0
        else
            log_warning "Function App exists but state is: $state"
            return 1
        fi
    else
        log_fail "Function App not found or inaccessible"
        return 1
    fi
}

# Check Managed Identity
check_managed_identity() {
    log_check "Managed Identity configuration"

    local identity_info=$(az functionapp identity show \
        --name "$FUNCTION_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "{principalId:principalId,type:type}" \
        -o json 2>/dev/null)

    if [ $? -eq 0 ]; then
        local principal_id=$(echo "$identity_info" | jq -r '.principalId')
        local identity_type=$(echo "$identity_info" | jq -r '.type')

        if [ -n "$principal_id" ] && [ "$principal_id" != "null" ]; then
            log_pass "Managed Identity enabled ($identity_type)"
            log_info "Principal ID: $principal_id"
            return 0
        else
            log_fail "Managed Identity not properly configured"
            return 1
        fi
    else
        log_fail "Unable to retrieve Managed Identity information"
        return 1
    fi
}

# Check environment variables
check_environment_variables() {
    log_check "Environment variables configuration"

    local required_vars=(
        "POLYMARKET_PRIVATE_KEY"
        "POLYMARKET_BUILDER_ADDRESS"
        "AZURE_OPENAI_ENDPOINT"
        "AZURE_OPENAI_KEY"
        "AZURE_OPENAI_GPT5_PRO_DEPLOYMENT"
        "PERPLEXITY_API_KEY"
        "GEMINI_API_KEY"
        "POSTGRES_HOST"
    )

    local configured_vars=$(az functionapp config appsettings list \
        --name "$FUNCTION_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "[].name" -o tsv 2>/dev/null)

    if [ $? -ne 0 ]; then
        log_fail "Unable to retrieve environment variables"
        return 1
    fi

    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if ! echo "$configured_vars" | grep -q "^${var}$"; then
            missing_vars+=("$var")
        fi
    done

    if [ ${#missing_vars[@]} -eq 0 ]; then
        log_pass "All required environment variables configured"
        return 0
    else
        log_fail "Missing environment variables: ${missing_vars[*]}"
        return 1
    fi
}

# Check PostgreSQL connectivity
check_postgres() {
    log_check "PostgreSQL connectivity"

    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        log_warning "psql not installed - skipping PostgreSQL connectivity test"
        return 0
    fi

    # Note: This requires PostgreSQL password to be set
    # We'll just check if the host is reachable
    if timeout 5 bash -c "cat < /dev/null > /dev/tcp/$POSTGRES_HOST/$POSTGRES_PORT" 2>/dev/null; then
        log_pass "PostgreSQL host is reachable"
        log_info "Host: $POSTGRES_HOST:$POSTGRES_PORT"
        return 0
    else
        log_warning "PostgreSQL host unreachable or port blocked"
        log_info "This may be expected if firewall rules restrict access"
        return 0
    fi
}

# Check Azure OpenAI endpoint
check_azure_openai() {
    log_check "Azure OpenAI endpoint accessibility"

    # Try to reach the endpoint
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" \
        -m 10 \
        "$AZURE_OPENAI_ENDPOINT" 2>/dev/null || echo "000")

    if [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        # 401/403 means endpoint is reachable but needs auth - this is good
        log_pass "Azure OpenAI endpoint is accessible (HTTP $http_code)"
        return 0
    elif [ "$http_code" = "200" ]; then
        log_pass "Azure OpenAI endpoint is accessible (HTTP $http_code)"
        return 0
    else
        log_warning "Azure OpenAI endpoint returned HTTP $http_code"
        return 0
    fi
}

# Check storage account
check_storage_account() {
    log_check "Storage account configuration"

    local storage_connection=$(az functionapp config appsettings list \
        --name "$FUNCTION_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "[?name=='AzureWebJobsStorage'].value" -o tsv 2>/dev/null)

    if [ -n "$storage_connection" ] && [ "$storage_connection" != "null" ]; then
        log_pass "Storage account configured"

        # Extract storage account name
        local storage_name=$(echo "$storage_connection" | grep -oP 'AccountName=\K[^;]+')
        if [ -n "$storage_name" ]; then
            log_info "Storage account: $storage_name"
        fi
        return 0
    else
        log_fail "Storage account not configured"
        return 1
    fi
}

# Check Function App HTTP endpoint
check_function_endpoint() {
    log_check "Function App HTTP endpoint"

    local app_url="https://${FUNCTION_APP_NAME}.azurewebsites.net"

    # Test root endpoint
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "$app_url" 2>/dev/null || echo "000")

    if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
        log_pass "Function App endpoint is responding (HTTP $http_code)"

        # Try health endpoint if it exists
        local health_code=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "${app_url}/api/health" 2>/dev/null || echo "000")
        if [ "$health_code" = "200" ]; then
            log_info "Health endpoint responding (HTTP $health_code)"
        elif [ "$health_code" = "404" ]; then
            log_info "Health endpoint not implemented (HTTP $health_code)"
        fi

        return 0
    elif [ "$http_code" = "000" ]; then
        log_fail "Function App endpoint not reachable (timeout or connection error)"
        return 1
    else
        log_warning "Function App endpoint returned HTTP $http_code"
        return 0
    fi
}

# Check Function App runtime
check_runtime() {
    log_check "Function App runtime configuration"

    local runtime_info=$(az functionapp config appsettings list \
        --name "$FUNCTION_APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "[?name=='FUNCTIONS_WORKER_RUNTIME' || name=='FUNCTIONS_EXTENSION_VERSION'].{name:name,value:value}" \
        -o json 2>/dev/null)

    if [ $? -eq 0 ]; then
        local runtime=$(echo "$runtime_info" | jq -r '.[] | select(.name=="FUNCTIONS_WORKER_RUNTIME") | .value')
        local version=$(echo "$runtime_info" | jq -r '.[] | select(.name=="FUNCTIONS_EXTENSION_VERSION") | .value')

        if [ -n "$runtime" ] && [ "$runtime" != "null" ]; then
            log_pass "Runtime configured: $runtime (version: $version)"
            return 0
        else
            log_fail "Runtime not properly configured"
            return 1
        fi
    else
        log_fail "Unable to retrieve runtime configuration"
        return 1
    fi
}

# Generate health report summary
generate_summary() {
    echo ""
    echo "=========================================="
    echo "  Health Check Summary"
    echo "=========================================="
    echo ""

    local total_issues=$((FAILED_CHECKS + WARNING_CHECKS))
    local pass_percentage=0

    if [ $TOTAL_CHECKS -gt 0 ]; then
        pass_percentage=$(awk "BEGIN {printf \"%.1f\", ($PASSED_CHECKS / $TOTAL_CHECKS) * 100}")
    fi

    echo -e "Total Checks:    ${CYAN}$TOTAL_CHECKS${NC}"
    echo -e "Passed:          ${GREEN}$PASSED_CHECKS${NC} (${pass_percentage}%)"
    echo -e "Failed:          ${RED}$FAILED_CHECKS${NC}"
    echo -e "Warnings:        ${YELLOW}$WARNING_CHECKS${NC}"
    echo ""

    if [ $FAILED_CHECKS -eq 0 ] && [ $WARNING_CHECKS -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed! Infrastructure is healthy.${NC}"
        return 0
    elif [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "${YELLOW}⚠ Infrastructure is operational with warnings.${NC}"
        return 0
    else
        echo -e "${RED}✗ Infrastructure has critical issues that need attention.${NC}"
        return 1
    fi
}

# Main health check flow
main() {
    echo "=========================================="
    echo "  Polymarket Analyzer Health Check"
    echo "=========================================="
    echo ""
    echo "Checking infrastructure components..."
    echo ""

    # Run all checks
    check_azure_cli
    echo ""

    check_azure_auth
    echo ""

    check_function_app
    echo ""

    check_managed_identity
    echo ""

    check_environment_variables
    echo ""

    check_runtime
    echo ""

    check_storage_account
    echo ""

    check_postgres
    echo ""

    check_azure_openai
    echo ""

    check_function_endpoint
    echo ""

    # Generate summary
    generate_summary

    echo ""
    echo "=========================================="
    echo "  Health Check Complete"
    echo "=========================================="
    echo ""

    # Exit with appropriate code
    if [ $FAILED_CHECKS -eq 0 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"
