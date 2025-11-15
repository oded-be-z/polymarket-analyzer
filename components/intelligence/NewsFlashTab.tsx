/**
 * News Flash Tab Component
 *
 * Displays breaking news and latest developments (last 24 hours).
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

'use client'

import { useIntelligence } from './useIntelligence'
import { NewsFlashData } from '@/INTERFACE_CONTRACTS'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorDisplay } from './ErrorDisplay'
import { FreshnessIndicator } from './FreshnessIndicator'

interface NewsFlashTabProps {
  marketId: string
}

export function NewsFlashTab({ marketId }: NewsFlashTabProps) {
  const { data, isLoading, error, refetch } = useIntelligence(marketId, 'news')

  if (isLoading) return <LoadingSpinner message="Fetching latest news..." />
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />
  if (!data) return null

  const newsData = data.data as NewsFlashData

  return (
    <div className="space-y-6">
      <FreshnessIndicator
        timestamp={data.timestamp}
        freshness={data.metadata.freshness}
        cached={data.metadata.cached}
        sources={data.metadata.sources}
      />

      {newsData.breaking.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-4xl mb-3">📰</p>
          <p>No breaking news in the last 24 hours</p>
        </div>
      ) : (
        <div className="space-y-4">
          {newsData.breaking.map((news, idx) => (
            <article
              key={idx}
              className="p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                  {news.title}
                </h4>
                <span
                  className={`ml-3 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    news.sentiment === 'bullish'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : news.sentiment === 'bearish'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {news.sentiment === 'bullish' ? '📈' : news.sentiment === 'bearish' ? '📉' : '➡️'}{' '}
                  {news.sentiment}
                </span>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-3">{news.summary}</p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                  <span className="font-medium">{news.source}</span>
                  <span>•</span>
                  <span>
                    {new Date(news.publishedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {news.sourceUrl && (
                  <a
                    href={news.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Read More →
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
