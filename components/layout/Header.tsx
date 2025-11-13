'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import Button from '@/components/ui/Button'
import { useFilters } from '@/lib/context/FilterContext'

export default function Header() {
  const router = useRouter()
  const [isDark, setIsDark] = useState(true)
  const { searchQuery, setSearchQuery } = useFilters()

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const handleMarketsClick = () => {
    router.push('/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePortfolioClick = () => {
    alert('Portfolio feature coming soon!')
  }

  const handleAlertsClick = () => {
    alert('Alerts feature coming soon!')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Polymarket Analyzer</h1>
            <p className="text-xs text-gray-400">AI-Powered Sentiment Analysis</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-8">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search markets..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-4">
          <nav className="hidden lg:flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleMarketsClick}>
              Markets
            </Button>
            <Button variant="ghost" size="sm" onClick={handlePortfolioClick}>
              Portfolio
            </Button>
            <Button variant="ghost" size="sm" onClick={handleAlertsClick}>
              Alerts
            </Button>
          </nav>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <SunIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <MoonIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
