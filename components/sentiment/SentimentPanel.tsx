import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { getSentimentLabel, getSentimentColor } from '@/lib/utils'
import {
  NewspaperIcon,
  CpuChipIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

export interface SentimentSource {
  name: string
  score: number
  weight: number
  icon?: 'perplexity' | 'gpt' | 'gemini'
}

export interface SentimentPanelProps {
  overallScore: number
  confidence: number
  sources: SentimentSource[]
}

export default function SentimentPanel({
  overallScore,
  confidence,
  sources,
}: SentimentPanelProps) {
  const sentimentLabel = getSentimentLabel(overallScore)
  const sentimentColor = getSentimentColor(overallScore)

  const getIcon = (iconName?: string) => {
    switch (iconName) {
      case 'perplexity':
        return <NewspaperIcon className="h-5 w-5" />
      case 'gpt':
        return <CpuChipIcon className="h-5 w-5" />
      case 'gemini':
        return <SparklesIcon className="h-5 w-5" />
      default:
        return <CpuChipIcon className="h-5 w-5" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Sentiment Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overall Score */}
        <div className="text-center mb-6">
          <div className={`text-6xl font-bold mb-2 ${sentimentColor}`}>
            {overallScore > 0 ? '+' : ''}
            {(overallScore * 100).toFixed(0)}
          </div>
          <div className="flex items-center justify-center gap-2">
            <Badge
              variant={
                overallScore > 0.2
                  ? 'bullish'
                  : overallScore < -0.2
                  ? 'bearish'
                  : 'default'
              }
            >
              {sentimentLabel}
            </Badge>
            <span className="text-sm text-gray-400">
              {(confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Confidence Level</span>
            <span className="text-white font-medium">
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all"
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>

        {/* Source Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Source Breakdown
          </h4>
          <div className="space-y-3">
            {sources.map((source, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="text-gray-400">{getIcon(source.icon)}</div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {source.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      Weight: {(source.weight * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-lg font-semibold ${getSentimentColor(
                      source.score
                    )}`}
                  >
                    {source.score > 0 ? '+' : ''}
                    {(source.score * 100).toFixed(0)}
                  </span>
                  <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        source.score > 0 ? 'bg-bullish-500' : 'bg-bearish-500'
                      }`}
                      style={{
                        width: `${Math.abs(source.score) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
