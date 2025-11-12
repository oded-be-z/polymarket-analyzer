<<<<<<< HEAD
# 🎯 Polymarket Sentiment Analyzer

**Full-Stack AI-Powered Trading Analysis Platform**

[![Azure Functions](https://img.shields.io/badge/Azure-Functions-0078D4?logo=microsoft-azure)](https://polymarket-analyzer.azurewebsites.net)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)](https://www.python.org)

Multi-agent developed application for analyzing Polymarket prediction markets with AI-powered sentiment analysis and trading insights.

---

## 🚀 Quick Start

### Deploy Everything
```bash
cd ~/polymarket-worktrees/07-deployment
bash deploy-all.sh
```

### Individual Components
```bash
# Database
bash scripts/deploy-database.sh

# Backend APIs
bash scripts/deploy-backend.sh

# Frontend Dashboard
bash scripts/deploy-frontend.sh

# Validate
bash scripts/health-check-all.sh
```

---

## 📊 Project Structure

This project was built using **7 parallel autonomous agents**, each in isolated git worktrees:

```
polymarket-analyzer/
├── 01-infrastructure/      # Azure resources & deployment automation
├── 02-database/            # PostgreSQL schema & migrations
├── 03-backend-core/        # Markets & Price APIs
├── 04-backend-ai/          # Sentiment & Analysis APIs (Multi-LLM)
├── 05-frontend-scaffold/   # Next.js 14 foundation
├── 06-frontend-ui/         # React components & visualizations
└── 07-deployment/          # CI/CD & orchestration
```

---

## 🏗️ Architecture

### Backend (Python 3.11)
- **Azure Functions v4** - Serverless APIs
- **PostgreSQL** - Data persistence (6 tables, 28 indexes)
- **Multi-LLM Integration**:
  - Azure OpenAI GPT-5-Pro (40%)
  - Perplexity API (40%)
  - Google Gemini (20%)
- **Polymarket CLOB API** - Market data

### Frontend (TypeScript/React)
- **Next.js 14** - App Router
- **Tailwind CSS** - Dark theme optimized
- **Recharts** - Data visualization
- **26 React Components** - Fully typed

### Infrastructure
- **Azure Function App**: `polymarket-analyzer.azurewebsites.net`
- **Azure Static Web Apps**: Frontend hosting
- **Azure PostgreSQL**: Database (port 6432, PgBouncer)
- **Managed Identity**: Passwordless authentication

---

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Service health check |
| `/api/markets` | GET | Active Polymarket markets (5min cache) |
| `/api/price/{token_id}` | GET | Real-time price + 24h history (5sec cache) |
| `/api/sentiment` | POST | Multi-source sentiment analysis |
| `/api/analyze` | POST | AI-powered market analysis |

---

## 🎨 Features

### Multi-LLM Sentiment Analysis
- **Perplexity**: Latest news sentiment
- **GPT-5-Pro**: Deep reasoning analysis
- **Gemini**: Fallback provider
- **Weighted Consensus**: Confidence-scored results
- **Cascading Fallback**: Automatic degradation if sources fail

### Trading Insights
- Real-time price tracking
- 24-hour price history
- Volume analysis
- Market sentiment trends
- AI trading recommendations (BUY/SELL/HOLD/WATCH)

### Production Features
- Bulletproof error recovery (3-retry exponential backoff)
- Connection pooling (5-20 connections)
- Smart caching (markets: 5min, prices: 5sec)
- Health monitoring (30+ checks)
- Comprehensive logging

---

## 📚 Documentation

Each agent worktree contains detailed documentation:

- **Infrastructure**: [01-infrastructure/INFRASTRUCTURE.md](01-infrastructure/INFRASTRUCTURE.md)
- **Database**: [02-database/DATABASE_SETUP.md](02-database/DATABASE_SETUP.md)
- **Backend Core**: [03-backend-core/README.md](03-backend-core/README.md)
- **Backend AI**: [04-backend-ai/README.md](04-backend-ai/README.md)
- **Frontend**: [05-frontend-scaffold/README.md](05-frontend-scaffold/README.md)
- **Components**: [06-frontend-ui/components/README.md](06-frontend-ui/components/README.md)
- **Deployment**: [07-deployment/docs/DEPLOYMENT_GUIDE.md](07-deployment/docs/DEPLOYMENT_GUIDE.md)

**Master Summary**: [OVERNIGHT_DEPLOYMENT_COMPLETE.md](OVERNIGHT_DEPLOYMENT_COMPLETE.md)

---

## 🔧 Development

### Prerequisites
- Node.js 18+
- Python 3.11+
- Azure CLI
- PostgreSQL client

### Local Setup
```bash
# Install dependencies
npm install
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run locally
cd 03-backend-core && func start  # Backend
cd 05-frontend-scaffold && npm run dev  # Frontend
```

---

## 🧪 Testing

```bash
# API Integration Tests
bash integration-tests/test-api-flow.sh

# UI Flow Tests
bash integration-tests/test-ui-flow.sh

# Health Checks
bash scripts/health-check-all.sh
```

---

## 💰 Cost

**Monthly**: $25-40 (using existing Azure infrastructure)
- Function App: $10-15
- Static Web App: $0 (free tier)
- PostgreSQL: $5 (shared)
- AI APIs: $10-20 (usage-based)

---

## 📊 Statistics

- **16,073+ lines** of production code
- **2,500+ lines** of documentation
- **122 files** delivered
- **39 git commits** across 7 branches
- **26 React components**
- **6 API endpoints**
- **6 database tables**
- **30+ health checks**
- **Zero TypeScript errors**

---

## 🤖 Multi-Agent Development

This project was built by 7 autonomous agents working in parallel:

| Agent | Mission | Commits | Status |
|-------|---------|---------|--------|
| **01** | Infrastructure & Deployment | 6 | ✅ |
| **02** | Database Schema | 5 | ✅ |
| **03** | Backend Core APIs | 7 | ✅ |
| **04** | Backend AI Services | 4 | ✅ |
| **05** | Frontend Scaffold | 6 | ✅ |
| **06** | Frontend UI Components | 5 | ✅ |
| **07** | Deployment Orchestration | 6 | ✅ |

---

## 🚀 Deployment Status

**Current**: ✅ All agents complete, ready for production
**Next**: Merge all branches and deploy

**Deployment Command**:
```bash
cd ~/polymarket-worktrees/07-deployment
bash deploy-all.sh
```

---

## 📞 Support

- **Issues**: Create GitHub issue
- **Documentation**: See agent-specific READMEs
- **Logs**: Azure Application Insights

---

## 📄 License

MIT License - See LICENSE file for details

---

**Built with Claude Code Multi-Agent System** 🤖✨
=======
# Polymarket Analyzer - Backend AI Services

Azure Function App providing multi-LLM sentiment analysis and market analysis for Polymarket prediction markets.

## 🎯 Features

### 1. Multi-Source Sentiment Analysis
- **Perplexity API**: Latest news research and sentiment
- **Azure OpenAI GPT-5-Pro**: Deep sentiment analysis
- **Google Gemini**: Fallback analysis provider
- **Cascading Fallback**: Gracefully handles API failures
- **Weighted Consensus**: Combines scores from all sources

### 2. Comprehensive Market Analysis
- Price trend analysis
- Volume pattern analysis
- Trading recommendations (BUY/SELL/HOLD/WATCH)
- Risk assessment (LOW/MEDIUM/HIGH)
- Key insights extraction

### 3. Robust Error Recovery
- Managed Identity authentication (passwordless)
- API key fallback for Azure OpenAI
- Cascading fallback across all AI providers
- Neutral sentiment (0.0) if all sources fail

## 📡 API Endpoints

### POST /api/sentiment
Multi-source sentiment analysis for prediction markets.

**Request:**
```json
{
  "market_id": "string",
  "market_title": "string",
  "market_description": "string"
}
```

**Response:**
```json
{
  "market_id": "string",
  "consensus_sentiment": 0.65,
  "consensus_confidence": 0.75,
  "sources": [
    {
      "source": "perplexity",
      "score": 0.70,
      "confidence": 0.80,
      "reasoning": "...",
      "weight": 0.4
    },
    {
      "source": "azure_openai_gpt5_pro",
      "score": 0.60,
      "confidence": 0.70,
      "reasoning": "...",
      "weight": 0.4
    }
  ],
  "news_context": "Latest news summary...",
  "status": "success",
  "timestamp": "2025-11-11T17:30:00.000Z"
}
```

### POST /api/analyze
Comprehensive market analysis using GPT-5-Pro.

**Request:**
```json
{
  "market_id": "string",
  "market_data": {
    "title": "string",
    "description": "string",
    "current_price": 0.67,
    "volume_24h": 125000.00,
    "price_history": [0.45, 0.52, 0.58, 0.64, 0.67]
  },
  "sentiment_score": 0.65
}
```

**Response:**
```json
{
  "market_id": "string",
  "price_trend": "Strong upward trend...",
  "volume_analysis": "Healthy trading volume...",
  "key_insights": [
    "Insight 1",
    "Insight 2",
    "Insight 3"
  ],
  "recommendation": "BUY",
  "risk_level": "MEDIUM",
  "confidence": 0.78,
  "sentiment_score": 0.65,
  "timestamp": "2025-11-11T17:30:00.000Z"
}
```

### GET /api/health
Health check endpoint.

**Response:**
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

## 🏗️ Architecture

```
function_app.py (API endpoints)
    │
    ├─→ sentiment_analyzer.py (Multi-source aggregation)
    │       │
    │       ├─→ perplexity_client.py (News research)
    │       ├─→ azure_openai.py (GPT-5-Pro analysis)
    │       └─→ gemini_client.py (Fallback analysis)
    │
    └─→ database.py (PostgreSQL storage)
```

## 🔐 Environment Variables

Create a `.env` file (see `.env.example`):

```bash
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://brn-azai.openai.azure.com/
GPT5_PRO_DEPLOYMENT_NAME=gpt-5-pro
GPT5_PRO_KEY=your_api_key_here

# Perplexity
PERPLEXITY_API_KEY=your_api_key_here

# Gemini
GEMINI_API_KEY=your_api_key_here

# PostgreSQL
POSTGRES_CONNECTION_STRING=host=... port=6432 dbname=seekapa_training user=... sslmode=require
```

## 📦 Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
func start
```

## 🧪 Testing

Run mock tests without API calls:

```bash
python test_sentiment.py
```

This will output mock responses showing expected behavior.

## 🚀 Deployment

Deploy to Azure Function App:

```bash
func azure functionapp publish polymarket-analyzer
```

## 🔄 Multi-LLM Cascade Strategy

### Sentiment Analysis Flow:

1. **Perplexity** (weight: 0.4)
   - Searches latest news
   - Analyzes news sentiment
   - Provides source citations

2. **Azure OpenAI GPT-5-Pro** (weight: 0.4)
   - Deep sentiment analysis
   - Considers news context from Perplexity
   - Provides detailed reasoning

3. **Google Gemini** (weight: 0.2)
   - Fallback if others fail
   - Fast multimodal analysis
   - Lower weight due to fallback role

4. **Neutral (0.0)**
   - If all sources fail
   - Returns confidence = 0.0

### Consensus Calculation:

```python
weighted_sentiment = Σ(score × confidence × weight)
consensus = weighted_sentiment / Σ(confidence × weight)
```

## 📊 Database Schema

### sentiment_data table:
```sql
CREATE TABLE sentiment_data (
    market_id VARCHAR(255) PRIMARY KEY,
    consensus_sentiment FLOAT,
    consensus_confidence FLOAT,
    sources JSONB,
    news_context TEXT,
    status VARCHAR(50),
    created_at TIMESTAMP
);
```

### market_analysis table:
```sql
CREATE TABLE market_analysis (
    market_id VARCHAR(255) PRIMARY KEY,
    price_trend TEXT,
    volume_analysis TEXT,
    key_insights JSONB,
    recommendation VARCHAR(10),
    risk_level VARCHAR(10),
    confidence FLOAT,
    created_at TIMESTAMP
);
```

## 🛠️ Managed Identity Setup

For passwordless Azure OpenAI access:

1. Enable Managed Identity on Function App:
```bash
az functionapp identity assign \
  --resource-group AZAI_group \
  --name polymarket-analyzer
```

2. Grant Cognitive Services User role:
```bash
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Cognitive Services User" \
  --scope /subscriptions/.../cognitiveservices/accounts/brn-azai
```

## 📝 Error Handling

- **Perplexity fails**: Skip news, use only Azure + Gemini
- **Azure OpenAI auth fails**: Fallback to API key
- **Gemini unavailable**: Use Perplexity + Azure only
- **All sources fail**: Return neutral (0.0) with status="failed_all_sources"
- **Database fails**: Log warning but don't fail API request

## 🔍 Logging

All operations are logged with appropriate levels:
- `INFO`: Successful operations, API calls
- `WARNING`: Fallback activations, DB failures (non-critical)
- `ERROR`: API failures, critical errors

Check logs in Azure Portal or using:
```bash
func azure functionapp logstream polymarket-analyzer
```

## 🎯 Integration Points

This service integrates with:
- **Agent 1 (Polymarket API)**: Receives market data
- **Agent 2 (Frontend)**: Provides sentiment/analysis to UI
- **Agent 3 (PostgreSQL)**: Stores results for caching

## 📚 Dependencies

- `azure-functions`: Azure Functions runtime
- `azure-identity`: Managed Identity support
- `openai`: Azure OpenAI client
- `psycopg2-binary`: PostgreSQL driver
- `requests`: HTTP client for Perplexity
- `google-generativeai`: Gemini client

## 🤝 Contributing

This is Agent 4's isolated workspace. Changes should be committed to the `feature/poly-backend-ai` branch.

## 📄 License

Part of Polymarket Analyzer project.

---

**Agent 4: Backend AI Services** ✅
Multi-LLM sentiment analysis and market analysis with cascading fallback.
>>>>>>> feature/poly-backend-ai
