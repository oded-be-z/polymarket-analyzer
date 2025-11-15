/**
 * Historical Trends Tab Component
 *
 * Displays similar past markets, patterns, and lessons learned.
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

'use client'

import { useIntelligence } from './useIntelligence'
import { HistoricalTrendsData } from '@/INTERFACE_CONTRACTS'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorDisplay } from './ErrorDisplay'
import { FreshnessIndicator } from './FreshnessIndicator'

interface HistoricalTrendsTabProps {
  marketId: string
}

export function HistoricalTrendsTab({ marketId }: HistoricalTrendsTabProps) {
  const { data, isLoading, error, refetch } = useIntelligence(marketId, 'trends')

  if (isLoading) return <LoadingSpinner message="Analyzing historical trends..." />
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />
  if (!data) return null

  const trendsData = data.data as HistoricalTrendsData

  return (
    <div className="space-y-6">
      <FreshnessIndicator
        timestamp={data.timestamp}
        freshness={data.metadata.freshness}
        cached={data.metadata.cached}
        sources={data.metadata.sources}
      />

      {/* Similar Markets */}
      {trendsData.similarMarkets.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Similar Past Markets
          </h3>
          <div className="space-y-4">
            {trendsData.similarMarkets.map((market, idx) => (
              <div
                key={idx}
                className="p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-base font-medium text-gray-900 dark:text-white flex-1">
                    {market.question}
                  </h4>
                  <span className="ml-3 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-full text-xs font-semibold whitespace-nowrap">
                    {Math.round(market.similarity * 100)}% match
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <span>
                    Resolved:{' '}
                    {new Date(market.resolvedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Outcome: {market.outcome}
                  </span>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-500">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">Lesson:</span> {market.lessons}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Patterns */}
      {trendsData.patterns.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recurring Patterns
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {trendsData.patterns.map((pattern, idx) => (
              <div
                key={idx}
                className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
              >
                <p className="text-gray-900 dark:text-white font-medium mb-3">
                  {pattern.pattern}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Occurrences:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {pattern.occurrences}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                    <span
                      className={`font-semibold ${
                        pattern.successRate > 0.7
                          ? 'text-green-600 dark:text-green-400'
                          : pattern.successRate > 0.4
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {Math.round(pattern.successRate * 100)}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      style={{ width: `${pattern.successRate * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {trendsData.similarMarkets.length === 0 && trendsData.patterns.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p className="text-4xl mb-3">📊</p>
          <p>No historical data available yet</p>
        </div>
      )}
    </div>
  )
}
