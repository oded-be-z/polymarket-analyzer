/**
 * UsageMeter Component - Agent E
 *
 * Displays usage limits for Pro tier (PDF reports, API calls)
 * Shows upgrade prompt when approaching limits
 */

interface UsageMeterProps {
  label: string
  current: number
  limit: number
  limitLabel?: string
  showUpgradePrompt?: boolean
  onUpgrade?: () => void
}

export default function UsageMeter({
  label,
  current,
  limit,
  limitLabel = 'this month',
  showUpgradePrompt = true,
  onUpgrade
}: UsageMeterProps) {
  const percentage = limit === Infinity ? 0 : Math.min((current / limit) * 100, 100)
  const isNearLimit = percentage >= 80
  const isAtLimit = current >= limit

  // Color logic
  const getBarColor = () => {
    if (limit === Infinity) return 'bg-gradient-primary'
    if (isAtLimit) return 'bg-danger'
    if (isNearLimit) return 'bg-warning'
    return 'bg-primary'
  }

  const getLimitText = () => {
    if (limit === Infinity) return 'Unlimited'
    return `${current} / ${limit}`
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-sm text-text-secondary">
          {getLimitText()} {limitLabel}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-2 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-300 ${getBarColor()}`}
          style={{ width: limit === Infinity ? '100%' : `${percentage}%` }}
        />
      </div>

      {/* Warning/Upgrade Prompt */}
      {showUpgradePrompt && isNearLimit && !isAtLimit && limit !== Infinity && (
        <div className="flex items-center justify-between p-2 bg-warning/10 border border-warning/30 rounded-md">
          <span className="text-xs text-warning">
            {isAtLimit ? 'Limit reached' : 'Approaching limit'}
          </span>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Upgrade
            </button>
          )}
        </div>
      )}

      {isAtLimit && limit !== Infinity && (
        <div className="flex items-center justify-between p-2 bg-danger/10 border border-danger/30 rounded-md">
          <span className="text-xs text-danger">Monthly limit reached</span>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Upgrade for more
            </button>
          )}
        </div>
      )}
    </div>
  )
}
