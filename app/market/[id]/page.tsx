'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Market, SentimentData, Prediction } from '@/lib/types';
import { getMarketById, getSentiment, getPrediction } from '@/lib/api-client';
import { formatNumber, formatPercent, getSentimentLabel, getSentimentColor } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

export default function MarketDetailPage() {
  const params = useParams();
  const marketId = params.id as string;

  const [market, setMarket] = useState<Market | null>(null);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch market details
        const marketData = await getMarketById(marketId);
        setMarket(marketData);

        // Fetch sentiment and prediction in parallel
        const [sentimentData, predictionData] = await Promise.allSettled([
          getSentiment(marketId),
          getPrediction(marketId),
        ]);

        if (sentimentData.status === 'fulfilled') {
          setSentiment(sentimentData.value);
        }
        if (predictionData.status === 'fulfilled') {
          setPrediction(predictionData.value);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load market details');
      } finally {
        setIsLoading(false);
      }
    }

    if (marketId) {
      fetchData();
    }
  }, [marketId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message={error || 'Market not found'}
          retry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="mb-6 flex items-center text-sm text-neutral-light hover:text-white"
      >
        <svg
          className="mr-2 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Markets
      </button>

      {/* Market Header */}
      <div className="mb-8 rounded-lg border border-surface-light bg-surface p-6">
        <div className="mb-4 flex items-start justify-between">
          <h1 className="text-3xl font-bold text-white">{market.question}</h1>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              market.active
                ? 'bg-success/20 text-success'
                : 'bg-neutral/20 text-neutral'
            }`}
          >
            {market.active ? 'Active' : 'Closed'}
          </span>
        </div>

        {market.description && (
          <p className="mb-4 text-neutral-light">{market.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <div className="text-sm text-neutral-light">Total Volume</div>
            <div className="text-xl font-bold text-white">
              {formatNumber(market.volume || 0)}
            </div>
          </div>
          {market.liquidity && (
            <div>
              <div className="text-sm text-neutral-light">Liquidity</div>
              <div className="text-xl font-bold text-white">
                {formatNumber(market.liquidity)}
              </div>
            </div>
          )}
          {market.volume24h && (
            <div>
              <div className="text-sm text-neutral-light">24h Volume</div>
              <div className="text-xl font-bold text-white">
                {formatNumber(market.volume24h)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sentiment Analysis */}
        {sentiment && (
          <div className="rounded-lg border border-surface-light bg-surface p-6">
            <h2 className="mb-4 text-xl font-bold text-white">Sentiment Analysis</h2>
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-neutral-light">Consensus Sentiment</span>
                <span className={`text-lg font-bold ${getSentimentColor(sentiment.consensus_sentiment)}`}>
                  {getSentimentLabel(sentiment.consensus_sentiment)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-background">
                <div
                  className="h-full bg-gradient-to-r from-danger via-neutral to-success"
                  style={{ width: `${sentiment.consensus_sentiment * 100}%` }}
                />
              </div>
            </div>
            <div className="mb-4">
              <div className="text-sm text-neutral-light">Confidence</div>
              <div className="text-lg font-bold text-white">
                {formatPercent(sentiment.consensus_confidence)}
              </div>
            </div>
            {sentiment.sources && sentiment.sources.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-semibold text-white">Sources</div>
                <div className="space-y-2">
                  {sentiment.sources.map((source, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-neutral-light">{source.source}</span>
                      <span className={getSentimentColor(source.score)}>
                        {formatPercent(source.score)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Prediction */}
        {prediction && (
          <div className="rounded-lg border border-surface-light bg-surface p-6">
            <h2 className="mb-4 text-xl font-bold text-white">AI Prediction</h2>
            <div className="mb-4">
              <div className="text-sm text-neutral-light">Predicted Winner</div>
              <div className="text-lg font-bold text-primary">
                {prediction.predicted_winner}
              </div>
            </div>
            <div className="mb-4">
              <div className="text-sm text-neutral-light">Confidence</div>
              <div className="text-lg font-bold text-white">
                {formatPercent(prediction.confidence)}
              </div>
            </div>
            {prediction.reasoning && (
              <div>
                <div className="mb-2 text-sm font-semibold text-white">Reasoning</div>
                <p className="text-sm text-neutral-light">{prediction.reasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tokens */}
      {market.tokens && market.tokens.length > 0 && (
        <div className="mt-6 rounded-lg border border-surface-light bg-surface p-6">
          <h2 className="mb-4 text-xl font-bold text-white">Market Outcomes</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {market.tokens.map((token) => (
              <div
                key={token.token_id}
                className="rounded border border-surface-light bg-background p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-white">{token.outcome}</span>
                  {token.winner && (
                    <span className="rounded bg-success/20 px-2 py-1 text-xs font-medium text-success">
                      Winner
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatPercent(token.price, 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
