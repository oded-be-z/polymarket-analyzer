export interface Market {
  id: string
  question: string
  description?: string
  category: string
  yesPrice: number
  noPrice: number
  volume?: number
  volume24h: number
  liquidity: number
  endDate: Date
  active: boolean
  tokens?: Array<{
    id: string
    token_id: string
    name: string
    outcome: string
    price: number
    volume: number
    winner?: boolean
  }>
  sentiment?: {
    score: number
    confidence: number
  }
}

export interface PriceHistory {
  timestamp: number
  yes: number
  no: number
}

export interface VolumeHistory {
  timestamp: number
  volume: number
}

export interface SentimentData {
  market_id: string
  consensus_sentiment: number
  consensus_confidence: number
  sources: Array<{
    source: string
    score: number
    confidence: number
    reasoning: string
    weight: number
  }>
  news_context?: string
  status: string
  timestamp: string
}

export interface Prediction {
  market_id: string
  price_trend: string
  volume_analysis: string
  key_insights: string[]
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'WATCH'
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
  confidence: number
  sentiment_score: number
  predicted_winner?: string
  reasoning?: string
  timestamp: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
