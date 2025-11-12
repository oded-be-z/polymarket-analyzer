import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import SentimentIndicator from '@/components/sentiment/SentimentIndicator'
import Tooltip from '@/components/ui/Tooltip'
import { formatCurrency, formatPercentage, truncateText } from '@/lib/utils'
import { Market } from '@/lib/types'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

export interface MarketCardProps {
  market: Market
  onClick?: (market: Market) => void
}

export default function MarketCard({ market, onClick }: MarketCardProps) {
  const yesChange = market.yesPrice - 0.5 // Simplified - should compare to previous price
  const isYesUp = yesChange > 0

  return (
    <Card
      hover
      clickable
      onClick={() => onClick?.(market)}
      className="p-5 cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <Tooltip content={market.question}>
            <h3 className="text-base font-semibold text-white mb-2 line-clamp-2">
              {truncateText(market.question, 100)}
            </h3>
          </Tooltip>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge size="sm">{market.category}</Badge>
            {market.active ? (
              <Badge variant="success" size="sm">
                Active
              </Badge>
            ) : (
              <Badge variant="default" size="sm">
                Closed
              </Badge>
            )}
            {market.sentiment && (
              <SentimentIndicator
                score={market.sentiment.score}
                confidence={market.sentiment.confidence}
                size="sm"
                showLabel={false}
              />
            )}
          </div>
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-bullish-500/10 border border-bullish-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-bullish-400">YES</span>
            {isYesUp ? (
              <ArrowTrendingUpIcon className="h-3 w-3 text-bullish-400" />
            ) : (
              <ArrowTrendingDownIcon className="h-3 w-3 text-bearish-400" />
            )}
          </div>
          <div className="text-xl font-bold text-bullish-400">
            {formatPercentage(market.yesPrice, 0)}
          </div>
          <div className="text-xs text-gray-400">
            {formatCurrency(market.yesPrice, 2)} per share
          </div>
        </div>

        <div className="p-3 rounded-lg bg-bearish-500/10 border border-bearish-500/30">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-bearish-400">NO</span>
            {!isYesUp ? (
              <ArrowTrendingUpIcon className="h-3 w-3 text-bullish-400" />
            ) : (
              <ArrowTrendingDownIcon className="h-3 w-3 text-bearish-400" />
            )}
          </div>
          <div className="text-xl font-bold text-bearish-400">
            {formatPercentage(market.noPrice, 0)}
          </div>
          <div className="text-xs text-gray-400">
            {formatCurrency(market.noPrice, 2)} per share
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-gray-400">24h Volume: </span>
          <span className="text-white font-medium">
            {formatCurrency(market.volume24h)}
          </span>
        </div>
        <div>
          <span className="text-gray-400">Liquidity: </span>
          <span className="text-white font-medium">
            {formatCurrency(market.liquidity)}
          </span>
        </div>
      </div>

      {/* End Date */}
      {market.active && (
        <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
          Ends {market.endDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>
      )}
    </Card>
  )
}
