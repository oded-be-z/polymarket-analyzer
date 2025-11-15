'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Market, SentimentData, Prediction } from '@/lib/types'
import { getMarketById, getSentiment, getPrediction } from '@/lib/api-client'
import { formatNumber, formatPercent, getSentimentLabel, getSentimentColor } from '@/lib/utils'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { IntelligencePanel } from '@/components/intelligence'
import { SubscriptionTier, FEATURE_GATES } from '@/INTERFACE_CONTRACTS'
import UpgradePrompt from '@/components/subscription/UpgradePrompt'
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'

/**
 * Enhanced Market Detail Page - Agent E Integration
 *
 * Features:
 * - Sentimark design tokens throughout
 * - IntelligencePanel integration (Agent B)
 * - PDF Report generation with subscription gates (Agent D)
 * - Stripe subscription checks (Agent C)
 */

interface MarketDetailEnhancedProps {
  userTier?: SubscriptionTier
  userId?: string
}

export default function MarketDetailEnhanced({
  userTier = SubscriptionTier.FREE,
  userId = 'demo-user'
}: MarketDetailEnhancedProps) {
  const params = useParams()
  const router = useRouter()
  const marketId = params.id as string

  const [market, setMarket] = useState<Market | null>(null)
  const [sentiment, setSentiment] = useState<SentimentData | null>(null)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // PDF generation state
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  // Check feature access
  const canAccessIntelligence = FEATURE_GATES[userTier].features.perplexityIntelligence
  const canAccessPDFReports = FEATURE_GATES[userTier].features.pdfReports

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch market details
        const marketData = await getMarketById(marketId)
        setMarket(marketData)

        // Fetch sentiment and prediction in parallel
        const [sentimentData, predictionData] = await Promise.allSettled([
          getSentiment(marketId),
          getPrediction(marketId),
        ])

        if (sentimentData.status === 'fulfilled') {
          setSentiment(sentimentData.value)
        }
        if (predictionData.status === 'fulfilled') {
          setPrediction(predictionData.value)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load market details')
      } finally {
        setIsLoading(false)
      }
    }

    if (marketId) {
      fetchData()
    }
  }, [marketId])

  const handleGeneratePDF = async () => {
    if (!canAccessPDFReports) {
      setShowUpgradePrompt(true)
      return
    }

    try {
      setIsGeneratingPDF(true)
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId,
          userId,
          includePerplexity: canAccessIntelligence
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const data = await response.json()
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank')
      }
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !market) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage
          message={error || 'Market not found'}
          retry={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="mb-6 flex items-center text-sm text-text-secondary hover:text-primary transition-colors"
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" />
        Back to Markets
      </button>

      {/* Market Header with Sentimark styling */}
      <div className="mb-8 rounded-lg border border-bg-elevated bg-bg-surface p-6 shadow-md">
        <div className="mb-4 flex items-start justify-between">
          <h1 className="text-3xl font-bold text-text-primary">{market.question}</h1>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                market.active
                  ? 'bg-success/20 text-success border border-success/30'
                  : 'bg-text-disabled/20 text-text-tertiary border border-text-disabled/30'
              }`}
            >
              {market.active ? 'Active' : 'Closed'}
            </span>

            {/* Generate Report Button */}
            <button
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                canAccessPDFReports
                  ? 'bg-gradient-primary text-white hover:opacity-90 shadow-glow'
                  : 'bg-bg-elevated text-text-tertiary border border-text-disabled/30 hover:border-primary/50'
              }`}
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              {isGeneratingPDF ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {market.description && (
          <p className="mb-4 text-text-secondary">{market.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <div className="text-sm text-text-tertiary">Total Volume</div>
            <div className="text-xl font-bold text-text-primary">
              {formatNumber(market.volume || 0)}
            </div>
          </div>
          {market.liquidity && (
            <div>
              <div className="text-sm text-text-tertiary">Liquidity</div>
              <div className="text-xl font-bold text-text-primary">
                {formatNumber(market.liquidity)}
              </div>
            </div>
          )}
          {market.volume24h && (
            <div>
              <div className="text-sm text-text-tertiary">24h Volume</div>
              <div className="text-xl font-bold text-text-primary">
                {formatNumber(market.volume24h)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sentiment Analysis - Sentimark styled */}
        {sentiment && (
          <div className="rounded-lg border border-bg-elevated bg-bg-surface p-6 shadow-md">
            <h2 className="mb-4 text-xl font-bold text-text-primary">Sentiment Analysis</h2>
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-text-secondary">Consensus Sentiment</span>
                <span className={`text-lg font-bold ${getSentimentColor(sentiment.consensus_sentiment)}`}>
                  {getSentimentLabel(sentiment.consensus_sentiment)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-bg-primary">
                <div
                  className="h-full bg-gradient-primary"
                  style={{ width: `${sentiment.consensus_sentiment * 100}%` }}
                />
              </div>
            </div>
            <div className="mb-4">
              <div className="text-sm text-text-tertiary">Confidence</div>
              <div className="text-lg font-bold text-text-primary">
                {formatPercent(sentiment.consensus_confidence)}
              </div>
            </div>
            {sentiment.sources && sentiment.sources.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-semibold text-text-primary">Sources</div>
                <div className="space-y-2">
                  {sentiment.sources.map((source, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">{source.source}</span>
                      <span className={getSentimentColor(source.score)}>
                        {formatPercent(source.score)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Prediction - Sentimark styled */}
        {prediction && (
          <div className="rounded-lg border border-bg-elevated bg-bg-surface p-6 shadow-md">
            <h2 className="mb-4 text-xl font-bold text-text-primary">AI Prediction</h2>
            <div className="mb-4">
              <div className="text-sm text-text-tertiary">Predicted Winner</div>
              <div className="text-lg font-bold text-primary">
                {prediction.predicted_winner}
              </div>
            </div>
            <div className="mb-4">
              <div className="text-sm text-text-tertiary">Confidence</div>
              <div className="text-lg font-bold text-text-primary">
                {formatPercent(prediction.confidence)}
              </div>
            </div>
            {prediction.reasoning && (
              <div>
                <div className="mb-2 text-sm font-semibold text-text-primary">Reasoning</div>
                <p className="text-sm text-text-secondary">{prediction.reasoning}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Intelligence Panel - Agent B Integration */}
      {canAccessIntelligence ? (
        <div className="mt-6">
          <IntelligencePanel marketId={marketId} marketQuestion={market.question} />
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-bg-elevated bg-bg-surface p-8 text-center shadow-md">
          <div className="mx-auto w-16 h-16 mb-4 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">Unlock Real-Time Intelligence</h3>
          <p className="text-text-secondary mb-4">
            Get access to Perplexity-powered market insights, breaking news, expert analysis, and historical trends.
          </p>
          <button
            onClick={() => setShowUpgradePrompt(true)}
            className="px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-glow"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      {/* Tokens */}
      {market.tokens && market.tokens.length > 0 && (
        <div className="mt-6 rounded-lg border border-bg-elevated bg-bg-surface p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-text-primary">Market Outcomes</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {market.tokens.map((token) => (
              <div
                key={token.token_id}
                className="rounded border border-bg-elevated bg-bg-primary p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-text-primary">{token.outcome}</span>
                  {token.winner && (
                    <span className="rounded bg-success/20 px-2 py-1 text-xs font-medium text-success border border-success/30">
                      Winner
                    </span>
                  )}
                </div>
                <div className="text-2xl font-bold text-primary">
                  {formatPercent(token.price, 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt
          feature={canAccessPDFReports ? "Perplexity Intelligence" : "PDF Reports"}
          currentTier={userTier}
          requiredTier={SubscriptionTier.PRO}
          onClose={() => setShowUpgradePrompt(false)}
        />
      )}
    </div>
  )
}
