'use client'

import { useState } from 'react'
import MarketCard from './MarketCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { Market } from '@/lib/types'

// Mock data for demonstration
const MOCK_MARKETS: Market[] = [
  {
    id: '1',
    question: 'Will Bitcoin reach $100,000 by end of 2025?',
    category: 'Crypto',
    yesPrice: 0.62,
    noPrice: 0.38,
    volume24h: 1250000,
    liquidity: 450000,
    endDate: new Date('2025-12-31'),
    active: true,
    sentiment: {
      score: 0.45,
      confidence: 0.78,
    },
  },
  {
    id: '2',
    question: 'Will the Democrats win the 2024 Presidential Election?',
    category: 'Politics',
    yesPrice: 0.48,
    noPrice: 0.52,
    volume24h: 3400000,
    liquidity: 1200000,
    endDate: new Date('2024-11-05'),
    active: true,
    sentiment: {
      score: -0.12,
      confidence: 0.65,
    },
  },
  {
    id: '3',
    question: 'Will Ethereum have a successful Shanghai upgrade?',
    category: 'Crypto',
    yesPrice: 0.85,
    noPrice: 0.15,
    volume24h: 890000,
    liquidity: 320000,
    endDate: new Date('2024-04-30'),
    active: false,
    sentiment: {
      score: 0.72,
      confidence: 0.88,
    },
  },
  {
    id: '4',
    question: 'Will the Fed raise interest rates in Q1 2025?',
    category: 'Economics',
    yesPrice: 0.35,
    noPrice: 0.65,
    volume24h: 670000,
    liquidity: 280000,
    endDate: new Date('2025-03-31'),
    active: true,
    sentiment: {
      score: -0.38,
      confidence: 0.71,
    },
  },
]

export default function MarketList() {
  const [markets] = useState<Market[]>(MOCK_MARKETS)
  const [loading] = useState(false)

  const handleMarketClick = (market: Market) => {
    console.log('Market clicked:', market.id)
    // In real app: navigate to market detail page
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} />
        ))}
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
