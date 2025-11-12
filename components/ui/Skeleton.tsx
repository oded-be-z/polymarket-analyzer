import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'text' | 'circle'
}

export default function Skeleton({
  className,
  variant = 'default',
  ...props
}: SkeletonProps) {
  const variants = {
    default: 'h-4 w-full',
    card: 'h-48 w-full',
    text: 'h-4 w-3/4',
    circle: 'h-12 w-12 rounded-full',
  }

  return (
    <div
      className={cn(
        'animate-shimmer rounded-lg bg-gray-800',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-800/50 p-6">
      <Skeleton className="h-6 w-3/4 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex gap-4 mt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  )
}
