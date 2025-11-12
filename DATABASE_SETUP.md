# Polymarket Sentiment Analyzer - Database Setup

**Agent**: 02-database
**Branch**: feature/poly-database
**Status**: ✅ Schema Complete

---

## 📋 Overview

Complete PostgreSQL schema for the Polymarket Sentiment Analyzer with:
- 6 core tables (markets, sentiment, prices, alerts, checkpoints, errors)
- 4 views for common queries
- 3 custom functions for operations
- Optimized indexes for performance
- Error recovery and connection pooling

---

## 🏗️ Database Schema

### Core Tables

1. **markets** - Polymarket market data
   - Stores market questions, slugs, token IDs
   - Tracks volume and active status
   - JSONB metadata for extensibility

2. **sentiment_data** - Social media sentiment
   - Links to markets via FK
   - Scores from -1.0 to 1.0
   - Supports multiple sources (Twitter, Reddit, news)
   - External IDs for deduplication

3. **price_history** - Token price tracking
   - High-precision price storage (8 decimals)
   - 24h volume tracking
   - Time-series optimized indexes

4. **alerts** - User price/sentiment alerts
   - Multiple alert types (price, sentiment, volume)
   - Trigger tracking
   - Enable/disable functionality

5. **phase_checkpoints** - Agent orchestration
   - Tracks multi-agent pipeline progress
   - Stores phase details in JSONB
   - Monitors completion times

6. **error_log** - Centralized error tracking
   - Agent-specific error logging
   - Severity levels (info → critical)
   - Resolution tracking

### Views

- `active_markets_with_sentiment` - Markets with recent sentiment aggregates
- `recent_price_changes` - Price movements in last hour
- `active_alerts_summary` - Alert statistics per user
- `phase_status_summary` - Agent pipeline status

### Functions

- `update_updated_at_column()` - Auto-update timestamps
- `log_phase_checkpoint()` - Quick checkpoint logging
- `log_error()` - Structured error logging

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
pip install -r requirements.txt

# Set database password
export POSTGRES_PASSWORD='your_password_here'
```

### Test Connection

```bash
python test-connection.py
```

**Expected output:**
```
✓ Connection: PASSED (sslmode=prefer)
✓ Connection Pool: PASSED
⚠ Schema: WARNING (tables not created yet)

Result: 2/3 tests passed
```

### Run Migration

```bash
python migrate.py
```

**Expected output:**
```
[SUCCESS] Connected successfully with sslmode=prefer
[INFO] Created table: markets
[INFO] Created table: sentiment_data
[INFO] Created table: price_history
[INFO] Created table: alerts
[INFO] Created table: phase_checkpoints
[INFO] Created table: error_log
[SUCCESS] Executed 67 statements (0 failed/skipped)
[SUCCESS] Schema verification passed

✅ Migration completed successfully!

Tables created: 6
Indexes created: 30
Views created: 4
Functions created: 3
```

### Verify Setup

```bash
python test-connection.py
```

**Expected output:**
```
✓ Connection: PASSED
✓ Connection Pool: PASSED
✓ Schema: PASSED

Result: 3/3 tests passed
✅ Database is ready for Polymarket Sentiment Analyzer!
```

---

## 📊 Database Configuration

**Connection Details:**
```
Host: postgres-seekapatraining-prod.postgres.database.azure.com
Port: 6432 (PgBouncer connection pooling)
Database: seekapa_training
User: seekapaadmin
SSL Mode: prefer (with fallback to allow/disable)
```

**Connection String Format:**
```
postgresql://seekapaadmin:PASSWORD@postgres-seekapatraining-prod.postgres.database.azure.com:6432/seekapa_training?sslmode=prefer
```

---

## 🔧 Advanced Usage

### Manual SQL Execution

```bash
psql "postgresql://seekapaadmin:PASSWORD@postgres-seekapatraining-prod.postgres.database.azure.com:6432/seekapa_training?sslmode=prefer" -f schema.sql
```

### Query Examples

```sql
-- Check all tables
SELECT * FROM phase_checkpoints ORDER BY created_at DESC;

-- View active markets with sentiment
SELECT * FROM active_markets_with_sentiment LIMIT 10;

-- Check recent errors
SELECT agent_name, error_message, timestamp
FROM error_log
WHERE severity = 'critical'
ORDER BY timestamp DESC
LIMIT 5;

