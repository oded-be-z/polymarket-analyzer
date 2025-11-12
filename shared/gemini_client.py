"""Google Gemini API Client for fallback analysis"""

import os
import logging
from typing import Dict, Any, Optional
import google.generativeai as genai

logger = logging.getLogger(__name__)


class GeminiClient:
    """Client for Google Gemini API as fallback analyzer"""

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found in environment")
            self.api_key = None
        else:
            genai.configure(api_key=self.api_key)

        self.model_name = "gemini-2.5-flash"  # Fast reasoning model
        self.model = None

        if self.is_available():
            try:
                self.model = genai.GenerativeModel(
                    model_name=self.model_name,
                    generation_config={
                        "temperature": 0.3,
                        "top_p": 0.95,
                        "top_k": 40,
                        "max_output_tokens": 1024,
                    }
                )
                logger.info("Gemini client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini model: {e}")
                self.model = None

    def is_available(self) -> bool:
        """Check if Gemini API is configured"""
        return self.api_key is not None

    def analyze_sentiment(
        self,
        market_title: str,
        market_description: str,
        context: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Analyze market sentiment using Gemini as fallback

        Returns:
            {
                "score": float (-1 to 1),
                "confidence": float (0 to 1),
                "reasoning": str,
                "factors": [str]
            }
        """
        if not self.is_available() or not self.model:
            logger.warning("Gemini API not configured, cannot analyze sentiment")
            return None

        try:
            prompt = self._build_sentiment_prompt(market_title, market_description, context)

            response = self.model.generate_content(prompt)

            if response and response.text:
                # Parse JSON response
                import json
                try:
                    sentiment_data = json.loads(response.text)

                    # Validate score range
                    score = float(sentiment_data.get("score", 0))
                    sentiment_data["score"] = max(-1.0, min(1.0, score))

                    logger.info(f"Gemini sentiment analysis complete: {sentiment_data['score']}")
                    return sentiment_data
                except json.JSONDecodeError:
                    logger.warning("Failed to parse Gemini sentiment JSON")
                    return None
            else:
                logger.warning("No response from Gemini")
                return None

        except Exception as e:
            logger.error(f"Gemini sentiment analysis failed: {e}")
            return None

    def analyze_market(
        self,
        market_id: str,
        market_data: Dict[str, Any],
        sentiment_score: Optional[float] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Basic market analysis using Gemini as fallback

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
        if not self.is_available() or not self.model:
            logger.warning("Gemini API not configured, cannot analyze market")
            return None

        try:
            prompt = self._build_analysis_prompt(market_data, sentiment_score)

            response = self.model.generate_content(prompt)

            if response and response.text:
                # Parse JSON response
                import json
                try:
                    analysis = json.loads(response.text)
                    logger.info(f"Gemini market analysis complete for {market_id}")
                    return analysis
                except json.JSONDecodeError:
                    logger.warning("Failed to parse Gemini analysis JSON")
                    return None
            else:
                logger.warning("No response from Gemini")
                return None

        except Exception as e:
            logger.error(f"Gemini market analysis failed: {e}")
            return None

    def _build_sentiment_prompt(
        self,
        title: str,
        description: str,
        context: Optional[str]
    ) -> str:
        """Build prompt for sentiment analysis"""
        prompt = f"""
Analyze the sentiment for this prediction market and return ONLY valid JSON:

**Market Title:** {title}
**Market Description:** {description}
"""

        if context:
            prompt += f"\n**Additional Context:**\n{context}\n"

        prompt += """
Provide sentiment analysis as JSON with these exact keys:
{
    "score": <float from -1 to 1>,
    "confidence": <float from 0 to 1>,
    "reasoning": "<explanation of the sentiment score>",
    "factors": ["<factor 1>", "<factor 2>", "<factor 3>"]
}

Guidelines:
- score: -1 (very negative) to 1 (very positive)
- confidence: 0 (low confidence) to 1 (high confidence)
- reasoning: Clear explanation of the sentiment assessment
- factors: List of 3-5 key factors influencing sentiment

Return ONLY the JSON object, no additional text.
"""
        return prompt

    def _build_analysis_prompt(
        self,
        market_data: Dict[str, Any],
        sentiment_score: Optional[float]
    ) -> str:
        """Build prompt for market analysis"""
        prompt = f"""
Analyze this prediction market and return ONLY valid JSON:

**Market Data:**
{market_data}
"""

        if sentiment_score is not None:
            prompt += f"\n**Sentiment Score:** {sentiment_score} (-1 to 1)\n"

        prompt += """
Provide comprehensive analysis as JSON with these exact keys:
{
    "price_trend": "<description of current price trends>",
    "volume_analysis": "<analysis of trading volume patterns>",
    "key_insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
    "recommendation": "<BUY/SELL/HOLD/WATCH>",
    "risk_level": "<LOW/MEDIUM/HIGH>",
    "confidence": <float from 0 to 1>
}

Guidelines:
- price_trend: Describe current price movement and patterns
- volume_analysis: Analyze trading volume and liquidity
- key_insights: 3-5 important observations about the market
- recommendation: Trading action (BUY/SELL/HOLD/WATCH)
- risk_level: Risk assessment (LOW/MEDIUM/HIGH)
- confidence: Confidence in the recommendation (0 to 1)

Return ONLY the JSON object, no additional text.
"""
        return prompt
