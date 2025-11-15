import { SubscriptionTier } from '@/INTERFACE_CONTRACTS'

/**
 * SubscriptionBadge Component - Agent E
 *
 * Displays user's subscription tier with Sentimark styling
 */

interface SubscriptionBadgeProps {
  tier: SubscriptionTier
  size?: 'sm' | 'md' | 'lg'
}

export default function SubscriptionBadge({
  tier,
  size = 'md'
}: SubscriptionBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  const baseClasses = 'font-semibold rounded-full inline-flex items-center justify-center'

  switch (tier) {
    case SubscriptionTier.ENTERPRISE:
      return (
        <span className={`${baseClasses} ${sizeClasses[size]} bg-gradient-primary text-white shadow-glow`}>
          ENTERPRISE
        </span>
      )

    case SubscriptionTier.PRO:
      return (
        <span className={`${baseClasses} ${sizeClasses[size]} bg-primary/20 text-primary border border-primary/30`}>
          PRO
        </span>
      )

    case SubscriptionTier.FREE:
    default:
      return (
        <span className={`${baseClasses} ${sizeClasses[size]} bg-bg-elevated text-text-tertiary border border-text-disabled/30`}>
          FREE
        </span>
      )
  }
}
