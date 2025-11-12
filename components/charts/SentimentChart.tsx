'use client'

import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { getSentimentLabel, getSentimentColor } from '@/lib/utils'

export interface SentimentChartProps {
  score: number
  confidence: number
  title?: string
}

export default function SentimentChart({
  score,
  confidence,
  title = 'Sentiment Score',
}: SentimentChartProps) {
  // Convert score (-1 to 1) to gauge angle (0 to 180 degrees)
  const scoreAngle = ((score + 1) / 2) * 180

  const sentimentLabel = getSentimentLabel(score)
  const sentimentColor = getSentimentColor(score)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* Gauge Chart */}
          <div className="relative w-48 h-24 mb-4">
            <svg viewBox="0 0 200 100" className="w-full h-full">
              {/* Background Arc */}
              <path
                d="M 20 80 A 80 80 0 0 1 180 80"
                fill="none"
                stroke="#374151"
                strokeWidth="20"
                strokeLinecap="round"
              />

              {/* Bearish Section (Red) */}
              <path
                d="M 20 80 A 80 80 0 0 1 100 0"
                fill="none"
                stroke="#ef4444"
                strokeWidth="20"
                strokeLinecap="round"
                opacity="0.3"
              />

              {/* Bullish Section (Green) */}
              <path
                d="M 100 0 A 80 80 0 0 1 180 80"
                fill="none"
                stroke="#22c55e"
                strokeWidth="20"
                strokeLinecap="round"
                opacity="0.3"
              />

              {/* Score Indicator */}
              <circle
                cx="100"
                cy="80"
                r="4"
                fill="white"
                transform={`rotate(${scoreAngle - 90} 100 80)`}
                style={{
                  transformOrigin: '100px 80px',
                }}
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="-90 100 80"
                  to={`${scoreAngle - 90} 100 80`}
                  dur="1s"
                  fill="freeze"
                />
              </circle>

              {/* Needle */}
              <line
                x1="100"
                y1="80"
                x2="100"
                y2="20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                transform={`rotate(${scoreAngle - 90} 100 80)`}
                style={{
                  transformOrigin: '100px 80px',
                }}
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="-90 100 80"
                  to={`${scoreAngle - 90} 100 80`}
                  dur="1s"
                  fill="freeze"
                />
              </line>

              {/* Center Dot */}
              <circle cx="100" cy="80" r="6" fill="#1f2937" />
              <circle cx="100" cy="80" r="3" fill="white" />
            </svg>

            {/* Labels */}
            <div className="absolute bottom-0 left-0 text-xs text-bearish-400 font-medium">
              Bearish
            </div>
            <div className="absolute bottom-0 right-0 text-xs text-bullish-400 font-medium">
              Bullish
            </div>
          </div>

          {/* Score Display */}
          <div className="text-center">
            <div className={`text-4xl font-bold mb-1 ${sentimentColor}`}>
              {score > 0 ? '+' : ''}
              {(score * 100).toFixed(0)}
            </div>
            <div className="text-sm text-gray-400 mb-2">{sentimentLabel}</div>

            {/* Confidence Bar */}
            <div className="w-48">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Confidence</span>
                <span>{(confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-1000"
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
