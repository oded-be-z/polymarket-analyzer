'use client'

import { useState } from 'react'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import PriceChart from '@/components/charts/PriceChart'
import VolumeChart from '@/components/charts/VolumeChart'
import SentimentChart from '@/components/charts/SentimentChart'
import SentimentPanel from '@/components/sentiment/SentimentPanel'
import AIAnalysis from '@/components/ai/AIAnalysis'
import InsightCard from '@/components/ai/InsightCard'
import { Market, PriceHistory, VolumeHistory } from '@/lib/types'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export interface MarketDetailProps {
  market: Market
  priceHistory: PriceHistory[]
  volumeHistory: VolumeHistory[]
  onBack?: () => void
}

export default function MarketDetail({
  market,
  priceHistory,
  volumeHistory,
  onBack,
}: MarketDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'insights'>('overview')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Badge>{market.category}</Badge>
            {market.active ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="default">Closed</Badge>
            )}
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">{market.question}</h1>

          {market.description && (
            <p className="text-gray-400 text-lg">{market.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800">
        {(['overview', 'analysis', 'insights'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-primary-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Prices */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-400 mb-2">YES Price</div>
                    <div className="text-4xl font-bold text-bullish-400 mb-1">
                      {formatPercentage(market.yesPrice, 1)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatCurrency(market.yesPrice, 2)} per share
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-2">NO Price</div>
                    <div className="text-4xl font-bold text-bearish-400 mb-1">
                      {formatPercentage(market.noPrice, 1)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {formatCurrency(market.noPrice, 2)} per share
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Chart */}
            <PriceChart data={priceHistory} />

            {/* Volume Chart */}
            <VolumeChart data={volumeHistory} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Market Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Market Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">24h Volume</div>
                    <div className="text-xl font-semibold text-white">
                      {formatCurrency(market.volume24h)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Liquidity</div>
                    <div className="text-xl font-semibold text-white">
                      {formatCurrency(market.liquidity)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 mb-1">End Date</div>
                    <div className="text-base text-white">
                      {market.endDate.toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sentiment */}
            {market.sentiment && (
              <SentimentChart
                score={market.sentiment.score}
                confidence={market.sentiment.confidence}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIAnalysis
            recommendation="BUY"
            riskLevel="MEDIUM"
            keyInsights={[
              'Strong bullish sentiment across multiple AI sources',
              'High trading volume indicates strong market conviction',
              'Recent news articles support positive outcome',
              'Technical indicators show upward momentum',
            ]}
            reasoning="Based on comprehensive analysis of market data, news sentiment, and technical indicators, this market shows strong potential for YES outcome. The convergence of multiple positive signals, including high trading volume and bullish sentiment from news sources, suggests market participants are increasingly confident in a positive resolution."
            confidence={0.78}
          />

          {market.sentiment && (
            <SentimentPanel
              overallScore={market.sentiment.score}
              confidence={market.sentiment.confidence}
              sources={[
                { name: 'Perplexity News', score: 0.52, weight: 0.4, icon: 'perplexity' },
                { name: 'GPT-5-Pro', score: 0.45, weight: 0.35, icon: 'gpt' },
                { name: 'Gemini Analysis', score: 0.38, weight: 0.25, icon: 'gemini' },
              ]}
            />
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <InsightCard
            type="positive"
            title="Strong Market Momentum"
            description="Trading volume has increased by 45% in the last 24 hours, indicating strong market interest and conviction."
            source="Perplexity"
            timestamp={new Date()}
          />
          <InsightCard
            type="info"
            title="Technical Analysis Update"
            description="Price has broken above the 7-day moving average, suggesting potential for continued upward movement."
            source="GPT-5-Pro"
            timestamp={new Date()}
          />
          <InsightCard
            type="warning"
            title="Volatility Alert"
            description="Market showing increased price volatility. Consider position sizing carefully."
            source="Risk Engine"
            timestamp={new Date()}
          />
          <InsightCard
            type="negative"
            title="Liquidity Concern"
            description="Liquidity has decreased by 12% over the past week, which could impact execution."
            source="Market Data"
            timestamp={new Date()}
          />
        </div>
      )}
    </div>
  )
}
