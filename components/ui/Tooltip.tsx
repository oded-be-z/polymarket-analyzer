'use client'

import { useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface TooltipProps {
  children: ReactNode
  content: string | ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export default function Tooltip({
  children,
  content,
  position = 'top',
  className,
}: TooltipProps) {
  const [show, setShow] = useState(false)

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>

      {show && (
        <div
          className={cn(
            'absolute z-50 px-3 py-2 text-sm text-white bg-gray-950 rounded-lg shadow-lg border border-gray-800 whitespace-nowrap',
            positions[position],
            className
          )}
        >
          {content}
          <div
            className={cn(
              'absolute w-2 h-2 bg-gray-950 border-gray-800 transform rotate-45',
              position === 'top' && 'bottom-[-4px] left-1/2 -translate-x-1/2 border-b border-r',
              position === 'bottom' && 'top-[-4px] left-1/2 -translate-x-1/2 border-t border-l',
              position === 'left' && 'right-[-4px] top-1/2 -translate-y-1/2 border-r border-t',
              position === 'right' && 'left-[-4px] top-1/2 -translate-y-1/2 border-l border-b'
            )}
          />
        </div>
      )}
    </div>
  )
}
