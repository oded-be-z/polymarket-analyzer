'use client'

import { FunnelIcon } from '@heroicons/react/24/outline'
import Select from '@/components/ui/Select'
import Badge from '@/components/ui/Badge'
import { useFilters } from '@/lib/context/FilterContext'

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'politics', label: 'Politics' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'sports', label: 'Sports' },
  { value: 'economics', label: 'Economics' },
  { value: 'science', label: 'Science & Tech' },
]

const sortOptions = [
  { value: 'volume', label: 'Highest Volume' },
  { value: 'sentiment', label: 'Best Sentiment' },
  { value: 'liquidity', label: 'Most Liquid' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'ending', label: 'Ending Soon' },
]

export default function Sidebar() {
  const {
    activeFilter,
    setActiveFilter,
    volumeRange,
    setVolumeRange,
    category,
    setCategory,
    sortBy,
    setSortBy,
    sentimentFilter,
    setSentimentFilter,
    resetFilters,
  } = useFilters()

  const toggleSentiment = (sentiment: string) => {
    setSentimentFilter(
      sentimentFilter.includes(sentiment)
        ? sentimentFilter.filter((s) => s !== sentiment)
        : [...sentimentFilter, sentiment]
    )
  }

  return (
    <aside className="hidden lg:block w-80 border-r border-gray-800 bg-gray-900/50">
      <div className="p-6 space-y-6">
        {/* Filters Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-white">Filters</h2>
          </div>
          <button
            onClick={resetFilters}
            className="text-sm text-primary-500 hover:text-primary-400"
          >
            Reset
          </button>
        </div>

        {/* Market Status */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Market Status
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'active'
                  ? 'bg-bullish-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter('closed')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'closed'
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Closed
            </button>
          </div>
        </div>

        {/* Category */}
        <div>
          <Select
            label="Category"
            options={categoryOptions}
            value={category}
            onChange={setCategory}
          />
        </div>

        {/* Volume Range */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Volume Range
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              value={volumeRange[1]}
              onChange={(e) => setVolumeRange([0, parseInt(e.target.value)])}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>$0</span>
              <span>$10M+</span>
            </div>
          </div>
        </div>

        {/* Sentiment Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Sentiment
          </label>
          <div className="flex flex-wrap gap-2">
            {['bullish', 'neutral', 'bearish'].map((sentiment) => (
              <button
                key={sentiment}
                onClick={() => toggleSentiment(sentiment)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  sentimentFilter.includes(sentiment)
                    ? sentiment === 'bullish'
                      ? 'bg-bullish-500/20 text-bullish-400 border border-bullish-500/50'
                      : sentiment === 'bearish'
                      ? 'bg-bearish-500/20 text-bearish-400 border border-bearish-500/50'
                      : 'bg-gray-600/20 text-gray-400 border border-gray-500/50'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div>
          <Select
            label="Sort By"
            options={sortOptions}
            value={sortBy}
            onChange={setSortBy}
          />
        </div>

        {/* Active Filters Summary */}
        {(sentimentFilter.length > 0 || category !== 'all') && (
          <div className="pt-4 border-t border-gray-800">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Active Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {category !== 'all' && (
                <Badge variant="info">
                  {categoryOptions.find((c) => c.value === category)?.label}
                </Badge>
              )}
              {sentimentFilter.map((sentiment) => (
                <Badge
                  key={sentiment}
                  variant={
                    sentiment === 'bullish'
                      ? 'bullish'
                      : sentiment === 'bearish'
                      ? 'bearish'
                      : 'default'
                  }
                >
                  {sentiment}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
