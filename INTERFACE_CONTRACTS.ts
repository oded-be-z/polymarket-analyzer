/**
 * SENTIMARK TRANSFORMATION - INTERFACE CONTRACTS
 *
 * These TypeScript interfaces define the contracts between all parallel agents.
 * ALL agents must adhere to these interfaces to ensure seamless integration in Phase 3.
 *
 * Created: 2025-11-15
 * Purpose: Prevent integration issues by defining contracts BEFORE parallel implementation
 */

// ============================================================================
// AGENT A: DESIGN SYSTEM CONTRACTS
// ============================================================================

/**
 * Design Token Naming Conventions
 * Source: CEO_DESIGN_SPEC.txt (Sentimark branding)
 */
interface SentimarkDesignTokens {
  colors: {
    // Primary brand colors
    primary: '#27E0A3'      // Emerald green
    secondary: '#2D7BFF'    // Electric blue

    // Gradient (used in hero sections, CTAs)
    gradient: 'linear-gradient(90deg, #27E0A3 0%, #2D7BFF 100%)'

    // Background colors (dark theme)
    background: {
      primary: '#0A0F16'      // Deep dark blue
      secondary: '#0F1419'    // Slightly lighter
      surface: '#1A1F26'      // Card backgrounds
      elevated: '#242931'     // Modal/dropdown backgrounds
    }

    // Text colors
    text: {
      primary: '#E6F2FF'      // Light blue-white (14.2:1 contrast)
      secondary: '#B8C5D0'    // Muted light blue
      tertiary: '#8A96A3'     // Subtle gray-blue
      disabled: '#4A5157'     // Disabled state
    }

    // Semantic colors
    success: '#27E0A3'        // Matches primary
    danger: '#FF4757'         // Error red
    warning: '#FFA502'        // Warning orange
    info: '#2D7BFF'           // Matches secondary
  }

  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      mono: '"SF Mono", "Consolas", "Monaco", monospace'
    }

    fontSize: {
      xs: '0.75rem'    // 12px
      sm: '0.875rem'   // 14px
      base: '1rem'     // 16px
      lg: '1.125rem'   // 18px
      xl: '1.25rem'    // 20px
      '2xl': '1.5rem'  // 24px
      '3xl': '1.875rem' // 30px
      '4xl': '2.25rem' // 36px
    }

    fontWeight: {
      normal: 400
      medium: 500
      semibold: 600
      bold: 700
      extrabold: 800
    }
  }

  spacing: {
    // 4px base unit system
    0: '0'
    1: '0.25rem'  // 4px
    2: '0.5rem'   // 8px
    3: '0.75rem'  // 12px
    4: '1rem'     // 16px
    6: '1.5rem'   // 24px
    8: '2rem'     // 32px
    12: '3rem'    // 48px
    16: '4rem'    // 64px
    24: '6rem'    // 96px
    32: '8rem'    // 128px
  }

  borderRadius: {
    none: '0'
    sm: '0.25rem'    // 4px
    DEFAULT: '0.5rem' // 8px
    md: '0.75rem'    // 12px
    lg: '1rem'       // 16px
    xl: '1.5rem'     // 24px
    '2xl': '2rem'    // 32px
    full: '9999px'   // Pills
  }

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    glow: '0 0 20px rgba(39, 224, 163, 0.3)'          // Emerald glow
    glowBlue: '0 0 20px rgba(45, 123, 255, 0.3)'      // Blue glow
  }
}

// ============================================================================
// AGENT B: PERPLEXITY INTELLIGENCE CONTRACTS
// ============================================================================

/**
 * Perplexity API Response Types
 * All 5 endpoints return data in this format
 */
interface PerplexityIntelligenceResponse {
  marketId: string
  endpoint: 'context' | 'news' | 'experts' | 'brief' | 'trends'
  timestamp: string  // ISO 8601
  data: PerplexityData
  metadata: {
    sources: number
    confidence: number  // 0-1
    freshness: 'realtime' | 'recent' | 'historical'  // < 1h, < 24h, > 24h
    cached: boolean
    cacheExpiry?: string  // ISO 8601 (if cached)
  }
}

