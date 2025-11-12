-- Polymarket Sentiment Analyzer Database Schema
-- Database: seekapa_training
-- PostgreSQL 12+

-- ============================================
-- Markets Table: Core market data from Polymarket
-- ============================================
CREATE TABLE IF NOT EXISTS markets (
    id VARCHAR(255) PRIMARY KEY,
    question TEXT NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    condition_id VARCHAR(255),
    token_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    active BOOLEAN DEFAULT true,
    volume DECIMAL(20, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Indexes for performance
    CONSTRAINT markets_question_check CHECK (char_length(question) > 0)
);

CREATE INDEX IF NOT EXISTS idx_markets_active ON markets(active);
CREATE INDEX IF NOT EXISTS idx_markets_slug ON markets(slug);
CREATE INDEX IF NOT EXISTS idx_markets_condition_id ON markets(condition_id);
CREATE INDEX IF NOT EXISTS idx_markets_created_at ON markets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_markets_volume ON markets(volume DESC);

-- ============================================
-- Sentiment Data Table: Social media sentiment analysis
-- ============================================
CREATE TABLE IF NOT EXISTS sentiment_data (
    id SERIAL PRIMARY KEY,
    market_id VARCHAR(255) NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL, -- 'twitter', 'reddit', 'news', etc.
    sentiment_score DECIMAL(5, 4) NOT NULL, -- Range: -1.0000 to 1.0000
    text TEXT,
    author VARCHAR(255),
    external_id VARCHAR(255), -- Tweet ID, Reddit post ID, etc.
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Constraints
    CONSTRAINT sentiment_score_range CHECK (sentiment_score BETWEEN -1.0 AND 1.0),
    CONSTRAINT sentiment_source_check CHECK (source IN ('twitter', 'reddit', 'news', 'telegram', 'discord', 'other'))
);

CREATE INDEX IF NOT EXISTS idx_sentiment_market_id ON sentiment_data(market_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_source ON sentiment_data(source);
CREATE INDEX IF NOT EXISTS idx_sentiment_collected_at ON sentiment_data(collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_score ON sentiment_data(sentiment_score);
CREATE INDEX IF NOT EXISTS idx_sentiment_external_id ON sentiment_data(external_id);

-- ============================================
-- Price History Table: Token price tracking
-- ============================================
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    token_id VARCHAR(255) NOT NULL,
    market_id VARCHAR(255) REFERENCES markets(id) ON DELETE CASCADE,
    price DECIMAL(10, 8) NOT NULL, -- Price in dollars with high precision
    volume_24h DECIMAL(20, 2) DEFAULT 0.00,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Constraints
    CONSTRAINT price_positive CHECK (price >= 0),
    CONSTRAINT volume_positive CHECK (volume_24h >= 0)
);

CREATE INDEX IF NOT EXISTS idx_price_token_id ON price_history(token_id);
CREATE INDEX IF NOT EXISTS idx_price_market_id ON price_history(market_id);
CREATE INDEX IF NOT EXISTS idx_price_timestamp ON price_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_token_timestamp ON price_history(token_id, timestamp DESC);

-- ============================================
-- Alerts Table: User-configured price/sentiment alerts
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    market_id VARCHAR(255) NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'price_above', 'price_below', 'sentiment_spike', 'volume_spike'
    threshold DECIMAL(10, 4) NOT NULL,
    triggered BOOLEAN DEFAULT false,
    triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Constraints
    CONSTRAINT alert_type_check CHECK (alert_type IN ('price_above', 'price_below', 'sentiment_spike', 'volume_spike', 'correlation_alert'))
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_market_id ON alerts(market_id);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered ON alerts(triggered);
CREATE INDEX IF NOT EXISTS idx_alerts_enabled ON alerts(enabled);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);

-- ============================================
-- Phase Checkpoints Table: Agent orchestration monitoring
-- ============================================
CREATE TABLE IF NOT EXISTS phase_checkpoints (
    id SERIAL PRIMARY KEY,
    phase_name VARCHAR(100) NOT NULL, -- 'infrastructure', 'database', 'api', 'ml', 'frontend', 'testing'
    agent_name VARCHAR(100) NOT NULL, -- Agent responsible for this phase
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
    details JSONB DEFAULT '{}'::jsonb, -- Flexible storage for phase-specific data
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT phase_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'blocked'))
);

CREATE INDEX IF NOT EXISTS idx_checkpoint_phase ON phase_checkpoints(phase_name);
CREATE INDEX IF NOT EXISTS idx_checkpoint_agent ON phase_checkpoints(agent_name);
CREATE INDEX IF NOT EXISTS idx_checkpoint_status ON phase_checkpoints(status);
CREATE INDEX IF NOT EXISTS idx_checkpoint_created ON phase_checkpoints(created_at DESC);

