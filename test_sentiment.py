"""Test sentiment analysis with mock data"""

import json
from datetime import datetime


def test_sentiment_mock():
    """Test sentiment analysis with mock responses"""

    # Mock market data
    market_data = {
        "market_id": "test-market-123",
        "market_title": "Will Bitcoin reach $100,000 by end of 2025?",
        "market_description": "This market resolves to YES if Bitcoin (BTC) reaches $100,000 USD on any major exchange by December 31, 2025, 11:59 PM UTC."
    }

    # Mock Perplexity response
    mock_perplexity = {
        "score": 0.65,
        "confidence": 0.75,
        "reasoning": "Recent institutional adoption and ETF approvals show positive sentiment. However, regulatory concerns remain.",
        "sources": [
            "https://example.com/bitcoin-news-1",
            "https://example.com/bitcoin-news-2"
        ]
    }

    # Mock Azure OpenAI response
    mock_azure = {
        "score": 0.55,
        "confidence": 0.80,
        "reasoning": "Technical analysis suggests bullish trend, but macro economic factors introduce uncertainty.",
        "factors": [
            "Institutional adoption increasing",
            "ETF approvals driving demand",
            "Regulatory environment uncertain",
            "Market volatility concerns"
        ]
    }

    # Mock Gemini response
    mock_gemini = {
        "score": 0.70,
        "confidence": 0.70,
        "reasoning": "Strong bullish sentiment from crypto community, supported by adoption metrics.",
        "factors": [
            "Growing institutional interest",
            "Positive social media sentiment",
            "Strong technical support levels"
        ]
    }

    # Calculate mock consensus
    sources = [
        {
            "source": "perplexity",
            "score": mock_perplexity["score"],
            "confidence": mock_perplexity["confidence"],
            "reasoning": mock_perplexity["reasoning"],
            "weight": 0.4
        },
        {
            "source": "azure_openai_gpt5_pro",
            "score": mock_azure["score"],
            "confidence": mock_azure["confidence"],
            "reasoning": mock_azure["reasoning"],
            "weight": 0.4
        },
        {
            "source": "google_gemini",
            "score": mock_gemini["score"],
            "confidence": mock_gemini["confidence"],
            "reasoning": mock_gemini["reasoning"],
            "weight": 0.2
        }
    ]

    # Weighted consensus calculation
    total_weight = 0.0
    weighted_sentiment = 0.0
    weighted_confidence = 0.0

    for source in sources:
        effective_weight = source["confidence"] * source["weight"]
        total_weight += effective_weight
        weighted_sentiment += source["score"] * effective_weight
        weighted_confidence += source["confidence"] * source["weight"]

    consensus_sentiment = weighted_sentiment / total_weight
    consensus_confidence = weighted_confidence / sum(s["weight"] for s in sources)

    # Mock result
    result = {
        "market_id": market_data["market_id"],
        "consensus_sentiment": round(consensus_sentiment, 3),
        "consensus_confidence": round(consensus_confidence, 3),
        "sources": sources,
        "news_context": "Mock news: Bitcoin sees increased institutional adoption with recent ETF approvals...",
        "status": "success",
        "timestamp": datetime.utcnow().isoformat()
    }

    print("=" * 80)
    print("MOCK SENTIMENT ANALYSIS TEST")
    print("=" * 80)
    print(json.dumps(result, indent=2))
    print("\n" + "=" * 80)
    print(f"Consensus Sentiment: {result['consensus_sentiment']} (-1 to 1)")
    print(f"Consensus Confidence: {result['consensus_confidence']} (0 to 1)")
    print(f"Sources Used: {len(result['sources'])}")
    print("=" * 80)

    return result


def test_analysis_mock():
    """Test market analysis with mock responses"""

    market_data = {
        "market_id": "test-market-123",
        "title": "Will Bitcoin reach $100,000 by end of 2025?",
        "description": "This market resolves to YES if Bitcoin reaches $100,000 USD.",
        "current_price": 0.67,
        "volume_24h": 125000.00,
        "price_history": [0.45, 0.52, 0.58, 0.64, 0.67]
    }

    # Mock GPT-5-Pro analysis
    mock_analysis = {
        "market_id": market_data["market_id"],
        "price_trend": "Strong upward trend observed. Price increased from 0.45 to 0.67 (49% gain), indicating growing market confidence in Bitcoin reaching $100k.",
        "volume_analysis": "Healthy 24h volume of $125,000 suggests active trading and strong liquidity. Volume is increasing alongside price, confirming bullish sentiment.",
        "key_insights": [
            "Market showing consistent upward momentum with 49% price increase",
            "Volume growth indicates institutional and retail interest",
            "Current probability of 67% suggests market believes outcome is more likely than not",
            "Price action aligns with positive news flow on Bitcoin adoption",
            "Risk-reward profile favors buyers at current levels"
        ],
        "recommendation": "BUY",
        "risk_level": "MEDIUM",
        "confidence": 0.78,
        "sentiment_score": 0.63,
        "timestamp": datetime.utcnow().isoformat()
    }

    print("\n" + "=" * 80)
    print("MOCK MARKET ANALYSIS TEST")
    print("=" * 80)
    print(json.dumps(mock_analysis, indent=2))
    print("\n" + "=" * 80)
    print(f"Recommendation: {mock_analysis['recommendation']}")
    print(f"Risk Level: {mock_analysis['risk_level']}")
    print(f"Confidence: {mock_analysis['confidence']}")
    print(f"Key Insights: {len(mock_analysis['key_insights'])} insights generated")
    print("=" * 80)

    return mock_analysis


if __name__ == "__main__":
    print("\n🧪 Running Mock Tests for Polymarket Analyzer Backend AI\n")

    # Test sentiment analysis
    sentiment_result = test_sentiment_mock()

    # Test market analysis
    analysis_result = test_analysis_mock()

    print("\n✅ All mock tests completed successfully!\n")
    print("📝 These mock responses demonstrate the expected API behavior.")
    print("🔄 Replace with actual API calls when services are configured.\n")
