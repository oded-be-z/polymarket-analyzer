# Polymarket Sentiment Analyzer - Component Library

Complete documentation for all UI components in the Polymarket Sentiment Analyzer dashboard.

## Table of Contents

1. [Utility Components](#utility-components)
2. [Layout Components](#layout-components)
3. [Market Components](#market-components)
4. [Chart Components](#chart-components)
5. [Sentiment Components](#sentiment-components)
6. [AI Analysis Components](#ai-analysis-components)
7. [Usage Examples](#usage-examples)

---

## Utility Components

### Button

Versatile button component with multiple variants and loading state.

**Props:**
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
}
```

**Example:**
```tsx
<Button variant="primary" size="md" onClick={handleClick}>
  Trade Now
</Button>

<Button variant="danger" isLoading>
  Processing...
</Button>
```

---

### Badge

Color-coded label component for status indicators.

**Props:**
```typescript
interface BadgeProps {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'bullish' | 'bearish'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}
```

**Example:**
```tsx
<Badge variant="bullish">Bullish</Badge>
<Badge variant="success" size="sm">Active</Badge>
```

---

### Card

Container component with consistent styling and subcomponents.

**Subcomponents:** CardHeader, CardTitle, CardDescription, CardContent, CardFooter

**Props:**
```typescript
interface CardProps {
  hover?: boolean        // Enable hover effects
  clickable?: boolean    // Add cursor pointer and scale on hover
  children: ReactNode
}
```

**Example:**
```tsx
<Card hover clickable onClick={handleClick}>
  <CardHeader>
    <CardTitle>Market Analysis</CardTitle>
    <CardDescription>AI-powered insights</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content goes here...</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

---

### Skeleton

Loading placeholder component with animation.

**Props:**
```typescript
interface SkeletonProps {
  variant?: 'default' | 'card' | 'text' | 'circle'
  className?: string
}
```

**Example:**
```tsx
<Skeleton variant="text" />
<Skeleton variant="card" />
<SkeletonCard /> // Pre-built card skeleton
```

---

### Tooltip

Hover tooltip with configurable positioning.

**Props:**
```typescript
interface TooltipProps {
  children: ReactNode
  content: string | ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}
```

**Example:**
```tsx
<Tooltip content="Click to view details" position="top">
  <Button>Hover me</Button>
</Tooltip>
```

---

### Input

Text input with label and error validation.

**Props:**
```typescript
interface InputProps {
  label?: string
  error?: string
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void
}
```

**Example:**
```tsx
<Input
  label="Search Markets"
  placeholder="Enter market name..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  error={error}
/>
```

---

### Select

Dropdown select component using Headless UI.

**Props:**
```typescript
interface SelectProps {
  options: SelectOption[]  // { value: string, label: string }[]
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}
```

**Example:**
```tsx
<Select
  label="Sort By"
  options={[
    { value: 'volume', label: 'Highest Volume' },
    { value: 'sentiment', label: 'Best Sentiment' }
  ]}
  value={sortBy}
  onChange={setSortBy}
/>
```

---

### ErrorBoundary

Error handling component for React component tree.

**Props:**
```typescript
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode  // Custom error UI
}
```

**Example:**
```tsx
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

---

## Layout Components

### Header

Top navigation bar with logo, search, and theme toggle.

**Features:**
- Sticky positioning
- Search bar (desktop only)
- Navigation links
- Dark/light mode toggle
- Responsive design

**Example:**
```tsx
<Header />
```

---

### Sidebar

Left sidebar with filters and sort options.

**Features:**
- Market status filter (All/Active/Closed)
- Category dropdown
- Volume range slider
- Sentiment filter chips
- Sort by dropdown
- Active filters summary

**Example:**
```tsx
<Sidebar />
```

---

### Footer

Bottom footer with links and credits.

**Features:**
- Multi-column link grid
- Powered by credits (GPT-5-Pro, Gemini, Perplexity)
- Copyright notice
- Responsive design

**Example:**
```tsx
<Footer />
```

---

## Market Components

### MarketCard

Compact market card for grid display.

**Props:**
```typescript
interface MarketCardProps {
  market: Market
  onClick?: (market: Market) => void
}
```

**Features:**
- Truncated question with tooltip
- Category and status badges
- Sentiment indicator
- YES/NO prices with trend indicators
- 24h volume and liquidity
- End date (for active markets)
- Hover effects

**Example:**
```tsx
<MarketCard
  market={market}
  onClick={(m) => navigate(`/market/${m.id}`)}
/>
```

---

### MarketList

Grid of market cards with loading and empty states.

**Features:**
- Responsive grid (1/2/3 columns)
- Loading skeletons
- Empty state with illustration
- Mock data for demonstration

**Example:**
```tsx
<MarketList />
```

---

### MarketDetail

Full market detail page with tabs.

**Props:**
```typescript
interface MarketDetailProps {
  market: Market
  priceHistory: PriceHistory[]
  volumeHistory: VolumeHistory[]
  onBack?: () => void
}
```

**Features:**
- Three tabs: Overview, Analysis, Insights
- Overview: Current prices, charts, stats
- Analysis: AI analysis and sentiment panel
- Insights: Individual insight cards
- Responsive layout (2-column on desktop)

**Example:**
```tsx
<MarketDetail
  market={market}
  priceHistory={priceData}
  volumeHistory={volumeData}
  onBack={() => navigate('/markets')}
/>
```

---

## Chart Components

### PriceChart

Line chart showing YES/NO price history.

**Props:**
```typescript
interface PriceChartProps {
  data: PriceDataPoint[]  // { timestamp, yes, no }[]
  title?: string
}
```

**Features:**
- Dual-axis line chart (YES = green, NO = red)
- Timeframe tabs (24h, 7d, 30d)
- Custom tooltip with time and prices
- Recharts integration
- Responsive container

**Example:**
```tsx
<PriceChart
  data={priceHistory}
  title="Price History"
/>
```

---

### VolumeChart

Bar chart showing trading volume over time.

**Props:**
```typescript
interface VolumeChartProps {
  data: VolumeDataPoint[]  // { timestamp, volume }[]
  title?: string
}
```

**Features:**
- Gradient bar chart
- Formatted Y-axis (K/M notation)
- Custom tooltip with formatted currency
- Rounded bar corners

**Example:**
```tsx
<VolumeChart
  data={volumeHistory}
  title="Volume Over Time"
/>
```

---

### SentimentChart

Animated gauge chart showing sentiment score.

**Props:**
```typescript
interface SentimentChartProps {
  score: number        // -1 to 1
  confidence: number   // 0 to 1
  title?: string
}
```

**Features:**
- Animated SVG gauge (red → gray → green)
- Needle animation on mount
- Score display with color coding
- Confidence progress bar
- Sentiment label

**Example:**
```tsx
<SentimentChart
  score={0.45}
  confidence={0.78}
  title="AI Sentiment Score"
/>
```

---

## Sentiment Components

### SentimentIndicator

Inline sentiment badge with tooltip.

**Props:**
```typescript
interface SentimentIndicatorProps {
  score: number        // -1 to 1
  confidence?: number  // 0 to 1
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}
```

**Features:**
- Color-coded badge (bullish/bearish/neutral)
- Tooltip with full details
- Compact or labeled display

**Example:**
```tsx
<SentimentIndicator
  score={0.45}
  confidence={0.78}
  size="sm"
  showLabel={false}
/>
```

---

### SentimentPanel

Full sentiment analysis panel with source breakdown.

**Props:**
```typescript
interface SentimentPanelProps {
  overallScore: number
  confidence: number
  sources: SentimentSource[]  // { name, score, weight, icon }[]
}
```

**Features:**
- Large overall score display
- Confidence level bar
- Source breakdown with icons
- Individual source scores and weights
- Visual mini-charts for each source

**Example:**
```tsx
<SentimentPanel
  overallScore={0.45}
  confidence={0.78}
  sources={[
    { name: 'Perplexity News', score: 0.52, weight: 0.4, icon: 'perplexity' },
    { name: 'GPT-5-Pro', score: 0.45, weight: 0.35, icon: 'gpt' },
    { name: 'Gemini Analysis', score: 0.38, weight: 0.25, icon: 'gemini' },
  ]}
/>
```

---

## AI Analysis Components

### AIAnalysis

Trading recommendation and AI reasoning.

**Props:**
```typescript
interface AIAnalysisProps {
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'WATCH'
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  keyInsights: string[]
  reasoning: string
  confidence: number
}
```

**Features:**
- Recommendation badge (color-coded)
- Risk assessment badge
- Key insights bullet list
- Expandable GPT-5-Pro reasoning
- Disclaimer notice

**Example:**
```tsx
<AIAnalysis
  recommendation="BUY"
  riskLevel="MEDIUM"
  keyInsights={[
    'Strong bullish sentiment',
    'High trading volume',
    'Positive news coverage'
  ]}
  reasoning="Based on comprehensive analysis..."
  confidence={0.78}
/>
```

---

### InsightCard

Individual insight with type-based styling.

**Props:**
```typescript
interface InsightCardProps {
  type: 'positive' | 'negative' | 'warning' | 'info'
  title: string
  description: string
  source: string
  timestamp: Date
}
```

**Features:**
- Type-based icon and color
- Badge variant matching type
- Source attribution
- Formatted timestamp

**Example:**
```tsx
<InsightCard
  type="positive"
  title="Strong Market Momentum"
  description="Trading volume increased by 45%"
  source="Perplexity"
  timestamp={new Date()}
/>
```

---

## Usage Examples

### Complete Market Page

```tsx
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import MarketList from '@/components/markets/MarketList'

export default function MarketsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6">Active Markets</h1>
          <MarketList />
        </main>
      </div>
      <Footer />
    </div>
  )
}
```

---

### Market Detail Page with All Charts

```tsx
import MarketDetail from '@/components/markets/MarketDetail'

export default function MarketDetailPage({ params }) {
  const market = useMarket(params.id)
  const priceHistory = usePriceHistory(params.id)
  const volumeHistory = useVolumeHistory(params.id)

  return (
    <div className="p-6">
      <MarketDetail
        market={market}
        priceHistory={priceHistory}
        volumeHistory={volumeHistory}
        onBack={() => router.push('/markets')}
      />
    </div>
  )
}
```

---

### Custom Analysis Dashboard

```tsx
import PriceChart from '@/components/charts/PriceChart'
import SentimentChart from '@/components/charts/SentimentChart'
import AIAnalysis from '@/components/ai/AIAnalysis'

export default function AnalysisDashboard() {
  return (
    <div className="grid grid-cols-2 gap-6">
      <PriceChart data={priceData} />
      <SentimentChart score={0.45} confidence={0.78} />
      <div className="col-span-2">
        <AIAnalysis
          recommendation="BUY"
          riskLevel="MEDIUM"
          keyInsights={insights}
          reasoning={reasoning}
          confidence={0.78}
        />
      </div>
    </div>
  )
}
```

---

## Styling Guidelines

### Colors

- **Bullish:** green-500 (#22c55e)
- **Bearish:** red-500 (#ef4444)
- **Neutral:** gray-400 (#9ca3af)
- **Primary:** blue-500 (#0ea5e9)
- **Background:** gray-900 (#111827)
- **Card:** gray-800 (#1f2937)

### Spacing

All components follow 4px grid system:
- `gap-2` = 8px
- `gap-4` = 16px
- `gap-6` = 24px
- `p-4` = 16px padding
- `p-6` = 24px padding

### Animations

- Transitions: 200-300ms cubic-bezier(0.4, 0, 0.2, 1)
- Hover scale: 1.02 (clickable cards)
- Loading shimmer: 2s infinite

### Responsive Breakpoints

- `sm`: 640px (mobile)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

---

## Utility Functions

### Formatting

```typescript
formatNumber(1234567)        // "1.23M"
formatCurrency(1234567)      // "$1.23M"
formatPercentage(0.652)      // "65.2%"
```

### Sentiment Helpers

```typescript
getSentimentColor(0.45)      // "text-bullish-500"
getSentimentBgColor(-0.3)    // "bg-bearish-500/10 border-bearish-500/30"
getSentimentLabel(0.45)      // "Bullish"
```

### Text Helpers

```typescript
truncateText("Long text...", 50)  // Truncates with ellipsis
```

---

## TypeScript Types

```typescript
// Core market type
interface Market {
  id: string
  question: string
  description?: string
  category: string
  yesPrice: number
  noPrice: number
  volume24h: number
  liquidity: number
  endDate: Date
  active: boolean
  sentiment?: {
    score: number
    confidence: number
  }
}

// Price history data point
interface PriceHistory {
  timestamp: number
  yes: number
  no: number
}

// Volume history data point
interface VolumeHistory {
  timestamp: number
  volume: number
}

// Sentiment source
interface SentimentSource {
  name: string
  score: number
  weight: number
  icon?: 'perplexity' | 'gpt' | 'gemini'
}
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

---

## Component Checklist

✅ **Utility Components (8):**
- Button, Badge, Card, Skeleton, Tooltip, Input, Select, ErrorBoundary

✅ **Layout Components (3):**
- Header, Sidebar, Footer

✅ **Market Components (3):**
- MarketCard, MarketList, MarketDetail

✅ **Chart Components (3):**
- PriceChart, VolumeChart, SentimentChart

✅ **Sentiment Components (2):**
- SentimentIndicator, SentimentPanel

✅ **AI Analysis Components (2):**
- AIAnalysis, InsightCard

**Total: 21 Components** ✨

---

## Notes

- All components use TypeScript for type safety
- Tailwind CSS for styling (dark theme default)
- Recharts for data visualization
- Headless UI for accessible components
- Hero Icons for consistent iconography
- Responsive design for all screen sizes
- Smooth animations on all interactions
- Error boundaries for graceful error handling
