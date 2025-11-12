# Deployment Guide - Backend AI Services

This guide covers deploying the Polymarket Analyzer Backend AI services to Azure Functions.

## Prerequisites

1. Azure CLI installed and authenticated
2. Azure Functions Core Tools installed
3. Azure Function App created: `polymarket-analyzer`
4. API keys for:
   - Azure OpenAI GPT-5-Pro
   - Perplexity API
   - Google Gemini API
   - PostgreSQL database

## Step 1: Configure Environment Variables

Set environment variables in Azure Function App:

```bash
# Azure OpenAI
az functionapp config appsettings set \
  --name polymarket-analyzer \
  --resource-group AZAI_group \
  --settings \
    "AZURE_OPENAI_ENDPOINT=https://brn-azai.openai.azure.com/" \
    "GPT5_PRO_DEPLOYMENT_NAME=gpt-5-pro" \
    "GPT5_PRO_KEY=<your_key>"

# Perplexity API
az functionapp config appsettings set \
  --name polymarket-analyzer \
  --resource-group AZAI_group \
  --settings "PERPLEXITY_API_KEY=<your_key>"

# Google Gemini API
az functionapp config appsettings set \
  --name polymarket-analyzer \
  --resource-group AZAI_group \
  --settings "GEMINI_API_KEY=<your_key>"

# PostgreSQL
az functionapp config appsettings set \
  --name polymarket-analyzer \
  --resource-group AZAI_group \
  --settings "POSTGRES_CONNECTION_STRING=<your_connection_string>"
```

## Step 2: Enable Managed Identity (Optional but Recommended)

Enable Managed Identity for passwordless Azure OpenAI access:

```bash
# Enable Managed Identity
az functionapp identity assign \
  --name polymarket-analyzer \
  --resource-group AZAI_group

# Get the Principal ID from output
PRINCIPAL_ID=$(az functionapp identity show \
  --name polymarket-analyzer \
  --resource-group AZAI_group \
  --query principalId -o tsv)

# Grant Cognitive Services User role
az role assignment create \
  --assignee $PRINCIPAL_ID \
  --role "Cognitive Services User" \
  --scope /subscriptions/08b0ac81-a17e-421c-8c1b-41b59ee758a3/resourceGroups/AZAI_group/providers/Microsoft.CognitiveServices/accounts/brn-azai
```

## Step 3: Create Database Tables

Connect to PostgreSQL and create required tables:

```sql
-- Connect to database
psql "host=postgres-seekapatraining-prod.postgres.database.azure.com port=6432 dbname=seekapa_training user=seekapaadmin sslmode=require"

-- Create sentiment_data table
CREATE TABLE IF NOT EXISTS sentiment_data (
    market_id VARCHAR(255) PRIMARY KEY,
    consensus_sentiment FLOAT,
    consensus_confidence FLOAT,
    sources JSONB,
    news_context TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create market_analysis table
CREATE TABLE IF NOT EXISTS market_analysis (
    market_id VARCHAR(255) PRIMARY KEY,
    price_trend TEXT,
    volume_analysis TEXT,
    key_insights JSONB,
    recommendation VARCHAR(10),
    risk_level VARCHAR(10),
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sentiment_created ON sentiment_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_created ON market_analysis(created_at DESC);
```

## Step 4: Deploy Function App

Deploy the function app to Azure:

```bash
# Navigate to worktree
cd ~/polymarket-worktrees/04-backend-ai

# Deploy to Azure
func azure functionapp publish polymarket-analyzer --python
```

## Step 5: Test Deployment

### Test Health Endpoint

```bash
curl https://polymarket-analyzer.azurewebsites.net/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "perplexity_available": true,
    "azure_openai_available": true,
    "gemini_available": true
  },
  "timestamp": "2025-11-11T17:30:00.000Z"
}
```

### Test Sentiment Analysis

```bash
curl -X POST https://polymarket-analyzer.azurewebsites.net/api/sentiment \
  -H "Content-Type: application/json" \
  -H "x-functions-key: <your_function_key>" \
  -d '{
    "market_id": "test-123",
    "market_title": "Will Bitcoin reach $100,000 by 2025?",
    "market_description": "This market resolves YES if Bitcoin reaches $100,000 USD by Dec 31, 2025."
  }'
```

