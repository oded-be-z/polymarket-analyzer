/**
 * Intelligence Panel Component
 *
 * Main container for displaying Perplexity intelligence across all 5 endpoints.
 * Implements tabbed interface with lazy loading.
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

'use client'

import { useState } from 'react'
import { PerplexityIntelligenceResponse } from '@/INTERFACE_CONTRACTS'
import { MarketContextTab } from './MarketContextTab'
import { NewsFlashTab } from './NewsFlashTab'
import { ExpertAnalysisTab } from './ExpertAnalysisTab'
import { DailyBriefTab } from './DailyBriefTab'
import { HistoricalTrendsTab } from './HistoricalTrendsTab'

type TabType = 'context' | 'news' | 'experts' | 'brief' | 'trends'

interface IntelligencePanelProps {
  marketId: string
  marketQuestion: string
}

export function IntelligencePanel({ marketId, marketQuestion }: IntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('context')

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'context', label: 'Market Context', icon: '📊' },
    { id: 'news', label: 'News Flash', icon: '⚡' },
    { id: 'experts', label: 'Expert Analysis', icon: '🎯' },
    { id: 'brief', label: 'Daily Brief', icon: '📋' },
    { id: 'trends', label: 'Historical Trends', icon: '📈' },
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          AI Intelligence
        </h2>
        <p className="text-sm text-emerald-50 mt-1">{marketQuestion}</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'context' && <MarketContextTab marketId={marketId} />}
        {activeTab === 'news' && <NewsFlashTab marketId={marketId} />}
        {activeTab === 'experts' && <ExpertAnalysisTab marketId={marketId} />}
        {activeTab === 'brief' && <DailyBriefTab marketId={marketId} />}
        {activeTab === 'trends' && <HistoricalTrendsTab marketId={marketId} />}
      </div>
    </div>
  )
}
