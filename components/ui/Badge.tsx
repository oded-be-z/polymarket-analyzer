import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'bullish' | 'bearish'
  size?: 'sm' | 'md' | 'lg'
}

export default function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const baseStyles =
    'inline-flex items-center font-medium rounded-full whitespace-nowrap'

  const variants = {
    default: 'bg-gray-700 text-gray-200',
    success: 'bg-green-500/10 text-green-400 border border-green-500/30',
    danger: 'bg-red-500/10 text-red-400 border border-red-500/30',
    warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    bullish: 'bg-bullish-500/10 text-bullish-400 border border-bullish-500/30',
    bearish: 'bg-bearish-500/10 text-bearish-400 border border-bearish-500/30',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  )
}
