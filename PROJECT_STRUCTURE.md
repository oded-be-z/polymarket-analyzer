# 📁 Polymarket Analyzer - Project Structure

**Clean Production Structure**

```
polymarket-analyzer/
├── 📱 FRONTEND (Next.js 14)
│   ├── app/                      # Next.js App Router
│   │   ├── globals.css          # Global styles
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page
│   │   └── market/
│   │       └── [id]/
│   │           └── page.tsx     # Market detail page
│   │
│   ├── components/               # React Components (26 total)
│   │   ├── ai/                  # AI-related components
│   │   ├── charts/              # Data visualization
│   │   ├── layout/              # Layout components
│   │   ├── markets/             # Market components
│   │   ├── sentiment/           # Sentiment displays
│   │   └── ui/                  # UI primitives
│   │
│   ├── lib/                      # Frontend utilities
│   │   ├── api-client.ts        # Backend API client
│   │   ├── types.ts             # TypeScript types
│   │   └── utils.ts             # Helper functions
│   │
│   ├── public/                   # Static assets
│   ├── next.config.js           # Next.js config
│   ├── tailwind.config.ts       # Tailwind config
│   ├── tsconfig.json            # TypeScript config
│   └── package.json             # Dependencies
│
├── 🔧 BACKEND (Python 3.11)
│   ├── function_app.py          # 5 API endpoints (main)
│   ├── host.json                # Azure Functions config
│   ├── requirements.txt         # Python dependencies
│   │
│   └── shared/                   # Backend modules
│       ├── database.py          # PostgreSQL client
│       ├── polymarket_client.py # Polymarket API
│       ├── sentiment_analyzer.py # Multi-LLM aggregator
│       ├── azure_openai.py      # GPT-5-Pro client
│       ├── perplexity_client.py # Perplexity client
│       └── gemini_client.py     # Gemini client
│
├── 📚 DOCUMENTATION
│   ├── README.md                # Project overview
│   ├── DEPLOYMENT.md            # Deployment guide
│   ├── DEPLOYMENT_STATUS_CEO_BRIEF.md # CEO briefing
│   ├── DEVELOPMENT.md           # Development guide
│   ├── DATABASE_SETUP.md        # Database schema
│   ├── PROJECT_STRUCTURE.md     # This file
│   └── ARCHITECTURE_DIAGRAM.md  # Visual architecture
│
├── 📦 DEPLOYMENT
│   ├── scripts/                 # Deployment scripts
│   ├── integration-tests/       # Test suites
│   ├── monitoring/              # Monitoring scripts
│   └── docs/                    # Deployment docs
│
├── 🗄️ DATABASE
│   └── schema.sql               # PostgreSQL schema
│
├── 📋 CONFIG
│   ├── .env.example             # Environment template
│   ├── .gitignore               # Git ignore rules
│   └── .dockerignore            # Docker ignore
│
└── 🗃️ ARCHIVES
    └── _archive/                # Old files (archived)
        ├── docs/                # Old documentation
        ├── scripts/             # Old scripts
        ├── reports/             # Old reports
        └── old-configs/         # Old configs

```

## 📊 Key Statistics

- **Total Code**: 16,073+ lines
- **Components**: 26 React components
- **API Endpoints**: 5 Azure Functions
- **Database Tables**: 6 PostgreSQL tables
- **AI Providers**: 3 (GPT-5-Pro, Perplexity, Gemini)
- **Tests**: 30+ health checks

## 🎯 Main Entry Points

### Frontend
- **Development**: `npm run dev` (port 3000)
- **Build**: `npm run build`
- **Production**: Next.js standalone server

### Backend
- **Local**: `func start` (port 7071)
- **Production**: Azure Functions runtime

## 🔗 Connections

```
Frontend (Next.js) → Backend API (Azure Functions) → Multi-LLM Services
                            ↓
                      PostgreSQL Database
```

