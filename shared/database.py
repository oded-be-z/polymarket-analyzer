"""
PostgreSQL database connection module with connection pooling and AI data operations.

Combines Agent 3 (Backend Core) connection pooling with Agent 4 (Backend AI) data operations.
Uses module-level singleton pattern for connection pool.
Connects to Azure PostgreSQL via PgBouncer (port 6432).
"""

import os
import json
import logging
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Module-level connection pool (singleton)
_connection_pool: Optional[pool.ThreadedConnectionPool] = None


# =============================================================================
# CONNECTION POOLING (Agent 3 - Backend Core)
# =============================================================================

def get_connection_pool() -> pool.ThreadedConnectionPool:
    """
    Get or create the PostgreSQL connection pool.

    Returns:
        ThreadedConnectionPool: Connection pool instance
    """
    global _connection_pool

    if _connection_pool is None:
        logger.info("Initializing PostgreSQL connection pool")

        # Get connection parameters from environment
        host = os.getenv("POSTGRES_HOST", "postgres-seekapatraining-prod.postgres.database.azure.com")
        port = os.getenv("POSTGRES_PORT", "6432")  # PgBouncer port
        database = os.getenv("POSTGRES_DB", "seekapa_training")
        user = os.getenv("POSTGRES_USER", "seekapaadmin")
        password = os.getenv("POSTGRES_PASSWORD")

        if not password:
            raise ValueError("POSTGRES_PASSWORD environment variable not set")

        try:
            _connection_pool = pool.ThreadedConnectionPool(
                minconn=5,
                maxconn=20,
                host=host,
                port=port,
                database=database,
                user=user,
                password=password,
                sslmode="require",
                connect_timeout=10,
                keepalives=1,
                keepalives_idle=30,
                keepalives_interval=10,
                keepalives_count=5
            )
            logger.info("PostgreSQL connection pool initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize connection pool: {e}")
            raise

    return _connection_pool


def get_connection():
    """
    Get a connection from the pool.

    Returns:
        psycopg2.connection: Database connection

    Usage:
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
        finally:
            return_connection(conn)
    """
    pool_instance = get_connection_pool()
    return pool_instance.getconn()


def return_connection(conn):
    """
    Return a connection to the pool.

    Args:
        conn: Database connection to return
    """
    pool_instance = get_connection_pool()
    pool_instance.putconn(conn)


def close_all_connections():
    """
    Close all connections in the pool.
    Call this during application shutdown.
    """
    global _connection_pool

    if _connection_pool is not None:
        logger.info("Closing all database connections")
        _connection_pool.closeall()
        _connection_pool = None


def execute_query(query: str, params: tuple = None, fetch: bool = True):
    """
    Execute a database query with automatic connection management.

    Args:
        query: SQL query string
        params: Query parameters (optional)
        fetch: Whether to fetch results (default: True)

    Returns:
        List of rows if fetch=True, None otherwise
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute(query, params)

            if fetch:
                return cursor.fetchall()
            else:
                conn.commit()
                return None
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Database query failed: {e}")
        raise
    finally:
        if conn:
            return_connection(conn)


def execute_many(query: str, data: list):
    """
    Execute multiple inserts/updates efficiently.

    Args:
        query: SQL query with placeholders
        data: List of tuples with values
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.executemany(query, data)
            conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Batch query failed: {e}")
        raise
    finally:
        if conn:
            return_connection(conn)


# =============================================================================
# DATABASE CLIENT CLASS (Agent 4 - Backend AI)
# =============================================================================

