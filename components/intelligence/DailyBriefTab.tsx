/**
 * Daily Brief Tab Component
 *
 * Displays executive summary, key insights, market mood, and recommendations.
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

'use client'

import { useIntelligence } from './useIntelligence'
import { DailyBriefData } from '@/INTERFACE_CONTRACTS'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorDisplay } from './ErrorDisplay'
import { FreshnessIndicator } from './FreshnessIndicator'

interface DailyBriefTabProps {
  marketId: string
}

export function DailyBriefTab({ marketId }: DailyBriefTabProps) {
  const { data, isLoading, error, refetch } = useIntelligence(marketId, 'brief')

  if (isLoading) return <LoadingSpinner message="Generating daily brief..." />
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />
  if (!data) return null

  const briefData = data.data as DailyBriefData

  return (
    <div className="space-y-6">
      <FreshnessIndicator
        timestamp={data.timestamp}
        freshness={data.metadata.freshness}
        cached={data.metadata.cached}
        sources={data.metadata.sources}
      />

      {/* Summary */}
      <section className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>📋</span>
          Executive Summary
        </h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {briefData.summary}
        </p>
      </section>

      {/* Market Mood & Risk Level */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Market Mood</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {briefData.marketMood === 'optimistic' ? '😊' : briefData.marketMood === 'pessimistic' ? '😟' : '😐'}
            </span>
            <span className="text-xl font-bold capitalize text-gray-900 dark:text-white">
              {briefData.marketMood}
            </span>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Risk Level</p>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-bold ${
                briefData.riskLevel === 'high'
                  ? 'bg-red-500 text-white'
                  : briefData.riskLevel === 'medium'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-green-500 text-white'
              }`}
            >
              {briefData.riskLevel.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Key Insights */}
      {briefData.keyInsights.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Key Insights
          </h3>
          <ul className="space-y-2">
            {briefData.keyInsights.map((insight, idx) => (
              <li
                key={idx}
                className="flex gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-emerald-500 text-white rounded-full text-sm font-bold">
                  {idx + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300">{insight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recommendation */}
      <section className="p-6 bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>💡</span>
          Recommendation
        </h3>
        <p className="text-gray-700 dark:text-gray-300">{briefData.recommendation}</p>
      </section>
    </div>
  )
}