type PerplexityData =
  | MarketContextData
  | NewsFlashData
  | ExpertAnalysisData
  | DailyBriefData
  | HistoricalTrendsData

interface MarketContextData {
  type: 'context'
  background: string          // 2-3 paragraphs
  keyEvents: Array<{
    date: string             // ISO 8601
    event: string
    impact: 'high' | 'medium' | 'low'
  }>
  expertOpinions: Array<{
    expert: string
    affiliation: string
    quote: string
    sourceUrl: string
  }>
}

interface NewsFlashData {
  type: 'news'
  breaking: Array<{
    title: string
    summary: string
    publishedAt: string      // ISO 8601
    source: string
    sourceUrl: string
    sentiment: 'bullish' | 'bearish' | 'neutral'
  }>
  lastUpdated: string        // ISO 8601
}

interface ExpertAnalysisData {
  type: 'experts'
  consensus: 'bullish' | 'bearish' | 'neutral' | 'divided'
  consensusStrength: number  // 0-1 (1 = unanimous)
  predictions: Array<{
    expert: string
    prediction: string
    rationale: string
    confidence: number       // 0-1
    sourceUrl: string
  }>
}

interface DailyBriefData {
  type: 'brief'
  summary: string            // 1 paragraph executive summary
  keyInsights: string[]      // 3-5 bullet points
  marketMood: 'optimistic' | 'pessimistic' | 'uncertain'
  riskLevel: 'low' | 'medium' | 'high'
  recommendation: string     // 1-2 sentences
}

interface HistoricalTrendsData {
  type: 'trends'
  similarMarkets: Array<{
    question: string
    resolvedDate: string     // ISO 8601
    outcome: string
    similarity: number       // 0-1
    lessons: string
  }>
  patterns: Array<{
    pattern: string
    occurrences: number
    successRate: number      // 0-1
  }>
}

/**
 * Perplexity Client Interface
 * Agent B implements this, Agent E consumes it
 */
interface IPerplexityClient {
  getMarketContext(marketId: string): Promise<PerplexityIntelligenceResponse>
  getNewsFlash(marketId: string): Promise<PerplexityIntelligenceResponse>
  getExpertAnalysis(marketId: string): Promise<PerplexityIntelligenceResponse>
  getDailyBrief(marketId: string): Promise<PerplexityIntelligenceResponse>
  getHistoricalTrends(marketId: string): Promise<PerplexityIntelligenceResponse>
}

// ============================================================================
// AGENT C: STRIPE SUBSCRIPTION CONTRACTS
// ============================================================================

/**
 * Subscription Tier Enum
 * Must match Stripe product IDs
 */
enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',              // $19/month
  ENTERPRISE = 'enterprise' // $99/month
}

/**
 * Subscription Status
 * Matches Stripe subscription status values
 */
enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  PAUSED = 'paused'
}

/**
 * User Subscription Information
 * Returned by /api/subscriptions/status
 */
interface UserSubscription {
  userId: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  currentPeriodStart: string  // ISO 8601
  currentPeriodEnd: string    // ISO 8601
  cancelAtPeriodEnd: boolean

  // Usage tracking (for Pro tier limits)
  usage: {
    pdfReportsGenerated: number
    pdfReportsLimit: number          // 10 for Pro, Infinity for Enterprise
    apiCallsUsed: number
    apiCallsLimit: number            // 10K for Pro, Infinity for Enterprise
  }

  // Stripe metadata
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
}

/**
 * Feature Gates
 * Defines what each tier can access
 */
interface FeatureGate {
  tier: SubscriptionTier
  features: {
    perplexityIntelligence: boolean    // Pro+
    pdfReports: boolean                // Pro+
    unlimitedPdfReports: boolean       // Enterprise only
    apiAccess: boolean                 // Enterprise only
    prioritySupport: boolean           // Enterprise only
  }
}

