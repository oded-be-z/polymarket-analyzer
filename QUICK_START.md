# Quick Start Guide - Deployment Orchestration

## TL;DR - Deploy Everything Now

```bash
cd ~/polymarket-worktrees/07-deployment
cp .env.example .env
# Edit .env with your credentials
bash deploy-all.sh
```

## One-Liners

### Deploy

```bash
# Full deployment (database, backend, frontend)
bash deploy-all.sh

# Database only
bash scripts/deploy-database.sh

# Backend only
bash scripts/deploy-backend.sh

# Frontend only
bash scripts/deploy-frontend.sh
```

### Test

```bash
# Health checks
bash scripts/health-check-all.sh

# API tests
bash integration-tests/test-api-flow.sh

# UI tests
bash integration-tests/test-ui-flow.sh
```

### Merge

```bash
# Check conflicts
python3 scripts/check-conflicts.py

# Merge all branches
bash scripts/merge-all-branches.sh

# Generate report
python3 scripts/generate-report.py
```

### Monitor

```bash
# View backend logs
az webapp log tail --name polymarket-analyzer --resource-group AZAI_group

# Check Function App status
az functionapp show --name polymarket-analyzer --resource-group AZAI_group --query "state"

# Test health endpoint
curl https://polymarket-analyzer.azurewebsites.net/api/health
```

### Emergency

```bash
# Rollback
bash scripts/rollback.sh

# Restart Function App
az functionapp restart --name polymarket-analyzer --resource-group AZAI_group

# Check database
psql "$CONNECTION_STRING" -c "SELECT 1;"
```

## Environment Setup (First Time Only)

```bash
# 1. Install tools
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
npm install -g azure-functions-core-tools@4
sudo apt-get install postgresql-client jq

# 2. Login
az login

# 3. Configure
cd ~/polymarket-worktrees/07-deployment
cp .env.example .env
nano .env  # Fill in your credentials
source .env
```

## Required Environment Variables

```bash
# Azure
FUNCTION_APP_NAME=polymarket-analyzer
RESOURCE_GROUP=AZAI_group
STATIC_APP_NAME=polymarket-web-ui

# Database
DB_HOST=postgres-seekapatraining-prod.postgres.database.azure.com
DB_PORT=6432
DB_NAME=polymarket_analyzer
DB_USER=seekapaadmin
DB_PASSWORD=your_password

# APIs
POLYMARKET_API_KEY=your_key
OPENAI_API_KEY=your_key
```

## Common Workflows

### First Deployment

```bash
cd ~/polymarket-worktrees/07-deployment
source .env
bash scripts/deploy-database.sh
bash scripts/deploy-backend.sh
bash scripts/deploy-frontend.sh
bash scripts/health-check-all.sh
```

### Update Deployment

```bash
cd ~/polymarket-worktrees/07-deployment
git pull origin feature/poly-deployment
bash deploy-all.sh
```

### Emergency Fix

```bash
cd ~/polymarket-worktrees/07-deployment
bash scripts/rollback.sh
# Fix the issue
bash scripts/deploy-backend.sh
bash scripts/health-check-all.sh
```

## Key Files

```
deploy-all.sh                    # Master deployment
scripts/health-check-all.sh      # Verify everything
scripts/merge-all-branches.sh    # Merge all agents
docs/DEPLOYMENT_GUIDE.md         # Full docs
DELIVERY_SUMMARY.md              # What we built
```

## URLs

```bash
# Backend API
https://polymarket-analyzer.azurewebsites.net/api

# Frontend
https://polymarket-web-ui.azurewebsites.net

# Health Check
https://polymarket-analyzer.azurewebsites.net/api/health
```

## Troubleshooting

```bash
# Health check fails?
az functionapp restart --name polymarket-analyzer --resource-group AZAI_group

# Database connection error?
psql "$CONNECTION_STRING" -c "SELECT 1;"

# Frontend not loading?
bash scripts/deploy-frontend.sh

# Merge conflicts?
python3 scripts/check-conflicts.py
```

## Help

```bash
# View deployment guide
cat docs/DEPLOYMENT_GUIDE.md | less

# View operations guide
cat docs/OPERATIONS.md | less

# Generate validation report
python3 scripts/generate-report.py
```

## Success Criteria

✅ All health checks pass
✅ API returns 200 OK
✅ Frontend loads
✅ Database has tables
✅ Integration tests pass

---

**Need more details?** See `README.md` or `docs/DEPLOYMENT_GUIDE.md`
