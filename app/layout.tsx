import type { Metadata } from 'next'
import './globals.css'
import { FilterProvider } from '@/lib/context/FilterContext'

export const metadata: Metadata = {
  title: 'Sentimark - AI-Powered Prediction Market Intelligence',
  description: 'Advanced sentiment analysis, real-time intelligence, and professional reports for Polymarket traders. Powered by Perplexity AI and GPT-5.',
  keywords: 'polymarket, prediction markets, sentiment analysis, AI trading, market intelligence, trading signals',
  authors: [{ name: 'Sentimark' }],
  openGraph: {
    title: 'Sentimark - Prediction Market Intelligence',
    description: 'AI-powered insights for Polymarket traders',
    type: 'website',
    siteName: 'Sentimark',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sentimark - Prediction Market Intelligence',
    description: 'AI-powered insights for Polymarket traders',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  themeColor: '#27E0A3', // Sentimark primary emerald color
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <FilterProvider>
          {children}
        </FilterProvider>
      </body>
    </html>
  )
}
