import type { Metadata } from 'next'
import './globals.css'
import { FilterProvider } from '@/lib/context/FilterContext'

export const metadata: Metadata = {
  title: 'Polymarket Sentiment Analyzer',
  description: 'AI-powered sentiment analysis and trading insights for Polymarket',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-900 text-gray-100">
        <FilterProvider>
          {children}
        </FilterProvider>
      </body>
    </html>
  )
}
