import { Market, SentimentData, Prediction, ApiResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://polymarket-analyzer.azurewebsites.net';

// Backend market structure from Polymarket API
interface BackendMarket {
  token_id: string;
  question: string;
  description: string;
  end_date: string | null;
  outcome_prices: Record<string, number>;
  volume: number;
  active: boolean;
}

// Transform backend market data to frontend format
function transformMarket(backendMarket: BackendMarket): Market {
  // Extract yes/no prices from outcome_prices
  const prices = Object.values(backendMarket.outcome_prices);
  const yesPrice = prices[0] || 0.5;
  const noPrice = prices[1] || (1 - yesPrice);

  return {
    id: backendMarket.token_id,
    question: backendMarket.question,
    description: backendMarket.description || '',
    category: 'General', // Default category
    yesPrice: yesPrice,
    noPrice: noPrice,
    volume: backendMarket.volume || 0,
    volume24h: backendMarket.volume || 0, // Use total volume as 24h approximation
    liquidity: backendMarket.volume * 0.1, // Estimate liquidity as 10% of volume
    endDate: backendMarket.end_date ? new Date(backendMarket.end_date) : new Date(),
    active: backendMarket.active,
  };
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        `API request failed: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Market API Functions
export async function getMarkets(params?: {
  active?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Market[]> {
  const queryParams = new URLSearchParams();
  if (params?.active !== undefined) queryParams.append('active_only', String(params.active));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.offset) queryParams.append('offset', String(params.offset));

  const query = queryParams.toString();
  const endpoint = `/markets${query ? `?${query}` : ''}`;

  // Backend returns {markets: [], count: number, cached: boolean, timestamp: string}
  const response = await fetchApi<{markets: BackendMarket[], count: number, cached: boolean, timestamp: string}>(endpoint);
  return response.markets.map(transformMarket);
}

export async function getMarketById(marketId: string): Promise<Market> {
  return fetchApi<Market>(`/markets/${marketId}`);
}

// Sentiment API Functions
export async function getSentiment(marketId: string): Promise<SentimentData> {
  return fetchApi<SentimentData>(`/sentiment/${marketId}`);
}

export async function getBatchSentiment(marketIds: string[]): Promise<Record<string, SentimentData>> {
  return fetchApi<Record<string, SentimentData>>('/sentiment/batch', {
    method: 'POST',
    body: JSON.stringify({ market_ids: marketIds }),
  });
}

// Prediction API Functions
export async function getPrediction(marketId: string): Promise<Prediction> {
  return fetchApi<Prediction>(`/predictions/${marketId}`);
}

export async function getBatchPredictions(marketIds: string[]): Promise<Record<string, Prediction>> {
  return fetchApi<Record<string, Prediction>>('/predictions/batch', {
    method: 'POST',
    body: JSON.stringify({ market_ids: marketIds }),
  });
}

// Health Check
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return fetchApi<{ status: string; timestamp: string }>('/health');
}

// Cache utilities
export function getCacheKey(endpoint: string, params?: any): string {
  return `${endpoint}-${JSON.stringify(params || {})}`;
}

export const CACHE_DURATION = {
  MARKETS: 60 * 1000, // 1 minute
  SENTIMENT: 5 * 60 * 1000, // 5 minutes
  PREDICTION: 10 * 60 * 1000, // 10 minutes
};
