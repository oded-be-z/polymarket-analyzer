/**
 * Market Context Tab Component
 *
 * Displays background information, key events, and expert opinions.
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

'use client'

import { useIntelligence } from './useIntelligence'
import { MarketContextData } from '@/INTERFACE_CONTRACTS'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorDisplay } from './ErrorDisplay'
import { FreshnessIndicator } from './FreshnessIndicator'

interface MarketContextTabProps {
  marketId: string
}

export function MarketContextTab({ marketId }: MarketContextTabProps) {
  const { data, isLoading, error, refetch } = useIntelligence(marketId, 'context')

  if (isLoading) return <LoadingSpinner message="Researching market context..." />
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />
  if (!data) return null

  const contextData = data.data as MarketContextData

  return (
    <div className="space-y-6">
      {/* Freshness Indicator */}
      <FreshnessIndicator
        timestamp={data.timestamp}
        freshness={data.metadata.freshness}
        cached={data.metadata.cached}
        sources={data.metadata.sources}
      />

      {/* Background */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Background
        </h3>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {contextData.background}
          </p>
        </div>
      </section>

      {/* Key Events */}
      {contextData.keyEvents.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Key Events
          </h3>
          <div className="space-y-3">
            {contextData.keyEvents.map((event, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      event.impact === 'high'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : event.impact === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {event.impact.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-gray-900 dark:text-white">{event.event}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Expert Opinions */}
      {contextData.expertOpinions.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Expert Opinions
          </h3>
          <div className="space-y-4">
            {contextData.expertOpinions.map((opinion, idx) => (
              <div
                key={idx}
                className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border-l-4 border-emerald-500"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {opinion.expert}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {opinion.affiliation}
                    </p>
                  </div>
                </div>
                <blockquote className="text-gray-700 dark:text-gray-300 italic mt-2">
                  &ldquo;{opinion.quote}&rdquo;
                </blockquote>
                {opinion.sourceUrl && (
                  <a
                    href={opinion.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-2 inline-block"
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
