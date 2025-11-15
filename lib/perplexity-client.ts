/**
 * Perplexity API Client for Sentimark Intelligence
 *
 * Implements all 5 intelligence endpoints with caching, rate limiting, and error handling.
 * Adheres to INTERFACE_CONTRACTS.ts PerplexityIntelligenceResponse specification.
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

import {
  PerplexityIntelligenceResponse,
  MarketContextData,
  NewsFlashData,
  ExpertAnalysisData,
  DailyBriefData,
  HistoricalTrendsData,
  IPerplexityClient,
  ErrorCode,
} from '@/INTERFACE_CONTRACTS'

// ============================================================================
// TYPES
// ============================================================================

interface PerplexityAPIResponse {
  id: string
  model: string
  choices: Array<{
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  citations?: Array<{
    url: string
    title?: string
    snippet?: string
  }>
}

interface CacheEntry<T> {
  data: T
  timestamp: string
  expiresAt: string
}

// ============================================================================
// IN-MEMORY CACHE (1-hour TTL)
// ============================================================================

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

  set<T>(key: string, data: T, ttlMs: number = this.DEFAULT_TTL): void {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttlMs)

    this.cache.set(key, {
      data,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = new Date()
    const expiresAt = new Date(entry.expiresAt)

    if (now > expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  clear(): void {
    this.cache.clear()
  }

  // Cleanup expired entries (call periodically)
  cleanup(): void {
    const now = new Date()
    for (const [key, entry] of this.cache.entries()) {
      if (now > new Date(entry.expiresAt)) {
        this.cache.delete(key)
      }
    }
  }
}

// ============================================================================
// RATE LIMITER
// ============================================================================

class RateLimiter {
  private requests: number[] = []
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 50, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // Remove old requests
    this.requests = this.requests.filter(time => time > windowStart)

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0]
      const waitTime = this.windowMs - (now - oldestRequest)

      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return this.waitForSlot() // Retry after waiting
      }
    }

    this.requests.push(now)
  }
}

// ============================================================================
// PERPLEXITY CLIENT
// ============================================================================

export class PerplexityClient implements IPerplexityClient {
  private readonly apiKey: string
  private readonly baseUrl = 'https://api.perplexity.ai'
  private readonly cache = new InMemoryCache()
  private readonly rateLimiter = new RateLimiter(50, 60000) // 50 requests per minute

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY || ''

    if (!this.apiKey) {
      throw new Error('PERPLEXITY_API_KEY is required')
    }

    // Cleanup expired cache entries every 5 minutes
    setInterval(() => this.cache.cleanup(), 5 * 60 * 1000)
  }

  // ==========================================================================
  // PUBLIC API: Market Context
  // ==========================================================================

  async getMarketContext(marketId: string): Promise<PerplexityIntelligenceResponse> {
    const cacheKey = `market_context:${marketId}`
    const cached = this.cache.get<PerplexityIntelligenceResponse>(cacheKey)

    if (cached) {
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
        }
      }
    }

    const query = this.buildMarketContextQuery(marketId)
    const response = await this.query(query, 'sonar-pro')

    const data = this.parseMarketContextResponse(response.content)

    const result: PerplexityIntelligenceResponse = {
      marketId,
      endpoint: 'context',
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        sources: response.citations?.length || 0,
        confidence: this.calculateConfidence(response),
        freshness: 'realtime',
        cached: false,
      }
    }

    // Cache for 1 hour
    this.cache.set(cacheKey, result, 60 * 60 * 1000)

    return result
  }

  // ==========================================================================
  // PUBLIC API: News Flash
  // ==========================================================================

  async getNewsFlash(marketId: string): Promise<PerplexityIntelligenceResponse> {
    const cacheKey = `news_flash:${marketId}`
    const cached = this.cache.get<PerplexityIntelligenceResponse>(cacheKey)

    if (cached) {
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
        }
      }
    }

    const query = this.buildNewsFlashQuery(marketId)
    const response = await this.query(query, 'sonar') // Fast model for news

    const data = this.parseNewsFlashResponse(response.content)

    const result: PerplexityIntelligenceResponse = {
      marketId,
      endpoint: 'news',
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        sources: response.citations?.length || 0,
        confidence: this.calculateConfidence(response),
        freshness: 'realtime',
        cached: false,
      }
    }

    // Cache for 15 minutes (news changes fast)
    this.cache.set(cacheKey, result, 15 * 60 * 1000)

    return result
  }

  // ==========================================================================
  // PUBLIC API: Expert Analysis
  // ==========================================================================

  async getExpertAnalysis(marketId: string): Promise<PerplexityIntelligenceResponse> {
    const cacheKey = `expert_analysis:${marketId}`
    const cached = this.cache.get<PerplexityIntelligenceResponse>(cacheKey)

    if (cached) {
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
        }
      }
    }

    const query = this.buildExpertAnalysisQuery(marketId)
    const response = await this.query(query, 'sonar-reasoning-pro') // Reasoning model

    const data = this.parseExpertAnalysisResponse(response.content)

    const result: PerplexityIntelligenceResponse = {
      marketId,
      endpoint: 'experts',
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        sources: response.citations?.length || 0,
        confidence: this.calculateConfidence(response),
        freshness: 'recent',
        cached: false,
      }
    }

    // Cache for 6 hours
    this.cache.set(cacheKey, result, 6 * 60 * 60 * 1000)

    return result
  }

  // ==========================================================================
  // PUBLIC API: Daily Brief
  // ==========================================================================

  async getDailyBrief(marketId: string): Promise<PerplexityIntelligenceResponse> {
    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `daily_brief:${marketId}:${today}`
    const cached = this.cache.get<PerplexityIntelligenceResponse>(cacheKey)

    if (cached) {
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
        }
      }
    }

    const query = this.buildDailyBriefQuery(marketId)
    const response = await this.query(query, 'sonar-reasoning-pro') // Complex analysis

    const data = this.parseDailyBriefResponse(response.content)

    const result: PerplexityIntelligenceResponse = {
      marketId,
      endpoint: 'brief',
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        sources: response.citations?.length || 0,
        confidence: this.calculateConfidence(response),
        freshness: 'recent',
        cached: false,
      }
    }

    // Cache for 24 hours (one per day)
    this.cache.set(cacheKey, result, 24 * 60 * 60 * 1000)

    return result
  }

  // ==========================================================================
  // PUBLIC API: Historical Trends
  // ==========================================================================

  async getHistoricalTrends(marketId: string): Promise<PerplexityIntelligenceResponse> {
    const cacheKey = `historical_trends:${marketId}`
    const cached = this.cache.get<PerplexityIntelligenceResponse>(cacheKey)

    if (cached) {
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cached: true,
        }
      }
    }

    const query = this.buildHistoricalTrendsQuery(marketId)
    const response = await this.query(query, 'sonar-reasoning-pro')

    const data = this.parseHistoricalTrendsResponse(response.content)

    const result: PerplexityIntelligenceResponse = {
      marketId,
      endpoint: 'trends',
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        sources: response.citations?.length || 0,
        confidence: this.calculateConfidence(response),
        freshness: 'historical',
        cached: false,
      }
    }

    // Cache for 7 days (historical data doesn't change)
    this.cache.set(cacheKey, result, 7 * 24 * 60 * 60 * 1000)

    return result
  }

  // ==========================================================================
  // PRIVATE: Core Query Method
  // ==========================================================================

  private async query(
    prompt: string,
    model: 'sonar' | 'sonar-pro' | 'sonar-reasoning-pro' = 'sonar-pro'
  ): Promise<{ content: string; citations?: any[] }> {
    await this.rateLimiter.waitForSlot()

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a financial intelligence analyst. Provide factual, well-sourced analysis with proper citations. Format responses as structured JSON when possible.'
            },
            {
              role: 'user',
              content: prompt,
            }
          ],
          max_tokens: model === 'sonar' ? 500 : 2000,
          temperature: 0.7,
          return_citations: true,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Perplexity API error (${response.status}): ${errorText}`)
      }

      const data: PerplexityAPIResponse = await response.json()

      return {
        content: data.choices[0].message.content,
        citations: data.citations || [],
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`${ErrorCode.PERPLEXITY_ERROR}: ${error.message}`)
      }
      throw error
    }
  }

  // ==========================================================================
  // PRIVATE: Query Builders
  // ==========================================================================

  private buildMarketContextQuery(marketId: string): string {
    return `
Provide comprehensive market context for prediction market ID: ${marketId}.

Include:
1. Background information (2-3 paragraphs)
2. Key recent events (last 30 days) with dates, descriptions, and impact levels (high/medium/low)
3. Expert opinions from credible sources with quotes and affiliations

Format as JSON with this structure:
{
  "background": "string",
  "keyEvents": [{"date": "ISO8601", "event": "string", "impact": "high|medium|low"}],
  "expertOpinions": [{"expert": "string", "affiliation": "string", "quote": "string", "sourceUrl": "string"}]
}
`.trim()
  }

  private buildNewsFlashQuery(marketId: string): string {
    return `
Find the latest breaking news (last 24 hours) relevant to prediction market ID: ${marketId}.

Include:
1. Title, summary, published date, source, and sentiment (bullish/bearish/neutral)
2. Prioritize authoritative sources (Reuters, Bloomberg, WSJ, etc.)

Format as JSON:
{
  "breaking": [{"title": "string", "summary": "string", "publishedAt": "ISO8601", "source": "string", "sourceUrl": "string", "sentiment": "bullish|bearish|neutral"}],
  "lastUpdated": "ISO8601"
}
`.trim()
  }

  private buildExpertAnalysisQuery(marketId: string): string {
    return `
Analyze expert predictions and consensus for prediction market ID: ${marketId}.

Include:
1. Overall consensus (bullish/bearish/neutral/divided)
2. Consensus strength (0-1, where 1 = unanimous)
3. Individual expert predictions with rationale and confidence levels

Format as JSON:
{
  "consensus": "bullish|bearish|neutral|divided",
  "consensusStrength": 0.85,
  "predictions": [{"expert": "string", "prediction": "string", "rationale": "string", "confidence": 0.8, "sourceUrl": "string"}]
}
`.trim()
  }

  private buildDailyBriefQuery(marketId: string): string {
    return `
Generate an executive daily brief for prediction market ID: ${marketId}.

Include:
1. One-paragraph summary (100-150 words)
2. 3-5 key insights (bullet points)
3. Market mood assessment (optimistic/pessimistic/uncertain)
4. Risk level (low/medium/high)
5. Recommendation (1-2 sentences)

Format as JSON:
{
  "summary": "string",
  "keyInsights": ["string", "string", "string"],
  "marketMood": "optimistic|pessimistic|uncertain",
  "riskLevel": "low|medium|high",
  "recommendation": "string"
}
`.trim()
  }

  private buildHistoricalTrendsQuery(marketId: string): string {
    return `
Analyze historical trends and similar markets for prediction market ID: ${marketId}.

Include:
1. Similar past markets with outcomes and resolution dates
2. Similarity scores (0-1)
3. Lessons learned from each
4. Recurring patterns with success rates

Format as JSON:
{
  "similarMarkets": [{"question": "string", "resolvedDate": "ISO8601", "outcome": "string", "similarity": 0.9, "lessons": "string"}],
  "patterns": [{"pattern": "string", "occurrences": 5, "successRate": 0.75}]
}
`.trim()
  }

  // ==========================================================================
  // PRIVATE: Response Parsers
  // ==========================================================================

  private parseMarketContextResponse(content: string): MarketContextData {
    try {
      const parsed = JSON.parse(content)
      return {
        type: 'context',
        background: parsed.background || 'No background information available.',
        keyEvents: parsed.keyEvents || [],
        expertOpinions: parsed.expertOpinions || [],
      }
    } catch {
      // Fallback: parse as plain text
      return {
        type: 'context',
        background: content,
        keyEvents: [],
        expertOpinions: [],
      }
    }
  }

  private parseNewsFlashResponse(content: string): NewsFlashData {
    try {
      const parsed = JSON.parse(content)
      return {
        type: 'news',
        breaking: parsed.breaking || [],
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      }
    } catch {
      return {
        type: 'news',
        breaking: [],
        lastUpdated: new Date().toISOString(),
      }
    }
  }

  private parseExpertAnalysisResponse(content: string): ExpertAnalysisData {
    try {
      const parsed = JSON.parse(content)
      return {
        type: 'experts',
        consensus: parsed.consensus || 'neutral',
        consensusStrength: parsed.consensusStrength || 0.5,
        predictions: parsed.predictions || [],
      }
    } catch {
      return {
        type: 'experts',
        consensus: 'neutral',
        consensusStrength: 0.5,
        predictions: [],
      }
    }
  }

  private parseDailyBriefResponse(content: string): DailyBriefData {
    try {
      const parsed = JSON.parse(content)
      return {
        type: 'brief',
        summary: parsed.summary || 'No summary available.',
        keyInsights: parsed.keyInsights || [],
        marketMood: parsed.marketMood || 'uncertain',
        riskLevel: parsed.riskLevel || 'medium',
        recommendation: parsed.recommendation || 'Monitor closely.',
      }
    } catch {
      return {
        type: 'brief',
        summary: content,
        keyInsights: [],
        marketMood: 'uncertain',
        riskLevel: 'medium',
        recommendation: 'Monitor closely.',
      }
    }
  }

  private parseHistoricalTrendsResponse(content: string): HistoricalTrendsData {
    try {
      const parsed = JSON.parse(content)
      return {
        type: 'trends',
        similarMarkets: parsed.similarMarkets || [],
        patterns: parsed.patterns || [],
      }
    } catch {
      return {
        type: 'trends',
        similarMarkets: [],
        patterns: [],
      }
    }
  }

  // ==========================================================================
  // PRIVATE: Utilities
  // ==========================================================================

  private calculateConfidence(response: { content: string; citations?: any[] }): number {
    const citationCount = response.citations?.length || 0
    const hasStructuredData = response.content.includes('{') && response.content.includes('}')

    // Base confidence on citation count and structure
    let confidence = 0.5

    if (citationCount > 10) confidence += 0.3
    else if (citationCount > 5) confidence += 0.2
    else if (citationCount > 0) confidence += 0.1

    if (hasStructuredData) confidence += 0.2

    return Math.min(confidence, 1.0)
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let perplexityClient: PerplexityClient | null = null

export function getPerplexityClient(): PerplexityClient {
  if (!perplexityClient) {
    perplexityClient = new PerplexityClient()
  }
  return perplexityClient
}
