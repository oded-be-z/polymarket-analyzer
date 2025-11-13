import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import MarketList from '@/components/markets/MarketList'

// Force dynamic rendering to enable client-side data fetching
export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Active Markets</h1>
            <p className="text-gray-400">
              AI-powered sentiment analysis and trading recommendations
            </p>
          </div>

          <MarketList />
        </main>
      </div>

      <Footer />
    </div>
  )
}