### Test Market Analysis

```bash
curl -X POST https://polymarket-analyzer.azurewebsites.net/api/analyze \
  -H "Content-Type: application/json" \
  -H "x-functions-key: <your_function_key>" \
  -d '{
    "market_id": "test-123",
    "market_data": {
      "title": "Will Bitcoin reach $100,000 by 2025?",
      "description": "Market resolves YES if Bitcoin reaches $100k.",
      "current_price": 0.67,
      "volume_24h": 125000.00,
      "price_history": [0.45, 0.52, 0.58, 0.64, 0.67]
    },
    "sentiment_score": 0.65
  }'
```

## Step 6: Monitor Logs

View live logs:

```bash
func azure functionapp logstream polymarket-analyzer
```

Or in Azure Portal:
1. Go to Function App → polymarket-analyzer
2. Click "Log stream" in left menu
3. Monitor real-time logs

## Step 7: Get Function Keys

Get function keys for authentication:

```bash
# Get default function key
az functionapp keys list \
  --name polymarket-analyzer \
  --resource-group AZAI_group
```

## Troubleshooting

### Issue: Managed Identity not working

**Solution**: Ensure role assignment is correct and wait 5-10 minutes for propagation.

### Issue: Perplexity API failing

**Solution**: Check API key and verify status at https://www.perplexity.ai/settings/api

### Issue: Database connection timeout

**Solution**:
1. Verify connection string
2. Check firewall rules allow Azure services
3. Confirm PgBouncer port 6432 is used

### Issue: Cold start latency

**Solution**:
1. Use Flex Consumption plan (already configured)
2. Consider Always On setting for production
3. Implement response caching

## Performance Optimization

### 1. Connection Pooling

PostgreSQL uses PgBouncer (port 6432) for connection pooling - already configured.

### 2. Response Caching

Consider caching sentiment/analysis results:
- Cache TTL: 5-15 minutes
- Use Azure Redis Cache or in-memory caching
- Key: `sentiment:{market_id}` or `analysis:{market_id}`

### 3. API Rate Limits

Monitor API usage:
- **Perplexity**: Check rate limits in API dashboard
- **Azure OpenAI**: 100K TPM, 1000 RPM (configured)
- **Gemini**: Check quota at https://ai.google.dev

### 4. Parallel Processing

For batch analysis, use async/await patterns:

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

# Process multiple markets in parallel
results = await asyncio.gather(*[
    analyze_market(market_id)
    for market_id in market_ids
])
```

## Security Best Practices

1. **Never commit API keys** - Use environment variables only
2. **Enable Managed Identity** - Passwordless auth for Azure services
3. **Use Function Keys** - Protect endpoints with authentication
4. **Rotate keys regularly** - Update API keys every 90 days
5. **Monitor access logs** - Track API usage and failures

## Cost Monitoring

### Expected Monthly Costs:

- **Azure Functions**: ~$5-15/month (Flex Consumption)
- **Azure OpenAI**: Variable (pay per token)
- **Perplexity API**: Variable (check pricing)
- **Gemini API**: Variable (check pricing)
- **PostgreSQL**: Already included in existing infrastructure

### Cost Optimization:

1. Cache responses to reduce API calls
2. Use batch processing for multiple markets
3. Set spending alerts in Azure Portal
4. Monitor token usage in Azure OpenAI

## Scaling

The Flex Consumption plan automatically scales:
- **Min instances**: 0 (cold start)
- **Max instances**: 100 (Azure default)
- **Concurrent executions**: Up to 1000

For higher throughput, consider:
1. Upgrading to Premium plan
2. Implementing request queuing
3. Using Azure Functions Premium with reserved instances

## Next Steps

1. ✅ Deploy function app
2. ✅ Test all endpoints
3. ✅ Monitor logs and performance
4. 🔄 Integrate with Agent 1 (Polymarket API)
5. 🔄 Integrate with Agent 2 (Frontend)
6. 🔄 Add response caching
7. 🔄 Implement batch processing
8. 🔄 Set up monitoring alerts

---

**Deployment Guide Complete** ✅

For questions or issues, check Azure Portal logs or contact the development team.
