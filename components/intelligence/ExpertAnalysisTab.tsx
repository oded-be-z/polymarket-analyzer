/**
 * Expert Analysis Tab Component
 *
 * Displays expert predictions, consensus, and sentiment breakdown.
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

'use client'

import { useIntelligence } from './useIntelligence'
import { ExpertAnalysisData } from '@/INTERFACE_CONTRACTS'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorDisplay } from './ErrorDisplay'
import { FreshnessIndicator } from './FreshnessIndicator'

interface ExpertAnalysisTabProps {
  marketId: string
}

export function ExpertAnalysisTab({ marketId }: ExpertAnalysisTabProps) {
  const { data, isLoading, error, refetch } = useIntelligence(marketId, 'experts')

  if (isLoading) return <LoadingSpinner message="Analyzing expert predictions..." />
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />
  if (!data) return null

  const expertData = data.data as ExpertAnalysisData

  return (
    <div className="space-y-6">
      <FreshnessIndicator
        timestamp={data.timestamp}
        freshness={data.metadata.freshness}
        cached={data.metadata.cached}
        sources={data.metadata.sources}
      />

      {/* Consensus Summary */}
      <section className="p-6 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Expert Consensus
          </h3>
          <span
            className={`px-4 py-2 rounded-full text-sm font-bold ${
              expertData.consensus === 'bullish'
                ? 'bg-green-500 text-white'
                : expertData.consensus === 'bearish'
                ? 'bg-red-500 text-white'
                : expertData.consensus === 'divided'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-500 text-white'
            }`}
          >
            {expertData.consensus.toUpperCase()}
          </span>
        </div>

        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 dark:text-gray-300">Consensus Strength</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {Math.round(expertData.consensusStrength * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-emerald-500 to-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${expertData.consensusStrength * 100}%` }}
            />
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {expertData.consensusStrength > 0.8
            ? 'Strong agreement among experts'
            : expertData.consensusStrength > 0.6
            ? 'Moderate consensus'
            : 'Experts are divided on this outcome'}
        </p>
      </section>

      {/* Individual Expert Predictions */}
      {expertData.predictions.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Expert Predictions ({expertData.predictions.length})
          </h3>
          <div className="space-y-4">
            {expertData.predictions.map((prediction, idx) => (
              <div
                key={idx}
                className="p-5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {prediction.expert}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Confidence:
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {Math.round(prediction.confidence * 100)}%
                    </span>
                  </div>
                </div>

                <p className="text-gray-900 dark:text-white font-medium mb-2">
                  {prediction.prediction}
                </p>

                <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                  {prediction.rationale}
                </p>

                {prediction.sourceUrl && (
                  <a
                    href={prediction.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    View Source →
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