-- ============================================
-- Error Log Table: Centralized error tracking
-- ============================================
CREATE TABLE IF NOT EXISTS error_log (
    id SERIAL PRIMARY KEY,
    agent_name VARCHAR(100) NOT NULL,
    error_type VARCHAR(100), -- 'connection', 'validation', 'api', 'database', 'timeout'
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    context JSONB DEFAULT '{}'::jsonb, -- Additional context (request data, state, etc.)
    resolution_attempted BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    resolved BOOLEAN DEFAULT false,
    severity VARCHAR(20) DEFAULT 'error', -- 'info', 'warning', 'error', 'critical'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT error_severity_check CHECK (severity IN ('info', 'warning', 'error', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_error_agent ON error_log(agent_name);
CREATE INDEX IF NOT EXISTS idx_error_type ON error_log(error_type);
CREATE INDEX IF NOT EXISTS idx_error_severity ON error_log(severity);
CREATE INDEX IF NOT EXISTS idx_error_timestamp ON error_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_resolved ON error_log(resolved);

-- ============================================
-- Views for Common Queries
-- ============================================

-- View: Active markets with recent sentiment
CREATE OR REPLACE VIEW active_markets_with_sentiment AS
SELECT
    m.id,
    m.question,
    m.slug,
    m.active,
    m.volume,
    COUNT(DISTINCT s.id) as sentiment_count,
    AVG(s.sentiment_score) as avg_sentiment,
    MAX(s.collected_at) as last_sentiment_at
FROM markets m
LEFT JOIN sentiment_data s ON m.id = s.market_id
    AND s.collected_at > NOW() - INTERVAL '24 hours'
WHERE m.active = true
GROUP BY m.id, m.question, m.slug, m.active, m.volume;

-- View: Recent price changes
CREATE OR REPLACE VIEW recent_price_changes AS
SELECT
    ph.token_id,
    ph.market_id,
    m.question,
    ph.price as current_price,
    LAG(ph.price) OVER (PARTITION BY ph.token_id ORDER BY ph.timestamp) as previous_price,
    ph.timestamp
FROM price_history ph
JOIN markets m ON ph.market_id = m.id
WHERE ph.timestamp > NOW() - INTERVAL '1 hour';

-- View: Active alerts summary
CREATE OR REPLACE VIEW active_alerts_summary AS
SELECT
    a.user_id,
    COUNT(*) as total_alerts,
    COUNT(CASE WHEN a.triggered = true THEN 1 END) as triggered_alerts,
    COUNT(CASE WHEN a.enabled = true THEN 1 END) as enabled_alerts
FROM alerts a
GROUP BY a.user_id;

-- View: Phase checkpoint status
CREATE OR REPLACE VIEW phase_status_summary AS
SELECT
    phase_name,
    agent_name,
    status,
    started_at,
    completed_at,
    EXTRACT(EPOCH FROM (completed_at - started_at))/60 as duration_minutes
FROM phase_checkpoints
WHERE id IN (
    SELECT MAX(id)
    FROM phase_checkpoints
    GROUP BY phase_name
)
ORDER BY created_at DESC;

-- ============================================
-- Functions for Common Operations
-- ============================================

-- Function: Update timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
DROP TRIGGER IF EXISTS update_markets_updated_at ON markets;
CREATE TRIGGER update_markets_updated_at
    BEFORE UPDATE ON markets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_alerts_updated_at ON alerts;
CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_checkpoints_updated_at ON phase_checkpoints;
CREATE TRIGGER update_checkpoints_updated_at
    BEFORE UPDATE ON phase_checkpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function: Log phase checkpoint
CREATE OR REPLACE FUNCTION log_phase_checkpoint(
    p_phase_name VARCHAR(100),
    p_agent_name VARCHAR(100),
    p_status VARCHAR(50),
    p_details JSONB DEFAULT '{}'::jsonb
) RETURNS INTEGER AS $$
DECLARE
    checkpoint_id INTEGER;
BEGIN
    INSERT INTO phase_checkpoints (phase_name, agent_name, status, details)
    VALUES (p_phase_name, p_agent_name, p_status, p_details)
    RETURNING id INTO checkpoint_id;

    RETURN checkpoint_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Log error
CREATE OR REPLACE FUNCTION log_error(
    p_agent_name VARCHAR(100),
    p_error_type VARCHAR(100),
    p_error_message TEXT,
    p_stack_trace TEXT DEFAULT NULL,
    p_context JSONB DEFAULT '{}'::jsonb,
    p_severity VARCHAR(20) DEFAULT 'error'
) RETURNS INTEGER AS $$
DECLARE
    error_id INTEGER;
BEGIN
    INSERT INTO error_log (agent_name, error_type, error_message, stack_trace, context, severity)
    VALUES (p_agent_name, p_error_type, p_error_message, p_stack_trace, p_context, p_severity)
    RETURNING id INTO error_id;

    RETURN error_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Initial Seed Data
-- ============================================

-- Seed phase checkpoints for monitoring
INSERT INTO phase_checkpoints (phase_name, agent_name, status, details) VALUES
    ('infrastructure', 'agent-01-infrastructure', 'pending', '{"description": "Set up project structure and Azure resources"}'::jsonb),
    ('database', 'agent-02-database', 'pending', '{"description": "Create PostgreSQL schema and migrations"}'::jsonb),
    ('api', 'agent-03-api', 'pending', '{"description": "Build FastAPI backend with Polymarket integration"}'::jsonb),
    ('ml', 'agent-04-ml', 'pending', '{"description": "Implement sentiment analysis ML pipeline"}'::jsonb),
    ('frontend', 'agent-05-frontend', 'pending', '{"description": "Build React dashboard with real-time updates"}'::jsonb),
    ('testing', 'agent-06-testing', 'pending', '{"description": "Create comprehensive test suite"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions (adjust based on your user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO seekapaadmin;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO seekapaadmin;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO seekapaadmin;

-- ============================================
-- Schema Complete
-- ============================================

-- Verify tables created
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name IN ('markets', 'sentiment_data', 'price_history', 'alerts', 'phase_checkpoints', 'error_log')
ORDER BY table_name;
