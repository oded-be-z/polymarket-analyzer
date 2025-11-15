/**
 * Error Display Component
 *
 * Displays error state with retry option.
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

interface ErrorDisplayProps {
  error: string
  onRetry: () => void
}

export function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        Failed to Load Intelligence
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}
