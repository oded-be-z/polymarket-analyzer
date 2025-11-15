'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, UserCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { SubscriptionTier } from '@/INTERFACE_CONTRACTS'

/**
 * Sentimark Navbar - Agent E Integration
 *
 * Features:
 * - Sentimark branding (emerald → blue gradient logo)
 * - Subscription status badge
 * - User menu with tier display
 * - Pricing page link
 * - Design tokens applied throughout
 */

interface NavbarProps {
  userTier?: SubscriptionTier
  userName?: string
}

export default function Navbar({
  userTier = SubscriptionTier.FREE,
  userName = 'Guest'
}: NavbarProps) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.ENTERPRISE:
        return 'text-gradient-primary'
      case SubscriptionTier.PRO:
        return 'text-primary'
      case SubscriptionTier.FREE:
      default:
        return 'text-text-tertiary'
    }
  }

  const getTierBadge = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.ENTERPRISE:
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gradient-primary text-white">
            ENTERPRISE
          </span>
        )
      case SubscriptionTier.PRO:
        return (
          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary/20 text-primary border border-primary/30">
            PRO
          </span>
        )
      case SubscriptionTier.FREE:
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-bg-elevated text-text-tertiary border border-text-disabled/30">
            FREE
          </span>
        )
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-bg-elevated bg-bg-primary/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo - Sentimark Branding */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => router.push('/')}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-primary shadow-glow">
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
            <h1 className="text-xl font-bold text-gradient-primary">Sentimark</h1>
            <p className="text-xs text-text-tertiary">Prediction Market Intelligence</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => router.push('/')}
            className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
          >
            Markets
          </button>
          <button
            onClick={() => router.push('/pricing')}
            className="text-sm font-medium text-text-secondary hover:text-primary transition-colors"
          >
            Pricing
          </button>
        </nav>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-elevated transition-colors"
          >
            <div className="flex items-center gap-2">
              <UserCircleIcon className="w-6 h-6 text-text-secondary" />
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-text-primary">{userName}</div>
                <div className="text-xs text-text-tertiary">{getTierBadge(userTier)}</div>
              </div>
            </div>
            <ChevronDownIcon className="w-4 h-4 text-text-tertiary" />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg bg-bg-elevated border border-bg-surface shadow-xl z-50">
              <div className="p-4 border-b border-bg-surface">
                <div className="text-sm font-medium text-text-primary mb-1">{userName}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-tertiary">Current Plan:</span>
                  {getTierBadge(userTier)}
                </div>
              </div>

              <div className="p-2">
                {userTier !== SubscriptionTier.ENTERPRISE && (
                  <button
                    onClick={() => router.push('/pricing')}
                    className="w-full px-3 py-2 text-sm font-medium rounded-md bg-gradient-primary text-white hover:opacity-90 transition-opacity mb-1"
                  >
                    {userTier === SubscriptionTier.FREE ? 'Upgrade to Pro' : 'Upgrade to Enterprise'}
                  </button>
                )}

                <button
                  onClick={() => alert('Account settings coming soon!')}
                  className="w-full px-3 py-2 text-sm text-left text-text-secondary hover:bg-bg-surface rounded-md transition-colors"
                >
                  Account Settings
                </button>

                {userTier !== SubscriptionTier.FREE && (
                  <button
                    onClick={() => alert('Manage subscription via Stripe')}
                    className="w-full px-3 py-2 text-sm text-left text-text-secondary hover:bg-bg-surface rounded-md transition-colors"
                  >
                    Manage Subscription
                  </button>
                )}

                <hr className="my-2 border-bg-surface" />

                <button
                  onClick={() => alert('Sign out')}
                  className="w-full px-3 py-2 text-sm text-left text-danger hover:bg-danger/10 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
