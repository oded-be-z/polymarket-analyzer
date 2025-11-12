import { Market, SentimentData, Prediction, ApiResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://polymarket-analyzer.azurewebsites.net';

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
  if (params?.active !== undefined) queryParams.append('active', String(params.active));
  if (params?.limit) queryParams.append('limit', String(params.limit));
  if (params?.offset) queryParams.append('offset', String(params.offset));

  const query = queryParams.toString();
  const endpoint = `/api/markets${query ? `?${query}` : ''}`;

  return fetchApi<Market[]>(endpoint);
}

export async function getMarketById(marketId: string): Promise<Market> {
  return fetchApi<Market>(`/api/markets/${marketId}`);
}

// Sentiment API Functions
export async function getSentiment(marketId: string): Promise<SentimentData> {
  return fetchApi<SentimentData>(`/api/sentiment/${marketId}`);
}

export async function getBatchSentiment(marketIds: string[]): Promise<Record<string, SentimentData>> {
  return fetchApi<Record<string, SentimentData>>('/api/sentiment/batch', {
    method: 'POST',
    body: JSON.stringify({ market_ids: marketIds }),
  });
}

// Prediction API Functions
export async function getPrediction(marketId: string): Promise<Prediction> {
  return fetchApi<Prediction>(`/api/predictions/${marketId}`);
}

export async function getBatchPredictions(marketIds: string[]): Promise<Record<string, Prediction>> {
  return fetchApi<Record<string, Prediction>>('/api/predictions/batch', {
    method: 'POST',
    body: JSON.stringify({ market_ids: marketIds }),
  });
}

// Health Check
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return fetchApi<{ status: string; timestamp: string }>('/api/health');
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
