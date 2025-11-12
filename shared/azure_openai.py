"""Azure OpenAI GPT-5-Pro Client with Managed Identity support"""

import os
import logging
from typing import Optional, Dict, Any
from openai import AzureOpenAI
from azure.identity import DefaultAzureCredential, ManagedIdentityCredential

logger = logging.getLogger(__name__)


class AzureOpenAIClient:
    """Client for Azure OpenAI GPT-5-Pro with passwordless auth"""

    def __init__(self):
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "https://brn-azai.openai.azure.com/")
        self.deployment = os.getenv("GPT5_PRO_DEPLOYMENT_NAME", "gpt-5-pro")
        self.api_version = "2025-01-01-preview"
        self.max_retries = 3

        # Try Managed Identity first, fallback to API key
        self.client = self._initialize_client()

    def _initialize_client(self) -> AzureOpenAI:
        """Initialize client with Managed Identity or API key"""
        try:
            # Try Managed Identity first (passwordless)
            logger.info("Attempting Managed Identity authentication...")
            credential = DefaultAzureCredential()

            # Get token to test authentication
            token = credential.get_token("https://cognitiveservices.azure.com/.default")
            logger.info("Managed Identity authentication successful!")

            return AzureOpenAI(
                azure_endpoint=self.endpoint,
                api_version=self.api_version,
                azure_ad_token_provider=lambda: credential.get_token(
                    "https://cognitiveservices.azure.com/.default"
                ).token
            )

        except Exception as e:
            logger.warning(f"Managed Identity failed: {e}. Falling back to API key...")

            # Fallback to API key
            api_key = os.getenv("GPT5_PRO_KEY")
            if not api_key:
                raise ValueError("No API key found and Managed Identity failed")

            return AzureOpenAI(
                azure_endpoint=self.endpoint,
                api_key=api_key,
                api_version=self.api_version
            )

    def analyze_sentiment(
        self,
        market_title: str,
        market_description: str,
        news_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze market sentiment using GPT-5-Pro

        Returns:
            {
                "score": float (-1 to 1),
                "confidence": float (0 to 1),
                "reasoning": str,
                "factors": [str]
            }
        """
        try:
            prompt = self._build_sentiment_prompt(market_title, market_description, news_context)

            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert prediction market analyst. "
                            "Analyze sentiment and provide a score from -1 (very negative) to 1 (very positive). "
                            "Return ONLY valid JSON with keys: score, confidence, reasoning, factors."
                        )
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )

            result = response.choices[0].message.content

            # Parse JSON response
            import json
            sentiment_data = json.loads(result)

            # Validate score range
            score = float(sentiment_data.get("score", 0))
            sentiment_data["score"] = max(-1.0, min(1.0, score))

            logger.info(f"GPT-5-Pro sentiment analysis complete: {sentiment_data['score']}")
            return sentiment_data

        except Exception as e:
            logger.error(f"GPT-5-Pro sentiment analysis failed: {e}")
            raise

    def analyze_market(
        self,
        market_id: str,
        market_data: Dict[str, Any],
        sentiment_score: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive market analysis using GPT-5-Pro

        Returns:
            {
                "price_trend": str,
                "volume_analysis": str,
                "key_insights": [str],
                "recommendation": str,
                "risk_level": str,
                "confidence": float
            }
        """
        try:
            prompt = self._build_analysis_prompt(market_data, sentiment_score)

            response = self.client.chat.completions.create(
                model=self.deployment,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert prediction market analyst. "
                            "Provide comprehensive market analysis with trading recommendations. "
                            "Return ONLY valid JSON with keys: price_trend, volume_analysis, "
                            "key_insights, recommendation, risk_level, confidence."
                        )
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )

            result = response.choices[0].message.content

            # Parse JSON response
            import json
            analysis = json.loads(result)

            logger.info(f"GPT-5-Pro market analysis complete for {market_id}")
            return analysis

        except Exception as e:
            logger.error(f"GPT-5-Pro market analysis failed: {e}")
            raise

    def _build_sentiment_prompt(
        self,
        title: str,
        description: str,
        news_context: Optional[str]
    ) -> str:
        """Build prompt for sentiment analysis"""
        prompt = f"""
Analyze the sentiment for this prediction market:

**Title:** {title}
**Description:** {description}
"""

        if news_context:
            prompt += f"\n**Recent News Context:**\n{news_context}\n"

        prompt += """
Provide sentiment analysis with:
1. **score**: Float from -1 (very negative) to 1 (very positive)
2. **confidence**: Float from 0 to 1 indicating analysis confidence
3. **reasoning**: Explanation of the sentiment score
4. **factors**: List of key factors influencing sentiment

Return as JSON.
"""
        return prompt

    def _build_analysis_prompt(
        self,
        market_data: Dict[str, Any],
        sentiment_score: Optional[float]
    ) -> str:
        """Build prompt for market analysis"""
        prompt = f"""
Analyze this prediction market:

**Market Data:**
{market_data}
"""

        if sentiment_score is not None:
            prompt += f"\n**Sentiment Score:** {sentiment_score} (-1 to 1)\n"

        prompt += """
Provide comprehensive analysis with:
1. **price_trend**: Description of current price trends
2. **volume_analysis**: Analysis of trading volume patterns
3. **key_insights**: List of 3-5 key insights about the market
4. **recommendation**: Trading recommendation (BUY/SELL/HOLD/WATCH)
5. **risk_level**: Risk assessment (LOW/MEDIUM/HIGH)
6. **confidence**: Confidence level in recommendation (0 to 1)

Return as JSON.
"""
        return prompt