const FEATURE_GATES: Record<SubscriptionTier, FeatureGate> = {
  [SubscriptionTier.FREE]: {
    tier: SubscriptionTier.FREE,
    features: {
      perplexityIntelligence: false,
      pdfReports: false,
      unlimitedPdfReports: false,
      apiAccess: false,
      prioritySupport: false,
    }
  },
  [SubscriptionTier.PRO]: {
    tier: SubscriptionTier.PRO,
    features: {
      perplexityIntelligence: true,
      pdfReports: true,
      unlimitedPdfReports: false,
      apiAccess: false,
      prioritySupport: false,
    }
  },
  [SubscriptionTier.ENTERPRISE]: {
    tier: SubscriptionTier.ENTERPRISE,
    features: {
      perplexityIntelligence: true,
      pdfReports: true,
      unlimitedPdfReports: true,
      apiAccess: true,
      prioritySupport: true,
    }
  }
}

/**
 * Stripe Client Interface
 * Agent C implements this, Agent E consumes it
 */
interface IStripeClient {
  createCheckoutSession(tier: SubscriptionTier, userId: string): Promise<{ sessionId: string, checkoutUrl: string }>
  getSubscriptionStatus(userId: string): Promise<UserSubscription>
  cancelSubscription(userId: string): Promise<void>
  changePlan(userId: string, newTier: SubscriptionTier): Promise<UserSubscription>
  trackUsage(userId: string, usageType: 'pdf_report' | 'api_call'): Promise<void>
  checkFeatureAccess(userId: string, feature: keyof FeatureGate['features']): Promise<boolean>
}

// ============================================================================
// AGENT D: PDF GENERATION CONTRACTS
// ============================================================================

/**
 * PDF Report Metadata
 * Defines the structure of generated reports
 */
interface PDFReportMetadata {
  reportId: string            // UUID
  marketId: string
  userId: string
  generatedAt: string         // ISO 8601
  status: 'pending' | 'generating' | 'completed' | 'failed'
  downloadUrl?: string        // Azure Blob Storage URL (if completed)
  expiresAt?: string          // ISO 8601 (7 days from generation)
  pageCount: 10               // Always 10 pages for MVP
  fileSize?: number           // Bytes
}

/**
 * PDF Report Request
 * Agent E sends this to /api/reports/generate
 */
interface PDFReportRequest {
  marketId: string
  userId: string
  includePerplexity: boolean  // If user has Perplexity access
}

/**
 * PDF Report Content Sections
 * Defines the 10-page structure
 */
interface PDFReportContent {
  // Page 1: Cover
  cover: {
    marketQuestion: string
    sentimarkBranding: boolean
    generatedDate: string
  }

  // Page 2: Executive Summary
  executiveSummary: {
    aiPrediction: string
    confidence: number
    keyInsights: string[]
    riskLevel: 'low' | 'medium' | 'high'
  }

  // Page 3: Market Overview
  marketOverview: {
    price: number
    volume: number
    liquidity: number
    active: boolean
  }

  // Page 4: Price Action Chart
  priceChart: {
    chartImageUrl: string  // Generated chart image
    priceHistory: Array<{ date: string, price: number, volume: number }>
  }

  // Pages 5-6: Sentiment Analysis
  sentimentAnalysis: {
    overallSentiment: number  // -1 to 1
    sourceBreakdown: Array<{ source: string, sentiment: number }>
    trendChart: string        // Chart image URL
  }

  // Page 7: AI Predictions
  aiPredictions: {
    predictedOutcome: string
    reasoning: string
    confidenceAnalysis: string
  }

  // Page 8: Market Context (Perplexity)
  marketContext?: {  // Only if includePerplexity = true
    background: string
    keyEvents: string[]
    expertOpinions: string[]
  }

  // Page 9: Historical Comparison (Perplexity)
  historicalComparison?: {  // Only if includePerplexity = true
    similarMarkets: string[]
    patterns: string[]
  }

  // Page 10: Risk & Disclaimers
  riskDisclaimer: {
    riskFactors: string[]
    legalDisclaimer: string
    caveats: string[]
  }
}

