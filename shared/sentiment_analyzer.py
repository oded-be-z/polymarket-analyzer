"""Multi-source sentiment aggregation with cascading fallback"""

import logging
from typing import Dict, Any, List, Optional, Tuple
from .perplexity_client import PerplexityClient
from .azure_openai import AzureOpenAIClient
from .gemini_client import GeminiClient

logger = logging.getLogger(__name__)


class SentimentAnalyzer:
    """Aggregates sentiment from multiple AI sources with intelligent fallback"""

    def __init__(self):
        self.perplexity = PerplexityClient()
        self.azure_openai = AzureOpenAIClient()
        self.gemini = GeminiClient()

    def analyze_multi_source(
        self,
        market_title: str,
        market_description: str
    ) -> Dict[str, Any]:
        """
        Analyze sentiment from multiple sources with cascading fallback

        Cascade order:
        1. Perplexity (latest news + sentiment)
        2. Azure OpenAI GPT-5-Pro (deep analysis)
        3. Google Gemini (fallback analysis)
        4. Neutral (0.0) if all fail

        Returns:
            {
                "consensus_sentiment": float (-1 to 1),
                "consensus_confidence": float (0 to 1),
                "sources": [
                    {
                        "source": str,
                        "score": float,
                        "confidence": float,
                        "reasoning": str,
                        "weight": float
                    }
                ],
                "news_context": Optional[str],
                "status": str
            }
        """
        sources = []
        news_context = None
        status = "success"

        # Source 1: Perplexity (latest news)
        perplexity_result = None
        if self.perplexity.is_available():
            try:
                logger.info("Fetching news from Perplexity...")
                news_context = self.perplexity.search_market_news(
                    market_title,
                    market_description
                )

                logger.info("Analyzing sentiment with Perplexity...")
                perplexity_result = self.perplexity.analyze_news_sentiment(
                    market_title,
                    market_description
                )

                if perplexity_result:
                    sources.append({
                        "source": "perplexity",
                        "score": perplexity_result.get("score", 0),
                        "confidence": perplexity_result.get("confidence", 0.5),
                        "reasoning": perplexity_result.get("reasoning", "News-based sentiment"),
                        "weight": 0.4  # High weight for news-based analysis
                    })
                    logger.info(f"Perplexity analysis: score={perplexity_result.get('score')}")
            except Exception as e:
                logger.warning(f"Perplexity analysis failed: {e}")
                status = "partial"

        # Source 2: Azure OpenAI GPT-5-Pro (primary analyzer)
        try:
            logger.info("Analyzing sentiment with Azure OpenAI GPT-5-Pro...")
            azure_result = self.azure_openai.analyze_sentiment(
                market_title,
                market_description,
                news_context
            )

            if azure_result:
                sources.append({
                    "source": "azure_openai_gpt5_pro",
                    "score": azure_result.get("score", 0),
                    "confidence": azure_result.get("confidence", 0.7),
                    "reasoning": azure_result.get("reasoning", "Deep AI analysis"),
                    "weight": 0.4  # High weight for advanced model
                })
                logger.info(f"Azure OpenAI analysis: score={azure_result.get('score')}")
        except Exception as e:
            logger.warning(f"Azure OpenAI analysis failed: {e}")
            status = "partial"

        # Source 3: Google Gemini (fallback)
        if len(sources) < 2 and self.gemini.is_available():
            try:
                logger.info("Analyzing sentiment with Google Gemini (fallback)...")
                gemini_result = self.gemini.analyze_sentiment(
                    market_title,
                    market_description,
                    news_context
                )

                if gemini_result:
                    sources.append({
                        "source": "google_gemini",
                        "score": gemini_result.get("score", 0),
                        "confidence": gemini_result.get("confidence", 0.6),
                        "reasoning": gemini_result.get("reasoning", "Gemini fallback analysis"),
                        "weight": 0.2  # Lower weight for fallback
                    })
                    logger.info(f"Gemini analysis: score={gemini_result.get('score')}")
            except Exception as e:
                logger.warning(f"Gemini analysis failed: {e}")
                status = "partial"

        # Calculate consensus
        if sources:
            consensus_sentiment, consensus_confidence = self._calculate_consensus(sources)
        else:
            logger.warning("All sentiment sources failed, returning neutral")
            consensus_sentiment = 0.0
            consensus_confidence = 0.0
            status = "failed_all_sources"

        return {
            "consensus_sentiment": consensus_sentiment,
            "consensus_confidence": consensus_confidence,
            "sources": sources,
            "news_context": news_context,
            "status": status
        }

    def _calculate_consensus(
        self,
        sources: List[Dict[str, Any]]
    ) -> Tuple[float, float]:
        """
        Calculate weighted consensus sentiment and confidence

        Weighted by confidence and source weight
        """
        if not sources:
            return 0.0, 0.0

        total_weight = 0.0
        weighted_sentiment = 0.0
        weighted_confidence = 0.0

        for source in sources:
            score = source.get("score", 0)
            confidence = source.get("confidence", 0.5)
            weight = source.get("weight", 1.0)

            # Combine confidence and weight
            effective_weight = confidence * weight
            total_weight += effective_weight

            weighted_sentiment += score * effective_weight
            weighted_confidence += confidence * weight

        if total_weight > 0:
            consensus_sentiment = weighted_sentiment / total_weight
            consensus_confidence = weighted_confidence / sum(s.get("weight", 1.0) for s in sources)
        else:
            consensus_sentiment = 0.0
            consensus_confidence = 0.0

        # Clamp values
        consensus_sentiment = max(-1.0, min(1.0, consensus_sentiment))
        consensus_confidence = max(0.0, min(1.0, consensus_confidence))

        logger.info(
            f"Consensus calculated: sentiment={consensus_sentiment:.3f}, "
            f"confidence={consensus_confidence:.3f} from {len(sources)} sources"
        )

        return consensus_sentiment, consensus_confidence

    def get_status_summary(self) -> Dict[str, bool]:
        """Get availability status of all sources"""
        return {
            "perplexity_available": self.perplexity.is_available(),
            "azure_openai_available": True,  # Always available (uses fallback)
            "gemini_available": self.gemini.is_available()
        }