class DatabaseClient:
    """PostgreSQL database client for sentiment and analysis data operations"""

    def get_connection(self):
        """Get database connection from the pool"""
        return get_connection()

    def store_sentiment(
        self,
        market_id: str,
        sentiment_data: Dict[str, Any]
    ) -> bool:
        """
        Store sentiment analysis results

        Table: sentiment_data
        Columns: market_id, consensus_sentiment, consensus_confidence,
                 sources, news_context, status, created_at
        """
        conn = None
        try:
            conn = get_connection()
            cursor = conn.cursor()

            # Convert sources list to JSON string
            sources_json = json.dumps(sentiment_data.get("sources", []))

            query = """
                INSERT INTO sentiment_data
                (market_id, consensus_sentiment, consensus_confidence,
                 sources, news_context, status, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (market_id)
                DO UPDATE SET
                    consensus_sentiment = EXCLUDED.consensus_sentiment,
                    consensus_confidence = EXCLUDED.consensus_confidence,
                    sources = EXCLUDED.sources,
                    news_context = EXCLUDED.news_context,
                    status = EXCLUDED.status,
                    created_at = EXCLUDED.created_at
            """

            cursor.execute(
                query,
                (
                    market_id,
                    sentiment_data.get("consensus_sentiment"),
                    sentiment_data.get("consensus_confidence"),
                    sources_json,
                    sentiment_data.get("news_context"),
                    sentiment_data.get("status"),
                    datetime.utcnow()
                )
            )

            conn.commit()
            logger.info(f"Sentiment data stored for market {market_id}")
            return True

        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Failed to store sentiment data: {e}")
            return False
        finally:
            if conn:
                return_connection(conn)

    def get_sentiment(self, market_id: str) -> Optional[Dict[str, Any]]:
        """Get latest sentiment data for a market"""
        conn = None
        try:
            conn = get_connection()
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            query = """
                SELECT * FROM sentiment_data
                WHERE market_id = %s
                ORDER BY created_at DESC
                LIMIT 1
            """

            cursor.execute(query, (market_id,))
            result = cursor.fetchone()

            if result:
                # Parse sources JSON
                result_dict = dict(result)
                if result_dict.get("sources"):
                    result_dict["sources"] = json.loads(result_dict["sources"])
                return result_dict
            else:
                return None

        except Exception as e:
            logger.error(f"Failed to retrieve sentiment data: {e}")
            return None
        finally:
            if conn:
                return_connection(conn)

    def store_analysis(
        self,
        market_id: str,
        analysis_data: Dict[str, Any]
    ) -> bool:
        """
        Store market analysis results

        Table: market_analysis
        Columns: market_id, price_trend, volume_analysis, key_insights,
                 recommendation, risk_level, confidence, created_at
        """
        conn = None
        try:
            conn = get_connection()
            cursor = conn.cursor()

            # Convert key_insights list to JSON string
            insights_json = json.dumps(analysis_data.get("key_insights", []))

            query = """
                INSERT INTO market_analysis
                (market_id, price_trend, volume_analysis, key_insights,
                 recommendation, risk_level, confidence, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (market_id)
                DO UPDATE SET
                    price_trend = EXCLUDED.price_trend,
                    volume_analysis = EXCLUDED.volume_analysis,
                    key_insights = EXCLUDED.key_insights,
                    recommendation = EXCLUDED.recommendation,
                    risk_level = EXCLUDED.risk_level,
                    confidence = EXCLUDED.confidence,
                    created_at = EXCLUDED.created_at
            """

            cursor.execute(
                query,
                (
                    market_id,
                    analysis_data.get("price_trend"),
                    analysis_data.get("volume_analysis"),
                    insights_json,
                    analysis_data.get("recommendation"),
                    analysis_data.get("risk_level"),
                    analysis_data.get("confidence"),
                    datetime.utcnow()
                )
            )

            conn.commit()
            logger.info(f"Analysis data stored for market {market_id}")
            return True

        except Exception as e:
            if conn:
                conn.rollback()
            logger.error(f"Failed to store analysis data: {e}")
            return False
        finally:
            if conn:
                return_connection(conn)


# =============================================================================
# DATABASE SCHEMA INITIALIZATION (Agent 3 - Backend Core)
# =============================================================================

SCHEMA_SQL = """
-- Markets table
CREATE TABLE IF NOT EXISTS markets (
    token_id VARCHAR(100) PRIMARY KEY,
    question TEXT NOT NULL,
    description TEXT,
    end_date TIMESTAMP,
    outcome_prices JSONB,
    volume NUMERIC(20, 2),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    token_id VARCHAR(100) NOT NULL,
    price NUMERIC(10, 6) NOT NULL,
    volume NUMERIC(20, 2),
    timestamp TIMESTAMP DEFAULT NOW(),
    CONSTRAINT fk_token FOREIGN KEY (token_id) REFERENCES markets(token_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_markets_active ON markets(active);
CREATE INDEX IF NOT EXISTS idx_price_history_token ON price_history(token_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp DESC);
"""


def init_database():
    """
    Initialize database schema.
    Creates tables and indexes if they don't exist.
    """
    try:
        logger.info("Initializing database schema")
        execute_query(SCHEMA_SQL, fetch=False)
        logger.info("Database schema initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database schema: {e}")
        raise
