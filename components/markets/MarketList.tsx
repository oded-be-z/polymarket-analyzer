'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import MarketCard from './MarketCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Market } from '@/lib/types'
import { useFilters } from '@/lib/context/FilterContext'
import { getMarkets } from '@/lib/api-client'

export default function MarketList() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allMarkets, setAllMarkets] = useState<Market[]>([])
  const [error, setError] = useState<string | null>(null)
  const {
    activeFilter,
    category,
    volumeRange,
    sentimentFilter,
    sortBy,
    searchQuery,
  } = useFilters()

  // Fetch markets from API
  useEffect(() => {
    async function fetchMarkets() {
      try {
        setLoading(true)
        setError(null)
        const markets = await getMarkets({ active: true })
        setAllMarkets(markets)
      } catch (err) {
        console.error('Failed to fetch markets:', err)
        setError(err instanceof Error ? err.message : 'Failed to load markets')
      } finally {
        setLoading(false)
      }
    }

    fetchMarkets()
  }, [])

  const handleMarketClick = (market: Market) => {
    router.push(`/market/${market.id}`)
  }

  // Filter and sort markets based on context
  const markets = useMemo(() => {
    let filtered = [...allMarkets]

    // Filter by active/closed status
    if (activeFilter === 'active') {
      filtered = filtered.filter((m) => m.active)
    } else if (activeFilter === 'closed') {
      filtered = filtered.filter((m) => !m.active)
    }

    // Filter by category
    if (category !== 'all') {
      filtered = filtered.filter(
        (m) => m.category.toLowerCase() === category.toLowerCase()
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((m) =>
        m.question.toLowerCase().includes(query)
      )
    }

    // Filter by volume range (0-100 maps to $0-$10M)
    const minVolume = (volumeRange[0] / 100) * 10000000
    const maxVolume = (volumeRange[1] / 100) * 10000000
    filtered = filtered.filter(
      (m) => m.volume24h >= minVolume && m.volume24h <= maxVolume
    )

    // Filter by sentiment
    if (sentimentFilter.length > 0) {
      filtered = filtered.filter((m) => {
        if (!m.sentiment) return false
        const score = m.sentiment.score
        return sentimentFilter.some((filter) => {
          if (filter === 'bullish') return score > 0.2
          if (filter === 'bearish') return score < -0.2
          if (filter === 'neutral') return score >= -0.2 && score <= 0.2
          return false
        })
      })
    }

    // Sort markets
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.volume24h - a.volume24h
        case 'sentiment':
          return (b.sentiment?.score || 0) - (a.sentiment?.score || 0)
        case 'liquidity':
          return b.liquidity - a.liquidity
        case 'ending':
          return a.endDate.getTime() - b.endDate.getTime()
        case 'recent':
          return b.id.localeCompare(a.id) // Mock: use ID as proxy for recency
        default:
          return 0
      }
    })

    return filtered
  }, [allMarkets, activeFilter, category, volumeRange, sentimentFilter, sortBy, searchQuery])

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">Failed to load markets</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (markets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 text-gray-600 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold text-white mb-2">No markets found</h3>
          <p className="text-gray-400">
            Try adjusting your filters or check back later for new markets.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} onClick={handleMarketClick} />
      ))}
    </div>
  )
}
