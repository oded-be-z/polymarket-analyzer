/**
 * Loading Spinner Component
 *
 * Displays loading state for intelligence endpoints.
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

interface LoadingSpinnerProps {
  message?: string
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-16 h-16">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="w-16 h-16 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-500 dark:border-t-emerald-400 rounded-full animate-spin" />
        </div>
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">{message}</p>
    </div>
  )
}
