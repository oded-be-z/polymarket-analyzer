import Badge from '@/components/ui/Badge'
import Tooltip from '@/components/ui/Tooltip'
import { getSentimentLabel } from '@/lib/utils'

export interface SentimentIndicatorProps {
  score: number
  confidence?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function SentimentIndicator({
  score,
  confidence,
  size = 'md',
  showLabel = true,
}: SentimentIndicatorProps) {
  const getVariant = (score: number) => {
    if (score > 0.2) return 'bullish'
    if (score < -0.2) return 'bearish'
    return 'default'
  }

  const label = getSentimentLabel(score)

  const tooltipContent = (
    <div className="text-left">
      <p className="font-medium">{label}</p>
      <p className="text-sm text-gray-300">Score: {score.toFixed(2)}</p>
      {confidence && (
        <p className="text-sm text-gray-300">
          Confidence: {(confidence * 100).toFixed(0)}%
        </p>
      )}
    </div>
  )

  return (
    <Tooltip content={tooltipContent}>
      <Badge variant={getVariant(score)} size={size}>
        {showLabel && label}
        {!showLabel && (
          <div className="flex items-center gap-1">
            <span className="text-xs">●</span>
            <span>{score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%</span>
          </div>
        )}
      </Badge>
    </Tooltip>
  )
}
