"""
Polymarket Analyzer - Unified Backend APIs
Azure Functions application for markets, price data, sentiment analysis, and market analysis.
"""

import azure.functions as func
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

# Agent 3 imports (Backend Core)
from shared.database import get_connection, return_connection, execute_query, init_database
from shared.polymarket_client import get_polymarket_client

# Agent 4 imports (Backend AI)
from shared.sentiment_analyzer import SentimentAnalyzer
from shared.azure_openai import AzureOpenAIClient
from shared.database import DatabaseClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Function App
app = func.FunctionApp()

# Cache for markets data (5 minute TTL)
_markets_cache: Optional[Dict] = None
_markets_cache_time: Optional[datetime] = None
MARKETS_CACHE_TTL = timedelta(minutes=5)

# Cache for price data (5 second TTL)
_price_cache: Dict[str, Dict] = {}
_price_cache_time: Dict[str, datetime] = {}
PRICE_CACHE_TTL = timedelta(seconds=5)

# Initialize AI clients (singleton pattern with lazy loading)
_sentiment_analyzer = None
_azure_openai = None
_db_client = None

def get_sentiment_analyzer():
    """Get or create sentiment analyzer singleton"""
    global _sentiment_analyzer
    if _sentiment_analyzer is None:
        _sentiment_analyzer = SentimentAnalyzer()
    return _sentiment_analyzer

def get_azure_openai():
    """Get or create Azure OpenAI client singleton"""
    global _azure_openai
    if _azure_openai is None:
        _azure_openai = AzureOpenAIClient()
    return _azure_openai

def get_db_client():
    """Get or create database client singleton"""
    global _db_client
    if _db_client is None:
        _db_client = DatabaseClient()
    return _db_client


# =============================================================================
# HEALTH CHECK ENDPOINT (Unified)
# =============================================================================