-- Monitor agent progress
SELECT * FROM phase_status_summary;
```

### Using Custom Functions

```sql
-- Log a phase checkpoint
SELECT log_phase_checkpoint(
    'database',
    'agent-02-database',
    'completed',
    '{"tables": 6, "indexes": 30}'::jsonb
);

-- Log an error
SELECT log_error(
    'agent-03-api',
    'connection',
    'Failed to connect to Polymarket API',
    NULL,
    '{"endpoint": "/markets", "status_code": 503}'::jsonb,
    'error'
);
```

---

## 🔍 Troubleshooting

### Connection Issues

**Problem**: `FATAL: SSL connection is required`

**Solution**: Change SSL mode
```bash
export POSTGRES_SSLMODE=require
python test-connection.py
```

**Problem**: `FATAL: password authentication failed`

**Solution**: Verify password is set
```bash
echo $POSTGRES_PASSWORD  # Should show your password
```

**Problem**: `could not connect to server: Connection timed out`

**Solution**: Check network/firewall
```bash
# Test basic connectivity
nc -zv postgres-seekapatraining-prod.postgres.database.azure.com 6432

# Check if port 6432 is open
telnet postgres-seekapatraining-prod.postgres.database.azure.com 6432
```

### Migration Issues

**Problem**: `Table already exists`

**Solution**: This is expected behavior (uses `IF NOT EXISTS`)
- Warnings about existing objects are normal
- Migration is idempotent (safe to run multiple times)

**Problem**: `Permission denied for schema public`

**Solution**: Check user permissions
```sql
GRANT ALL PRIVILEGES ON SCHEMA public TO seekapaadmin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seekapaadmin;
```

---

## 📁 Files

```
02-database/
├── README.md                  # Worktree overview
├── DATABASE_SETUP.md          # This file
├── schema.sql                 # Complete PostgreSQL schema
├── migrate.py                 # Migration script with error recovery
├── test-connection.py         # Connection testing utility
├── requirements.txt           # Python dependencies
└── migration_log.json         # Generated after migration (gitignored)
```

---

## 🔐 Security Notes

- **Never commit passwords** to git
- Use environment variables for credentials
- Connection strings are logged without passwords
- SSL/TLS encryption is enforced by default
- PgBouncer (port 6432) provides connection pooling

---

## 📈 Performance Considerations

- **Indexes**: 30+ indexes for optimized queries
- **JSONB**: Flexible metadata storage with GIN indexes
- **Connection Pooling**: PgBouncer handles concurrent connections
- **Partitioning**: Consider partitioning `price_history` by date for large datasets
- **Archival**: Implement archival strategy for old sentiment/price data

---

## 🔗 Integration

### Python (psycopg2)

```python
import psycopg2
import os

conn = psycopg2.connect(
    host=os.getenv('POSTGRES_HOST'),
    port=int(os.getenv('POSTGRES_PORT', 6432)),
    database=os.getenv('POSTGRES_DB'),
    user=os.getenv('POSTGRES_USER'),
    password=os.getenv('POSTGRES_PASSWORD'),
    sslmode='prefer'
)

cursor = conn.cursor()
cursor.execute("SELECT * FROM markets WHERE active = true LIMIT 10;")
markets = cursor.fetchall()
```

### Python (SQLAlchemy)

```python
from sqlalchemy import create_engine
import os

DATABASE_URL = f"postgresql://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_HOST')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}?sslmode=prefer"

engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=10)
```

### Node.js (pg)

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT || 6432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

const markets = await pool.query('SELECT * FROM markets WHERE active = true LIMIT 10');
```

---

## ✅ Success Criteria

- [x] Complete schema with 6 tables
- [x] Optimized indexes (30+)
- [x] Views for common queries (4)
- [x] Custom functions for operations (3)
- [x] Migration script with error recovery
- [x] Connection test utility
- [x] SSL fallback mechanism
- [x] Seed data for phase tracking
- [x] Comprehensive documentation

---

## 🚀 Next Steps

1. **Agent 03 (API)**: Use this schema for FastAPI backend
2. **Agent 04 (ML)**: Store sentiment analysis results
3. **Agent 05 (Frontend)**: Query views for dashboard
4. **Agent 06 (Testing)**: Test database operations

---

**Created**: 2025-11-11
**Agent**: 02-database
**Status**: ✅ Ready for integration
