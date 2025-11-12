# Operations Guide - Polymarket Analyzer

## Overview

This guide covers day-to-day operations, monitoring, troubleshooting, and maintenance procedures for the Polymarket Analyzer platform.

## Table of Contents

1. [Monitoring](#monitoring)
2. [Common Issues](#common-issues)
3. [Performance Tuning](#performance-tuning)
4. [Maintenance](#maintenance)
5. [Security](#security)
6. [Backup & Recovery](#backup--recovery)
7. [Scaling](#scaling)
8. [Cost Management](#cost-management)

## Monitoring

### Daily Checks

**Morning Health Check:**
```bash
cd ~/polymarket-worktrees/07-deployment
bash scripts/health-check-all.sh
```

**Key Metrics to Review:**
- API response time (target: < 500ms p95)
- Error rate (target: < 1%)
- Database connections (monitor for leaks)
- Memory usage (alert if > 85%)
- Request rate

### Application Insights Dashboard

**Access:**
```bash
# Open in browser
az monitor app-insights component show \
  --app polymarket-analyzer \
  --resource-group AZAI_group \
  --query "appId" -o tsv
```

**Key Dashboards:**
1. **Performance** - Response times, throughput
2. **Failures** - Exceptions, failed requests
3. **Availability** - Uptime, health checks
4. **Usage** - Active users, popular features

### Log Analysis

**View Real-Time Logs:**
```bash
# Backend logs
az webapp log tail \
  --name polymarket-analyzer \
  --resource-group AZAI_group

# Specific function logs
az functionapp function show \
  --name polymarket-analyzer \
  --resource-group AZAI_group \
  --function-name get_markets
```

**Common Log Queries:**

See `monitoring/application-insights-queries.txt` for full list.

Example - Recent errors:
```kusto
exceptions
| where timestamp > ago(1h)
| project timestamp, type, outerMessage
| order by timestamp desc
| take 50
```

### Alert Configuration

**Active Alerts:**
- High error rate (> 5% in 5 min)
- Slow response time (> 2s p95)
- Database connection failures
- Health check failures
- No requests in 10 minutes

**Configure Alerts:**
```bash
# Import alert rules
az monitor scheduled-query create \
  --name "High Error Rate" \
  --resource-group AZAI_group \
  --condition "count > 5" \
  --description "Alert when error rate exceeds 5%"
```

## Common Issues

### Issue: High API Latency

**Symptoms:**
- Response times > 2 seconds
- Timeouts
- User complaints

**Diagnosis:**
```bash
# Check database query performance
psql "$CONNECTION_STRING" -c "
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Check Function App metrics
az monitor metrics list \
  --resource polymarket-analyzer \
  --resource-type Microsoft.Web/sites \
  --metric AverageResponseTime
```

**Solutions:**
1. **Add database indexes:**
   ```sql
   CREATE INDEX idx_markets_created ON markets(created_at);
   ```

2. **Optimize queries:**
   - Add WHERE clauses
   - Limit result sets
   - Use pagination

3. **Enable caching:**
   - Redis for frequently accessed data
   - CDN for static assets

4. **Scale up Function App:**
   ```bash
   az functionapp update \
     --name polymarket-analyzer \
     --resource-group AZAI_group \
     --set properties.instanceCount=2
   ```

### Issue: Database Connection Errors

**Symptoms:**
- "Too many connections" errors
- Connection timeouts
- Intermittent failures

**Diagnosis:**
```bash
# Check active connections
psql "$CONNECTION_STRING" -c "
  SELECT count(*) as active_connections,
         state
  FROM pg_stat_activity
  GROUP BY state;
"

# Check connection limits
psql "$CONNECTION_STRING" -c "SHOW max_connections;"
```

**Solutions:**
1. **Connection pooling** (PgBouncer already configured):
   - Verify using port 6432
   - Check pool size settings

2. **Fix connection leaks:**
   ```python
   # Always close connections
   try:
       conn = psycopg2.connect(...)
       # Use connection
   finally:
       conn.close()
   ```

3. **Increase connection limit:**
   ```bash
   az postgres server update \
     --resource-group AZAI_group \
     --name postgres-seekapatraining-prod \
     --max-connections 200
   ```

### Issue: Frontend Not Loading

**Symptoms:**
- Blank page
- 404 errors
- Static assets missing

**Diagnosis:**
```bash
# Check Static Web App status
az staticwebapp show \
  --name polymarket-web-ui \
  --resource-group AZAI_group \
  --query "defaultHostname"

# Test homepage
curl -I https://polymarket-web-ui.azurewebsites.net
```

**Solutions:**
1. **Redeploy frontend:**
   ```bash
   cd ~/polymarket-worktrees/07-deployment
   bash scripts/deploy-frontend.sh
   ```

2. **Clear CDN cache:**
   ```bash
   az cdn endpoint purge \
     --content-paths "/*" \
     --profile-name your-cdn-profile \
     --name your-endpoint
   ```

3. **Check API configuration:**
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check CORS settings

### Issue: Function App Cold Start

**Symptoms:**
- First request takes > 5 seconds
- Timeout on initial API call

**Solutions:**
1. **Enable Always On:**
   ```bash
   az functionapp config set \
     --name polymarket-analyzer \
     --resource-group AZAI_group \
     --always-on true
   ```

2. **Implement warmup function:**
   ```python
   # warmup/__init__.py
   import azure.functions as func

   def main(req: func.HttpRequest) -> func.HttpResponse:
       # Warmup logic
       return func.HttpResponse("Warmed up", status_code=200)
   ```

3. **Use Premium plan:**
   - Provides pre-warmed instances
   - Eliminates cold starts

## Performance Tuning

### Database Optimization

**1. Index Analysis:**
```sql
-- Find missing indexes
SELECT schemaname, tablename, attname
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.5
ORDER BY schemaname, tablename;

-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_markets_status ON markets(status);
CREATE INDEX CONCURRENTLY idx_prices_timestamp ON prices(timestamp DESC);
```

**2. Query Optimization:**
```sql
-- Use EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM markets WHERE status = 'active';

-- Add query hints
/*+ IndexScan(markets idx_markets_status) */
SELECT * FROM markets WHERE status = 'active';
```

**3. Vacuum & Analyze:**
```bash
# Schedule regular maintenance
psql "$CONNECTION_STRING" -c "VACUUM ANALYZE;"
```

### API Optimization

**1. Enable Compression:**
```python
# function_app.py
from azure.functions import HttpResponse
import gzip

def compress_response(data):
    return gzip.compress(data.encode())

# In function:
compressed = compress_response(json.dumps(result))
return HttpResponse(compressed, headers={"Content-Encoding": "gzip"})
```

**2. Implement Caching:**
```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_market_data(market_id):
    # Cached for 5 minutes
    return fetch_from_db(market_id)
```

**3. Pagination:**
```python
# Always paginate large datasets
def get_markets(page=1, per_page=20):
    offset = (page - 1) * per_page
    query = "SELECT * FROM markets LIMIT %s OFFSET %s"
    return execute_query(query, (per_page, offset))
```

### Frontend Optimization

**1. Code Splitting:**
```javascript
// Next.js dynamic imports
const MarketChart = dynamic(() => import('./MarketChart'), {
  loading: () => <p>Loading...</p>,
  ssr: false
});
```

**2. Image Optimization:**
```javascript
import Image from 'next/image';

<Image
  src="/market-icon.png"
  width={100}
  height={100}
  alt="Market"
  loading="lazy"
/>
```

**3. API Request Batching:**
```javascript
// Batch multiple requests
const [markets, prices, sentiment] = await Promise.all([
  fetch('/api/markets'),
  fetch('/api/prices'),
  fetch('/api/sentiment')
]);
```

## Maintenance

### Regular Tasks

**Daily:**
- Review health check results
- Check error logs
- Monitor resource usage
- Verify backups completed

**Weekly:**
- Analyze performance trends
- Review and tune alerts
- Check for security updates
- Clean up old logs

**Monthly:**
- Database maintenance (VACUUM FULL)
- Review and optimize indexes
- Audit access logs
- Update dependencies
- Cost optimization review

### Scheduled Maintenance Window

**Planning:**
1. Choose low-traffic time (2-4 AM UTC)
2. Notify users 48 hours in advance
3. Prepare rollback plan
4. Test in staging first

**Procedure:**
```bash
# 1. Enable maintenance mode
az functionapp config appsettings set \
  --name polymarket-analyzer \
  --resource-group AZAI_group \
  --settings MAINTENANCE_MODE=true

# 2. Perform maintenance
bash scripts/deploy-database.sh
bash scripts/deploy-backend.sh

# 3. Run tests
bash scripts/health-check-all.sh

# 4. Disable maintenance mode
az functionapp config appsettings set \
  --name polymarket-analyzer \
  --resource-group AZAI_group \
  --settings MAINTENANCE_MODE=false
```

## Security

### Best Practices

1. **Rotate Secrets Regularly:**
   ```bash
   # Update in Key Vault
   az keyvault secret set \
     --vault-name kv-seekapatraining \
     --name DB_PASSWORD \
     --value "new_password"

   # Update Function App
   az functionapp config appsettings set \
     --name polymarket-analyzer \
     --resource-group AZAI_group \
     --settings DB_PASSWORD="new_password"
   ```

2. **Review Access Logs:**
   ```kusto
   requests
   | where timestamp > ago(24h)
   | where resultCode in (401, 403)
   | summarize count() by client_IP
   | order by count_ desc
   ```

3. **Enable Managed Identity:**
   ```bash
   az functionapp identity assign \
     --name polymarket-analyzer \
     --resource-group AZAI_group
   ```

4. **Configure Firewall Rules:**
   ```bash
   # PostgreSQL firewall
   az postgres server firewall-rule create \
     --resource-group AZAI_group \
     --server postgres-seekapatraining-prod \
     --name AllowAzureServices \
     --start-ip-address 0.0.0.0 \
     --end-ip-address 0.0.0.0
   ```

### Security Monitoring

**Check for vulnerabilities:**
```bash
# Scan dependencies
npm audit
pip-audit

# Update vulnerable packages
npm audit fix
pip install --upgrade package-name
```

## Backup & Recovery

### Database Backups

**Automated Backups:**
```bash
# PostgreSQL automatic backups (Azure default: 7 days)
az postgres server show \
  --resource-group AZAI_group \
  --name postgres-seekapatraining-prod \
  --query "backupRetentionDays"
```

**Manual Backup:**
```bash
# Full backup
pg_dump "$CONNECTION_STRING" > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump --schema-only "$CONNECTION_STRING" > schema_$(date +%Y%m%d).sql

# Data only
pg_dump --data-only "$CONNECTION_STRING" > data_$(date +%Y%m%d).sql
```

**Restore:**
```bash
# Restore database
psql "$CONNECTION_STRING" < backup_20250112.sql

# Restore specific table
pg_restore -t markets "$CONNECTION_STRING" backup.dump
```

### Application Backups

**Code:**
- Git repository (always up to date)
- GitHub automatic backups

**Configuration:**
```bash
# Export Function App settings
az functionapp config appsettings list \
  --name polymarket-analyzer \
  --resource-group AZAI_group \
  > settings_backup_$(date +%Y%m%d).json
```

## Scaling

### Horizontal Scaling

**Function App:**
```bash
# Increase instances
az functionapp plan update \
  --name ASP-AZAIgroup-9f42 \
  --resource-group AZAI_group \
  --max-burst 10

# Auto-scaling rules
az monitor autoscale create \
  --resource-group AZAI_group \
  --resource polymarket-analyzer \
  --min-count 1 \
  --max-count 5 \
  --count 2
```

### Vertical Scaling

**Database:**
```bash
# Upgrade PostgreSQL tier
az postgres server update \
  --resource-group AZAI_group \
  --name postgres-seekapatraining-prod \
  --sku-name GP_Gen5_4
```

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 https://polymarket-analyzer.azurewebsites.net/api/markets

# Using Artillery
artillery quick --count 10 --num 100 https://polymarket-analyzer.azurewebsites.net/api/markets
```

## Cost Management

### Monitor Costs

```bash
# View cost analysis
az consumption usage list \
  --billing-period-name current \
  --query "[?resourceGroup=='AZAI_group']"

# Set budget alerts
az consumption budget create \
  --budget-name polymarket-budget \
  --amount 200 \
  --time-grain Monthly \
  --resource-group AZAI_group
```

### Cost Optimization

1. **Right-size resources** based on usage
2. **Use reserved instances** for predictable workload
3. **Enable auto-shutdown** for dev/test environments
4. **Clean up unused resources**
5. **Use consumption plan** for low-traffic APIs

### Resource Cleanup

```bash
# Find unused resources
az resource list \
  --resource-group AZAI_group \
  --query "[?tags.environment=='dev']"

# Delete old function versions
az functionapp deployment source delete \
  --name polymarket-analyzer \
  --resource-group AZAI_group \
  --id old-deployment-id
```

## On-Call Procedures

### Incident Response

1. **Acknowledge alert** (within 5 minutes)
2. **Assess severity** (P1-P4)
3. **Investigate logs** and metrics
4. **Implement fix** or workaround
5. **Verify resolution**
6. **Document incident**
7. **Post-mortem** (for P1/P2)

### Emergency Contacts

- **DevOps Lead:** [Contact info]
- **Database Admin:** [Contact info]
- **On-Call Engineer:** [Rotation schedule]
- **Azure Support:** [Support plan details]

### Escalation Matrix

- **P1 (Critical):** Immediate escalation, all hands
- **P2 (High):** Escalate after 30 minutes
- **P3 (Medium):** Escalate after 2 hours
- **P4 (Low):** Next business day

## Documentation

Keep updated:
- Architecture diagrams
- Runbooks for common tasks
- Incident response procedures
- Change logs
- Known issues

## Useful Commands Reference

```bash
# Quick health check
curl https://polymarket-analyzer.azurewebsites.net/api/health

# Restart Function App
az functionapp restart --name polymarket-analyzer --resource-group AZAI_group

# View logs
az webapp log tail --name polymarket-analyzer --resource-group AZAI_group

# Check database connections
psql "$CONNECTION_STRING" -c "SELECT count(*) FROM pg_stat_activity;"

# Deploy updates
bash ~/polymarket-worktrees/07-deployment/deploy-all.sh

# Run health checks
bash ~/polymarket-worktrees/07-deployment/scripts/health-check-all.sh

# Emergency rollback
bash ~/polymarket-worktrees/07-deployment/scripts/rollback.sh
```
