# Deployment Guide - Polymarket Analyzer

## Overview

This guide covers the complete deployment process for the Polymarket Analyzer application, including database, backend API, and frontend UI.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Deployment](#database-deployment)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

## Prerequisites

### Required Tools

- **Azure CLI** (`az`): For Azure resource management
- **Azure Functions Core Tools** (`func`): For Function App deployment
- **PostgreSQL Client** (`psql`): For database operations
- **Node.js & npm**: For frontend build
- **Git**: For version control
- **jq**: For JSON parsing (optional but recommended)

### Install Tools

```bash
# Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Azure Functions Core Tools
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# PostgreSQL Client
sudo apt-get install postgresql-client

# Node.js (via nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# jq
sudo apt-get install jq
```

### Azure Login

```bash
az login
az account set --subscription "U-BTech - CSP (Z-Online)"
```

## Environment Setup

### 1. Create .env File

Create a `.env` file in the deployment directory:

```bash
cd ~/polymarket-worktrees/07-deployment

cat > .env << 'EOF'
# Function App
FUNCTION_APP_NAME=polymarket-analyzer
RESOURCE_GROUP=AZAI_group
LOCATION=swedencentral

# Static Web App
STATIC_APP_NAME=polymarket-web-ui

# Database
DB_HOST=postgres-seekapatraining-prod.postgres.database.azure.com
DB_PORT=6432
DB_NAME=polymarket_analyzer
DB_USER=seekapaadmin
DB_PASSWORD=your_password_here

# API Keys
POLYMARKET_API_KEY=your_polymarket_key
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
EOF
```

### 2. Load Environment

```bash
source .env
```

## Database Deployment

### 1. Verify Database Exists

```bash
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/postgres?sslmode=require" \
  -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';"
```

If database doesn't exist, create it:

```bash
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/postgres?sslmode=require" \
  -c "CREATE DATABASE $DB_NAME;"
```

### 2. Run Deployment Script

```bash
bash scripts/deploy-database.sh
```

This will:
- Connect to PostgreSQL
- Run migrations
- Create tables and indexes
- Load seed data (if available)
- Verify deployment

### 3. Verify Tables

```bash
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require" \
  -c "\dt"
```

Expected tables:
- `markets`
- `prices`
- `sentiment`
- `analysis`
- `users`
- `subscriptions`

## Backend Deployment

### 1. Verify Function App Exists

```bash
az functionapp show \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

If not found, create it:

```bash
bash ~/azure-automation/create-function-app.sh $FUNCTION_APP_NAME
```

### 2. Run Deployment Script

```bash
bash scripts/deploy-backend.sh
```

This will:
- Package backend functions
- Install dependencies
- Configure environment variables
- Deploy to Azure Functions
- Restart Function App
- Run health check

### 3. Verify Deployment

```bash
# Health check
curl https://${FUNCTION_APP_NAME}.azurewebsites.net/api/health

# List functions
az functionapp function list \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

## Frontend Deployment

### 1. Verify Static Web App Exists

```bash
az staticwebapp show \
  --name $STATIC_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

If not found, it will be created automatically.

### 2. Run Deployment Script

```bash
bash scripts/deploy-frontend.sh
```

This will:
- Build Next.js application
- Configure API URL
- Deploy to Static Web Apps
- Run health check

### 3. Verify Deployment

```bash
# Get URL
FRONTEND_URL=$(az staticwebapp show \
  --name $STATIC_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "defaultHostname" -o tsv)

# Test homepage
curl -I https://$FRONTEND_URL
```

## Master Deployment (All Components)

### Run Complete Deployment

```bash
bash deploy-all.sh
```

This orchestrates all deployments in the correct order:
1. Database
2. Backend
3. Frontend
4. Health checks

## Verification

### 1. Run Health Checks

```bash
bash scripts/health-check-all.sh
```

### 2. Run Integration Tests

```bash
# API tests
bash integration-tests/test-api-flow.sh

# UI tests
bash integration-tests/test-ui-flow.sh
```

### 3. Manual Verification

1. **Backend API:**
   - Visit: `https://polymarket-analyzer.azurewebsites.net/api/health`
   - Should return: `{"status": "healthy"}`

2. **Frontend:**
   - Get URL: `az staticwebapp show --name polymarket-web-ui --resource-group AZAI_group --query "defaultHostname" -o tsv`
   - Visit the URL in browser
   - Verify homepage loads
   - Check market listings

3. **Database:**
   ```bash
   psql "$CONNECTION_STRING" -c "SELECT COUNT(*) FROM markets;"
   ```

## Troubleshooting

### Backend Issues

**Health check fails:**
```bash
# Check Function App status
az functionapp show --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP --query "state"

# View logs
az webapp log tail --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP

# Restart Function App
az functionapp restart --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP
```

**Environment variables not set:**
```bash
# List current settings
az functionapp config appsettings list \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP

# Set missing variables
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings "KEY=value"
```

### Frontend Issues

**Build fails:**
```bash
# Check Node version
node --version

# Clear cache and reinstall
cd frontend
rm -rf node_modules .next
npm ci
npm run build
```

**API calls not working:**
- Verify `NEXT_PUBLIC_API_URL` in `.env.production`
- Check CORS settings in backend
- Inspect browser console for errors

### Database Issues

**Connection timeout:**
- Verify firewall rules allow your IP
- Check PostgreSQL is running
- Verify connection string

```bash
# Test connection
psql "$CONNECTION_STRING" -c "SELECT 1;"
```

**Migration fails:**
```bash
# Check current schema
psql "$CONNECTION_STRING" -c "\dt"

# Manually run migration
psql "$CONNECTION_STRING" -f migrations/001_initial_schema.sql
```

## Rollback Procedures

### Automated Rollback

```bash
bash scripts/rollback.sh
```

This will:
- Stop Function App
- Log rollback reason
- Provide manual rollback steps

### Manual Rollback Steps

1. **Identify Stable Commit:**
   ```bash
   git log --oneline -10
   ```

2. **Checkout Stable Commit:**
   ```bash
   git checkout <commit-hash>
   ```

3. **Redeploy Backend:**
   ```bash
   bash scripts/deploy-backend.sh
   ```

4. **Redeploy Frontend:**
   ```bash
   bash scripts/deploy-frontend.sh
   ```

5. **Start Function App:**
   ```bash
   az functionapp start --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP
   ```

6. **Verify:**
   ```bash
   bash scripts/health-check-all.sh
   ```

### Database Rollback

**WARNING:** Database rollback is destructive. Always backup first.

```bash
# Create backup
pg_dump "$CONNECTION_STRING" > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql "$CONNECTION_STRING" < backup_YYYYMMDD_HHMMSS.sql
```

## CI/CD Integration

GitHub Actions workflows are configured in `.github/workflows/`:

- `deploy-backend.yml` - Backend deployment
- `deploy-frontend.yml` - Frontend deployment
- `test-integration.yml` - Integration tests

### Required Secrets

Configure in GitHub repository settings:

```
AZURE_CREDENTIALS
AZURE_FUNCTIONAPP_PUBLISH_PROFILE
AZURE_STATIC_WEB_APPS_API_TOKEN
DB_HOST
DB_NAME
DB_USER
DB_PASSWORD
DB_PORT
POLYMARKET_API_KEY
OPENAI_API_KEY
```

## Monitoring

### Application Insights

View metrics and logs:
```bash
# Open Application Insights
az monitor app-insights component show \
  --app $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

### Log Queries

See `monitoring/application-insights-queries.txt` for common queries.

### Alerts

Configure alerts using `monitoring/alert-rules.json`.

## Best Practices

1. **Always test in staging first** (if available)
2. **Run health checks** after every deployment
3. **Monitor logs** for first 30 minutes post-deployment
4. **Keep backups** before major changes
5. **Document** any manual configuration changes
6. **Test rollback procedures** in non-production environment

## Support

For issues or questions:
- Check logs: `az webapp log tail --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP`
- Review Application Insights
- Contact DevOps team

## Next Steps

After successful deployment:
1. Configure monitoring and alerts
2. Set up automated backups
3. Implement CI/CD pipelines
4. Conduct load testing
5. Document operational procedures
