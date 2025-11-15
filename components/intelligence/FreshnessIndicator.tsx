/**
 * Freshness Indicator Component
 *
 * Displays metadata about intelligence freshness, cache status, and sources.
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

interface FreshnessIndicatorProps {
  timestamp: string
  freshness: 'realtime' | 'recent' | 'historical'
  cached: boolean
  sources: number
}

export function FreshnessIndicator({
  timestamp,
  freshness,
  cached,
  sources,
}: FreshnessIndicatorProps) {
  const freshnessConfig = {
    realtime: { color: 'green', icon: '🟢', label: 'Real-time' },
    recent: { color: 'yellow', icon: '🟡', label: 'Recent' },
    historical: { color: 'gray', icon: '⚪', label: 'Historical' },
  }

  const config = freshnessConfig[freshness]

  const timeAgo = getTimeAgo(timestamp)

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span>{config.icon}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {config.label}
          </span>
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span>📚</span>
          <span>
            {sources} {sources === 1 ? 'source' : 'sources'}
          </span>
        </div>

        {cached && (
          <>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>💾</span>
              <span>Cached</span>
            </div>
          </>
        )}
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        Updated {timeAgo}
      </div>
    </div>
  )
}

function getTimeAgo(timestamp: string): string {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now.getTime() - then.getTime()

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
