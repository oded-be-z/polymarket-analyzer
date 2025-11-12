"""Perplexity API Client for news research and sentiment analysis"""

import os
import logging
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class PerplexityClient:
    """Client for Perplexity API news research"""

    def __init__(self):
        self.api_key = os.getenv("PERPLEXITY_API_KEY")
        if not self.api_key:
            logger.warning("PERPLEXITY_API_KEY not found in environment")
            self.api_key = None

        self.endpoint = "https://api.perplexity.ai/chat/completions"
        self.model = "llama-3.1-sonar-large-128k-online"  # Latest web search model
        self.timeout = 30

    def is_available(self) -> bool:
        """Check if Perplexity API is configured"""
        return self.api_key is not None

    def search_market_news(
        self,
        market_title: str,
        market_description: str,
        max_results: int = 5
    ) -> Optional[str]:
        """
        Search for latest news about the market

        Returns:
            News summary string or None if failed
        """
        if not self.is_available():
            logger.warning("Perplexity API not configured, skipping news search")
            return None

        try:
            query = self._build_search_query(market_title, market_description)

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a news research assistant. "
                            "Search for the latest news and provide a concise summary "
                            "focused on sentiment and market-moving information."
                        )
                    },
                    {
                        "role": "user",
                        "content": query
                    }
                ],
                "max_tokens": 1000,
                "temperature": 0.2,
                "top_p": 0.9,
                "return_citations": True,
                "search_recency_filter": "week"  # Focus on recent news
            }

            response = requests.post(
                self.endpoint,
                headers=headers,
                json=payload,
                timeout=self.timeout
            )

            response.raise_for_status()
            result = response.json()

            # Extract news summary
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            citations = result.get("citations", [])

            if content:
                logger.info(f"Perplexity found {len(citations)} news sources")
                return self._format_news_summary(content, citations)
            else:
                logger.warning("No news content returned from Perplexity")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Perplexity API request failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Perplexity news search failed: {e}")
            return None

    def analyze_news_sentiment(
        self,
        market_title: str,
        market_description: str
    ) -> Optional[Dict[str, Any]]:
        """
        Analyze sentiment from news about the market

        Returns:
            {
                "score": float (-1 to 1),
                "confidence": float (0 to 1),
                "reasoning": str,
                "sources": [str]
            }
        """
        if not self.is_available():
            logger.warning("Perplexity API not configured, skipping sentiment analysis")
            return None

        try:
            query = self._build_sentiment_query(market_title, market_description)

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a sentiment analysis expert. "
                            "Analyze news sentiment and provide a score from -1 (very negative) "
                            "to 1 (very positive). Return ONLY valid JSON with keys: "
                            "score, confidence, reasoning, sources."
                        )
                    },
                    {
                        "role": "user",
                        "content": query
                    }
                ],
                "max_tokens": 800,
                "temperature": 0.2,
                "return_citations": True,
                "search_recency_filter": "week"
            }

            response = requests.post(
                self.endpoint,
                headers=headers,
                json=payload,
                timeout=self.timeout
            )

            response.raise_for_status()
            result = response.json()

            # Extract sentiment analysis
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
            citations = result.get("citations", [])

            if content:
                import json
                # Try to parse JSON response
                try:
                    sentiment_data = json.loads(content)
                    # Add citations
                    sentiment_data["sources"] = citations[:5]  # Top 5 sources

                    # Validate score range
                    score = float(sentiment_data.get("score", 0))
                    sentiment_data["score"] = max(-1.0, min(1.0, score))

                    logger.info(f"Perplexity sentiment analysis complete: {sentiment_data['score']}")
                    return sentiment_data
                except json.JSONDecodeError:
                    logger.warning("Failed to parse Perplexity sentiment JSON")
                    return None
            else:
                logger.warning("No sentiment content returned from Perplexity")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Perplexity API request failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Perplexity sentiment analysis failed: {e}")
            return None

    def _build_search_query(self, title: str, description: str) -> str:
        """Build search query for news"""
        return f"""
Search for the latest news and developments about:

**Topic:** {title}
**Context:** {description}

Provide a concise summary of:
1. Recent news and developments
2. Key events or announcements
3. Public sentiment and reactions
4. Expert opinions or predictions

Focus on factual information from the past week.
"""

    def _build_sentiment_query(self, title: str, description: str) -> str:
        """Build query for sentiment analysis"""
        return f"""
Analyze news sentiment about:

**Topic:** {title}
**Context:** {description}

Based on recent news from the past week, provide sentiment analysis as JSON:
{{
    "score": <float from -1 to 1>,
    "confidence": <float from 0 to 1>,
    "reasoning": "<explanation of sentiment>",
    "sources": []
}}

Consider:
- Positive news and developments (+1 direction)
- Negative news and concerns (-1 direction)
- Neutral or mixed sentiment (0 direction)
- Confidence based on consensus and source quality
"""

    def _format_news_summary(self, content: str, citations: list) -> str:
        """Format news summary with citations"""
        summary = content

        if citations:
            summary += "\n\n**Sources:**\n"
            for i, citation in enumerate(citations[:5], 1):
                summary += f"{i}. {citation}\n"

        return summary
