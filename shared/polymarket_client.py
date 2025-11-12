"""
Polymarket CLOB API client wrapper.

Provides simplified interface to Polymarket's CLOB API with:
- Authentication using private key
- Retry logic with exponential backoff
- Error handling and logging
"""

import os
import logging
import time
from typing import List, Dict, Optional
from py_clob_client.client import ClobClient
from py_clob_client.constants import POLYGON

logger = logging.getLogger(__name__)


class PolymarketClient:
    """Wrapper for Polymarket CLOB API client."""

    def __init__(self):
        """Initialize Polymarket client with credentials from environment."""
        self.host = os.getenv("POLYMARKET_HOST", "https://clob.polymarket.com")
        self.chain_id = POLYGON
        self.private_key = os.getenv("POLYMARKET_PRIVATE_KEY")

        if not self.private_key:
            logger.warning("POLYMARKET_PRIVATE_KEY not set - using read-only mode")
            self.client = ClobClient(self.host, chain_id=self.chain_id)
        else:
            logger.info("Initializing Polymarket client with authentication")
            self.client = ClobClient(
                self.host,
                key=self.private_key,
                chain_id=self.chain_id
            )

    def _retry_request(self, func, *args, max_attempts=3, **kwargs):
        """
        Execute a function with retry logic.

        Args:
            func: Function to execute
            max_attempts: Maximum number of retry attempts
            *args, **kwargs: Arguments to pass to function

        Returns:
            Result of function execution

        Raises:
            Exception: If all retry attempts fail
        """
        for attempt in range(max_attempts):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if attempt == max_attempts - 1:
                    logger.error(f"Failed after {max_attempts} attempts: {e}")
                    raise

                wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {wait_time}s...")
                time.sleep(wait_time)

    def get_markets(self, active_only: bool = True) -> List[Dict]:
        """
        Fetch all markets from Polymarket.

        Args:
            active_only: Only return active markets (default: True)

        Returns:
            List of market dictionaries with structure:
            {
                'token_id': str,
                'question': str,
                'description': str,
                'end_date': str (ISO format),
                'outcome_prices': dict,
                'volume': float,
                'active': bool
            }
        """
        logger.info(f"Fetching markets (active_only={active_only})")

        try:
            # Get all markets from CLOB API
            markets_response = self._retry_request(self.client.get_markets)

            if not markets_response:
                logger.warning("No markets returned from API")
                return []

            markets = []
            for market in markets_response:
                try:
                    # Check if market is active
                    is_active = market.get('active', True)
                    if active_only and not is_active:
                        continue

                    # Extract and normalize market data
                    market_data = {
                        'token_id': market.get('condition_id', ''),
                        'question': market.get('question', ''),
                        'description': market.get('description', ''),
                        'end_date': market.get('end_date_iso', None),
                        'outcome_prices': market.get('outcome_prices', {}),
                        'volume': float(market.get('volume', 0)),
                        'active': is_active
                    }

                    markets.append(market_data)

                except Exception as e:
                    logger.warning(f"Failed to parse market {market.get('condition_id', 'unknown')}: {e}")
                    continue

            logger.info(f"Successfully fetched {len(markets)} markets")
            return markets

        except Exception as e:
            logger.error(f"Failed to fetch markets: {e}")
            raise

    def get_market_price(self, token_id: str) -> Optional[Dict]:
        """
        Get current price for a specific market token.

        Args:
            token_id: Market token ID

        Returns:
            Dictionary with price information:
            {
                'token_id': str,
                'price': float,
                'volume': float,
                'timestamp': str (ISO format)
            }
            Returns None if market not found.
        """
        logger.info(f"Fetching price for token {token_id}")

        try:
            # Get market details including price
            market = self._retry_request(
                self.client.get_market,
                token_id
            )

            if not market:
                logger.warning(f"Market {token_id} not found")
                return None

            # Extract price information
            outcome_prices = market.get('outcome_prices', [])
            current_price = outcome_prices[0] if outcome_prices else 0.0

            price_data = {
                'token_id': token_id,
                'price': float(current_price),
                'volume': float(market.get('volume', 0)),
                'timestamp': market.get('timestamp', None)
            }

            logger.info(f"Price for {token_id}: ${price_data['price']:.4f}")
            return price_data

        except Exception as e:
            logger.error(f"Failed to fetch price for {token_id}: {e}")
            raise

    def get_orderbook(self, token_id: str) -> Optional[Dict]:
        """
        Get orderbook for a specific market.

        Args:
            token_id: Market token ID

        Returns:
            Dictionary with bids and asks
        """
        logger.info(f"Fetching orderbook for token {token_id}")

        try:
            orderbook = self._retry_request(
                self.client.get_order_book,
                token_id
            )

            if not orderbook:
                logger.warning(f"Orderbook for {token_id} not found")
                return None

            return {
                'token_id': token_id,
                'bids': orderbook.get('bids', []),
                'asks': orderbook.get('asks', []),
                'spread': self._calculate_spread(orderbook)
            }

        except Exception as e:
            logger.error(f"Failed to fetch orderbook for {token_id}: {e}")
            raise

    def _calculate_spread(self, orderbook: Dict) -> float:
        """
        Calculate bid-ask spread.

        Args:
            orderbook: Orderbook dictionary with bids and asks

        Returns:
            Spread as percentage
        """
        try:
            bids = orderbook.get('bids', [])
            asks = orderbook.get('asks', [])

            if not bids or not asks:
                return 0.0

            best_bid = float(bids[0]['price'])
            best_ask = float(asks[0]['price'])

            if best_bid == 0:
                return 0.0

            spread = ((best_ask - best_bid) / best_bid) * 100
            return round(spread, 4)

        except Exception as e:
            logger.warning(f"Failed to calculate spread: {e}")
            return 0.0


# Module-level singleton instance
_client: Optional[PolymarketClient] = None


def get_polymarket_client() -> PolymarketClient:
    """
    Get or create Polymarket client singleton.

    Returns:
        PolymarketClient: Client instance
    """
    global _client

    if _client is None:
        logger.info("Creating Polymarket client instance")
        _client = PolymarketClient()

    return _client
