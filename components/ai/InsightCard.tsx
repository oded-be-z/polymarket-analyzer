import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'

export interface InsightCardProps {
  type: 'positive' | 'negative' | 'warning' | 'info'
  title: string
  description: string
  source: string
  timestamp: Date
}

export default function InsightCard({
  type,
  title,
  description,
  source,
  timestamp,
}: InsightCardProps) {
  const getIcon = () => {
    switch (type) {
      case 'positive':
        return <CheckCircleIcon className="h-6 w-6 text-bullish-400" />
      case 'negative':
        return <ExclamationTriangleIcon className="h-6 w-6 text-bearish-400" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-primary-400" />
    }
  }

  const getVariant = () => {
    switch (type) {
      case 'positive':
        return 'success'
      case 'negative':
        return 'danger'
      case 'warning':
        return 'warning'
      case 'info':
        return 'info'
    }
  }

  return (
    <Card hover className="p-4">
      <div className="flex gap-3">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-white">{title}</h4>
            <Badge variant={getVariant()} size="sm">
              {type}
            </Badge>
          </div>
          <p className="text-sm text-gray-300 mb-3">{description}</p>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <LightBulbIcon className="h-3 w-3" />
              {source}
            </span>
            <span>•</span>
            <span>
              {timestamp.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