/**
 * PDF Generator Interface
 * Agent D implements this, Agent E consumes it
 */
interface IPDFGenerator {
  generateReport(request: PDFReportRequest): Promise<PDFReportMetadata>
  getReportStatus(reportId: string): Promise<PDFReportMetadata>
  getReportHistory(userId: string): Promise<PDFReportMetadata[]>
}

// ============================================================================
// CROSS-AGENT UTILITIES
// ============================================================================

/**
 * API Response Wrapper
 * Standard format for all API responses
 */
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string  // ISO 8601
}

/**
 * Pagination
 * For list endpoints
 */
interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/**
 * Error Codes
 * Standardized across all agents
 */
enum ErrorCode {
  // Authentication
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Subscription/Payment
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',

  // Validation
  INVALID_INPUT = 'INVALID_INPUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // External Services
  PERPLEXITY_ERROR = 'PERPLEXITY_ERROR',
  STRIPE_ERROR = 'STRIPE_ERROR',
  PDF_GENERATION_ERROR = 'PDF_GENERATION_ERROR',

  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// ============================================================================
// AGENT E: INTEGRATION NOTES
// ============================================================================

/**
 * AGENT E (Frontend Integration) - READ THIS CAREFULLY:
 *
 * 1. DESIGN TOKENS
 *    - Import design tokens from `design-tokens.css` (Agent A)
 *    - Use Tailwind config generated by Agent A
 *    - All colors MUST use `text-primary`, `bg-primary`, etc. (no hardcoded hex)
 *
 * 2. PERPLEXITY INTELLIGENCE
 *    - Import IPerplexityClient from `lib/perplexity-client.ts` (Agent B)
 *    - Display intelligence in dedicated panel component
 *    - Show citations with proper attribution
 *    - Handle loading/error states
 *
 * 3. STRIPE SUBSCRIPTIONS
 *    - Import IStripeClient from `lib/stripe-client.ts` (Agent C)
 *    - Check feature access before rendering premium features
 *    - Show upgrade prompts when feature gates block access
 *    - Display usage meters for Pro users (PDF reports: X/10)
 *
 * 4. PDF REPORTS
 *    - Import IPDFGenerator from `lib/pdf-generator.ts` (Agent D)
 *    - "Generate Report" button in market detail view
 *    - Show generation progress (pending → generating → completed)
 *    - Display download link when completed
 *    - Block at 10 reports for Pro users (upgrade prompt)
 *
 * 5. ERROR HANDLING
 *    - Use ErrorCode enum for consistent error handling
 *    - Display user-friendly messages for each error code
 *    - Log errors to console with full details
 */

const AGENT_E_INTEGRATION_CHECKLIST = [
  'Import all 4 agent interfaces (IPerplexityClient, IStripeClient, IPDFGenerator)',
  'Use design tokens exclusively (no hardcoded colors)',
  'Implement feature gates before rendering premium UI',
  'Show usage meters for Pro tier (PDF reports, API calls)',
  'Display upgrade prompts when limits exceeded',
  'Handle all error codes with user-friendly messages',
  'Add loading states for async operations',
  'Implement proper TypeScript types for all props',
  'Use ApiResponse wrapper for all API calls',
  'Test with all 3 subscription tiers (Free, Pro, Enterprise)',
] as const

// ============================================================================
// EXPORT ALL CONTRACTS
// ============================================================================

export type {
  SentimarkDesignTokens,
  PerplexityIntelligenceResponse,
  PerplexityData,
  MarketContextData,
  NewsFlashData,
  ExpertAnalysisData,
  DailyBriefData,
  HistoricalTrendsData,
  IPerplexityClient,
  UserSubscription,
  FeatureGate,
  IStripeClient,
  PDFReportMetadata,
  PDFReportRequest,
  PDFReportContent,
  IPDFGenerator,
  ApiResponse,
  PaginatedResponse,
}

export {
  SubscriptionTier,
  SubscriptionStatus,
  FEATURE_GATES,
  ErrorCode,
  AGENT_E_INTEGRATION_CHECKLIST,
}
