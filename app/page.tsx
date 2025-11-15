import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import MarketList from '@/components/markets/MarketList'
import { SubscriptionTier } from '@/INTERFACE_CONTRACTS'

// Force dynamic rendering to enable client-side data fetching
export const dynamic = 'force-dynamic'

export default function Home() {
  // TODO: Get actual user subscription from session/database
  const userTier = SubscriptionTier.FREE
  const userName = 'Demo User'

  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <Navbar userTier={userTier} userName={userName} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          {/* Hero Section - Sentimark Gradient Header */}
          <div className="mb-8 rounded-xl bg-gradient-primary p-8 shadow-glow">
            <h1 className="text-4xl font-extrabold text-white mb-3">
              Sentimark Intelligence
            </h1>
            <p className="text-lg text-white/90 max-w-2xl">
              AI-powered prediction market analysis with real-time sentiment tracking,
              expert insights, and professional reports.
            </p>
          </div>

          {/* Active Markets Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Active Markets</h2>
            <p className="text-text-secondary">
              Browse trending prediction markets with live sentiment analysis
            </p>
          </div>

          <MarketList />
        </main>
      </div>

      <Footer />
    </div>
  )
}
