'use client'

import { useState } from 'react'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ShieldCheckIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline'

export interface AIAnalysisProps {
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'WATCH'
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  keyInsights: string[]
  reasoning: string
  confidence: number
}

export default function AIAnalysis({
  recommendation,
  riskLevel,
  keyInsights,
  reasoning,
  confidence,
}: AIAnalysisProps) {
  const [expanded, setExpanded] = useState(false)

  const getRecommendationColor = () => {
    switch (recommendation) {
      case 'BUY':
        return 'bullish'
      case 'SELL':
        return 'bearish'
      case 'HOLD':
        return 'info'
      case 'WATCH':
        return 'warning'
    }
  }

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'LOW':
        return 'success'
      case 'MEDIUM':
        return 'warning'
      case 'HIGH':
        return 'danger'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CpuChipIcon className="h-5 w-5 text-primary-400" />
          <CardTitle>AI Trading Analysis</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Recommendation & Risk */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Recommendation</div>
            <Badge variant={getRecommendationColor()} size="lg">
              {recommendation}
            </Badge>
            <div className="text-xs text-gray-400 mt-2">
              {(confidence * 100).toFixed(0)}% confidence
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
            <div className="text-sm text-gray-400 mb-2">Risk Assessment</div>
            <Badge variant={getRiskColor()} size="lg">
              {riskLevel}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
              <ShieldCheckIcon className="h-3 w-3" />
              Risk analyzed
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Key Insights</h4>
          <ul className="space-y-2">
            {keyInsights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-primary-500 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Expandable Reasoning */}
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full p-3 rounded-lg bg-gray-800/50 border border-gray-700 hover:bg-gray-800 transition-colors"
          >
            <span className="text-sm font-medium text-white">
              GPT-5-Pro Detailed Reasoning
            </span>
            {expanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expanded && (
            <div className="mt-3 p-4 rounded-lg bg-gray-800/30 border border-gray-700">
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {reasoning}
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-xs text-yellow-400">
            <strong>Disclaimer:</strong> This analysis is AI-generated and should not be
            considered financial advice. Always do your own research before making trading
            decisions.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