@app.function_name(name="health")
@app.route(route="health", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def health_check(req: func.HttpRequest) -> func.HttpResponse:
    """
    Health check endpoint with service status.

    Returns:
        JSON with status, AI services availability, and timestamp
    """
    try:
        # Get AI services status
        sentiment_analyzer = get_sentiment_analyzer()
        services_status = sentiment_analyzer.get_status_summary()

        # Check database status
        db_status = "available" if _database_available else "unavailable"

        return func.HttpResponse(
            json.dumps({
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "service": "polymarket-analyzer-backend",
                "ai_services": services_status,
                "database": db_status
            }),
            mimetype="application/json",
            status_code=200
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return func.HttpResponse(
            json.dumps({"status": "unhealthy", "error": str(e)}),
            mimetype="application/json",
            status_code=500
        )


# =============================================================================
# MARKETS ENDPOINT (Agent 3 - Backend Core)
# =============================================================================

@app.function_name(name="markets")
@app.route(route="markets", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_markets(req: func.HttpRequest) -> func.HttpResponse:
    """
    Get all active markets from Polymarket.

    Query parameters:
        - refresh: Force refresh from API (default: false)
        - active_only: Only return active markets (default: true)

    Returns:
        JSON array of markets with structure:
        {
            "markets": [
                {
                    "token_id": str,
                    "question": str,
                    "description": str,
                    "end_date": str,
                    "outcome_prices": dict,
                    "volume": float,
                    "active": bool,
                    "updated_at": str
                }
            ],
            "count": int,
            "cached": bool,
            "timestamp": str
        }
    """
    global _markets_cache, _markets_cache_time

    try:
        # Check query parameters
        force_refresh = req.params.get('refresh', 'false').lower() == 'true'
        active_only = req.params.get('active_only', 'true').lower() == 'true'

        # Check cache
        cache_valid = (
            _markets_cache is not None and
            _markets_cache_time is not None and
            datetime.utcnow() - _markets_cache_time < MARKETS_CACHE_TTL and
            not force_refresh
        )

        if cache_valid:
            logger.info("Returning cached markets data")
            response = _markets_cache.copy()
            response['cached'] = True
            return func.HttpResponse(
                json.dumps(response),
                mimetype="application/json",
                status_code=200
            )

        # Fetch fresh data from Polymarket
        logger.info("Fetching fresh markets data from Polymarket")
        client = get_polymarket_client()
        markets = client.get_markets(active_only=active_only)

        # Store in database (upsert) - gracefully handle DB failures
        if markets and _database_available:
            try:
                logger.info(f"Storing {len(markets)} markets in database")
                _upsert_markets(markets)
            except Exception as db_error:
                logger.warning(f"Failed to store markets in database (continuing without DB): {db_error}")

        # Prepare response
        response = {
            "markets": markets,
            "count": len(markets),
            "cached": False,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Update cache
        _markets_cache = response.copy()
        _markets_cache_time = datetime.utcnow()

        return func.HttpResponse(
            json.dumps(response),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        logger.error(f"Failed to fetch markets: {e}")

        # Try to return cached data as fallback
        if _markets_cache is not None:
            logger.info("Returning stale cache as fallback")
            response = _markets_cache.copy()
            response['cached'] = True
            response['error'] = "Fresh data unavailable, returning cached data"
            return func.HttpResponse(
                json.dumps(response),
                mimetype="application/json",
                status_code=200
            )

        # No cache available, return error
        return func.HttpResponse(
            json.dumps({
                "error": "Failed to fetch markets",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }),
            mimetype="application/json",
            status_code=500
        )


# =============================================================================
# PRICE ENDPOINT (Agent 3 - Backend Core)
# =============================================================================

@app.function_name(name="price")
@app.route(route="price/{token_id}", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_price(req: func.HttpRequest) -> func.HttpResponse:
    """
    Get current price and 24h history for a specific market token.

    Path parameters:
        - token_id: Market token ID

    Query parameters:
        - refresh: Force refresh from API (default: false)

    Returns:
        JSON with current price and history:
        {
            "token_id": str,
            "current_price": float,
            "volume": float,
            "price_history_24h": [
                {
                    "price": float,
                    "timestamp": str
                }
            ],
            "cached": bool,
            "timestamp": str
        }
    """
    try:
        # Get token_id from route
        token_id = req.route_params.get('token_id')
        if not token_id:
            return func.HttpResponse(
                json.dumps({"error": "token_id is required"}),
                mimetype="application/json",
                status_code=400
            )

        # Check query parameters
        force_refresh = req.params.get('refresh', 'false').lower() == 'true'

        # Check cache
        cache_valid = (
            token_id in _price_cache and
            token_id in _price_cache_time and
            datetime.utcnow() - _price_cache_time[token_id] < PRICE_CACHE_TTL and
            not force_refresh
        )

        if cache_valid:
            logger.info(f"Returning cached price for {token_id}")
            response = _price_cache[token_id].copy()
            response['cached'] = True
            return func.HttpResponse(
                json.dumps(response),
                mimetype="application/json",
                status_code=200
            )

        # Fetch fresh price from Polymarket
        logger.info(f"Fetching fresh price for {token_id}")
        client = get_polymarket_client()
        price_data = client.get_market_price(token_id)

        if not price_data:
            return func.HttpResponse(
                json.dumps({
                    "error": "Market not found",
                    "token_id": token_id
                }),
                mimetype="application/json",
                status_code=404
            )

        # Store in price_history table
        _store_price_history(price_data)

        # Get 24h price history from database
        history = _get_price_history_24h(token_id)

        # Prepare response
        response = {
            "token_id": token_id,
            "current_price": price_data['price'],
            "volume": price_data['volume'],
            "price_history_24h": history,
            "cached": False,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Update cache
        _price_cache[token_id] = response.copy()
        _price_cache_time[token_id] = datetime.utcnow()

        return func.HttpResponse(
            json.dumps(response),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        logger.error(f"Failed to fetch price: {e}")

        # Try to return cached data as fallback
        if token_id in _price_cache:
            logger.info(f"Returning stale cache for {token_id} as fallback")
            response = _price_cache[token_id].copy()
            response['cached'] = True
            response['error'] = "Fresh data unavailable, returning cached data"
            return func.HttpResponse(
                json.dumps(response),
                mimetype="application/json",
                status_code=200
            )

        # No cache available, return error
        return func.HttpResponse(
            json.dumps({
                "error": "Failed to fetch price",
                "message": str(e),
                "token_id": token_id,
                "timestamp": datetime.utcnow().isoformat()
            }),
            mimetype="application/json",
            status_code=500
        )


# =============================================================================
# SENTIMENT ENDPOINT (Agent 4 - Backend AI)
# =============================================================================

@app.route(route="sentiment", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def sentiment_analysis(req: func.HttpRequest) -> func.HttpResponse:
    """
    Multi-source sentiment analysis endpoint

    POST /api/sentiment
    Body: {"market_id": "string", "market_title": "string", "market_description": "string"}

    Returns:
    {
        "market_id": "string",
        "consensus_sentiment": float (-1 to 1),
        "consensus_confidence": float (0 to 1),
        "sources": [
            {
                "source": "string",
                "score": float,
                "confidence": float,
                "reasoning": "string",
                "weight": float
            }
        ],
        "news_context": "string",
        "status": "success/partial/failed_all_sources",
        "timestamp": "ISO8601"
    }
    """
    logger.info("Sentiment analysis endpoint called")

    try:
        # Parse request body
        req_body = req.get_json()

        # Validate required fields
        market_id = req_body.get("market_id")
        market_title = req_body.get("market_title")
        market_description = req_body.get("market_description")

        if not market_id or not market_title or not market_description:
            return func.HttpResponse(
                json.dumps({
                    "error": "Missing required fields",
                    "required": ["market_id", "market_title", "market_description"]
                }),
                status_code=400,
                mimetype="application/json"
            )

        logger.info(f"Analyzing sentiment for market: {market_id}")

        # Get sentiment analyzer (lazy-loaded)
        sentiment_analyzer = get_sentiment_analyzer()

        # Perform multi-source sentiment analysis
        result = sentiment_analyzer.analyze_multi_source(
            market_title=market_title,
            market_description=market_description
        )

        # Add market_id and timestamp
        result["market_id"] = market_id
        result["timestamp"] = datetime.utcnow().isoformat()

        # Store in database
        try:
            db_client = get_db_client()
            db_client.store_sentiment(market_id, result)
            logger.info(f"Sentiment stored in database for market {market_id}")
        except Exception as e:
            logger.warning(f"Failed to store sentiment in database: {e}")
            # Don't fail the request if DB storage fails

        # Return result
        return func.HttpResponse(
            json.dumps(result, indent=2),
            status_code=200,
            mimetype="application/json"
        )

    except ValueError as e:
        logger.error(f"Invalid request: {e}")
        return func.HttpResponse(
            json.dumps({"error": f"Invalid request: {str(e)}"}),
            status_code=400,
            mimetype="application/json"
        )
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {e}", exc_info=True)
        return func.HttpResponse(
            json.dumps({
                "error": "Internal server error",
                "message": str(e)
            }),
            status_code=500,
            mimetype="application/json"
        )


# =============================================================================
# ANALYZE ENDPOINT (Agent 4 - Backend AI)
# =============================================================================

@app.route(route="analyze", methods=["POST"], auth_level=func.AuthLevel.ANONYMOUS)
def market_analysis(req: func.HttpRequest) -> func.HttpResponse:
    """
    Comprehensive market analysis endpoint

    POST /api/analyze
    Body: {
        "market_id": "string",
        "market_data": {
            "title": "string",
            "description": "string",
            "current_price": float,
            "volume_24h": float,
            "price_history": [...],
            "etc": "..."
        },
        "sentiment_score": float (optional)
    }

    Returns:
    {
        "market_id": "string",
        "price_trend": "string",
        "volume_analysis": "string",
        "key_insights": ["string"],
        "recommendation": "BUY/SELL/HOLD/WATCH",
        "risk_level": "LOW/MEDIUM/HIGH",
        "confidence": float (0 to 1),
        "sentiment_score": float (if provided),
        "timestamp": "ISO8601"
    }
    """
    logger.info("Market analysis endpoint called")

    try:
        # Parse request body
        req_body = req.get_json()

        # Validate required fields
        market_id = req_body.get("market_id")
        market_data = req_body.get("market_data")

        if not market_id or not market_data:
            return func.HttpResponse(
                json.dumps({
                    "error": "Missing required fields",
                    "required": ["market_id", "market_data"]
                }),
                status_code=400,
                mimetype="application/json"
            )

        sentiment_score = req_body.get("sentiment_score")

        logger.info(f"Analyzing market: {market_id}")

        # Get Azure OpenAI client (lazy-loaded)
        azure_openai = get_azure_openai()

        # Perform comprehensive analysis using GPT-5-Pro
        analysis = azure_openai.analyze_market(
            market_id=market_id,
            market_data=market_data,
            sentiment_score=sentiment_score
        )

        # Add market_id, sentiment, and timestamp
        analysis["market_id"] = market_id
        if sentiment_score is not None:
            analysis["sentiment_score"] = sentiment_score

        analysis["timestamp"] = datetime.utcnow().isoformat()

        # Store in database
        try:
            db_client = get_db_client()
            db_client.store_analysis(market_id, analysis)
            logger.info(f"Analysis stored in database for market {market_id}")
        except Exception as e:
            logger.warning(f"Failed to store analysis in database: {e}")
            # Don't fail the request if DB storage fails

        # Return result
        return func.HttpResponse(
            json.dumps(analysis, indent=2),
            status_code=200,
            mimetype="application/json"
        )

    except ValueError as e:
        logger.error(f"Invalid request: {e}")
        return func.HttpResponse(
            json.dumps({"error": f"Invalid request: {str(e)}"}),
            status_code=400,
            mimetype="application/json"
        )
    except Exception as e:
        logger.error(f"Market analysis failed: {e}", exc_info=True)
        return func.HttpResponse(
            json.dumps({
                "error": "Internal server error",
                "message": str(e)
            }),
            status_code=500,
            mimetype="application/json"
        )


# =============================================================================
# HELPER FUNCTIONS (Agent 3 - Backend Core)
# =============================================================================

def _upsert_markets(markets: List[Dict]):
    """
    Upsert markets into database.

    Args:
        markets: List of market dictionaries
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            for market in markets:
                cursor.execute("""
                    INSERT INTO markets (
                        token_id, question, description, end_date,
                        outcome_prices, volume, active, updated_at
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
                    ON CONFLICT (token_id)
                    DO UPDATE SET
                        question = EXCLUDED.question,
                        description = EXCLUDED.description,
                        end_date = EXCLUDED.end_date,
                        outcome_prices = EXCLUDED.outcome_prices,
                        volume = EXCLUDED.volume,
                        active = EXCLUDED.active,
                        updated_at = NOW()
                """, (
                    market['token_id'],
                    market['question'],
                    market['description'],
                    market['end_date'],
                    json.dumps(market['outcome_prices']),
                    market['volume'],
                    market['active']
                ))
            conn.commit()
            logger.info(f"Successfully upserted {len(markets)} markets")
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Failed to upsert markets: {e}")
        raise
    finally:
        if conn:
            return_connection(conn)


def _store_price_history(price_data: Dict):
    """
    Store price data in price_history table.

    Args:
        price_data: Price information dictionary
    """
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO price_history (token_id, price, volume)
                VALUES (%s, %s, %s)
            """, (
                price_data['token_id'],
                price_data['price'],
                price_data['volume']
            ))
            conn.commit()
    except Exception as e:
        if conn:
            conn.rollback()
        logger.error(f"Failed to store price history: {e}")
        # Don't raise - this is not critical
    finally:
        if conn:
            return_connection(conn)


def _get_price_history_24h(token_id: str) -> List[Dict]:
    """
    Get 24h price history for a token.

    Args:
        token_id: Market token ID

    Returns:
        List of price history entries
    """
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT price, timestamp
                FROM price_history
                WHERE token_id = %s
                    AND timestamp >= NOW() - INTERVAL '24 hours'
                ORDER BY timestamp DESC
                LIMIT 100
            """, (token_id,))

            rows = cursor.fetchall()
            return_connection(conn)

            return [
                {
                    "price": float(row[0]),
                    "timestamp": row[1].isoformat()
                }
                for row in rows
            ]
    except Exception as e:
        logger.error(f"Failed to fetch price history: {e}")
        return []


# =============================================================================
# INITIALIZATION
# =============================================================================

# Database initialization - graceful degradation
_database_available = False

def ensure_database_initialized():
    """
    Ensure database is initialized. Returns True if successful, False otherwise.
    Functions can still register even if database init fails.
    """
    global _database_available
    if not _database_available:
        try:
            logger.info("Initializing database schema")
            init_database()
            _database_available = True
            logger.info("✅ Database initialized successfully")
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            logger.warning("Functions will register but database operations may fail")
            # DO NOT raise - allow functions to register
    return _database_available

# Attempt database init but don't block function registration
try:
    ensure_database_initialized()
except Exception as e:
    logger.error(f"Database init attempt failed: {e}")
    # Continue - functions will still register
