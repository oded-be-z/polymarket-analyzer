import { useRouter } from 'next/navigation'
import { SubscriptionTier } from '@/INTERFACE_CONTRACTS'
import { XMarkIcon } from '@heroicons/react/24/outline'

/**
 * UpgradePrompt Component - Agent E
 *
 * Modal that appears when Free users try to access premium features
 * Shows feature comparison and directs to pricing page
 */

interface UpgradePromptProps {
  feature: string
  currentTier: SubscriptionTier
  requiredTier: SubscriptionTier
  onClose: () => void
}

export default function UpgradePrompt({
  feature,
  currentTier,
  requiredTier,
  onClose
}: UpgradePromptProps) {
  const router = useRouter()

  const getTierName = (tier: SubscriptionTier) => {
    switch (tier) {
      case SubscriptionTier.ENTERPRISE:
        return 'Enterprise'
      case SubscriptionTier.PRO:
        return 'Pro'
      default:
        return 'Free'
    }
  }

  const handleUpgrade = () => {
    router.push('/pricing')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-overlay">
      <div className="relative w-full max-w-md bg-bg-surface border border-bg-elevated rounded-xl shadow-2xl p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-text-tertiary hover:text-text-primary transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="w-12 h-12 mb-3 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Upgrade to {getTierName(requiredTier)}
          </h2>
          <p className="text-sm text-text-secondary">
            {feature} is a premium feature available on {getTierName(requiredTier)} plan and above.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="mb-6 p-4 bg-bg-elevated rounded-lg border border-primary/20">
          <h3 className="text-sm font-semibold text-primary mb-2">
            What you&apos;ll get with {getTierName(requiredTier)}:
          </h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            {requiredTier === SubscriptionTier.PRO && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Perplexity Intelligence (real-time market insights)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>10 PDF Reports per month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Advanced AI predictions</span>
                </li>
              </>
            )}
            {requiredTier === SubscriptionTier.ENTERPRISE && (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Everything in Pro, plus...</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Unlimited PDF Reports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>API Access (10K calls/month)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Priority Support</span>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-2.5 bg-gradient-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity shadow-glow"
          >
            View Pricing
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-text-secondary hover:text-text-primary transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}
