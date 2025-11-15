/**
 * Market Context Intelligence Endpoint
 *
 * GET /api/intelligence/context?marketId=X
 *
 * Returns comprehensive market background, key events, and expert opinions.
 * Implements PerplexityIntelligenceResponse contract from INTERFACE_CONTRACTS.ts
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPerplexityClient } from '@/lib/perplexity-client'
import { ApiResponse, ErrorCode } from '@/INTERFACE_CONTRACTS'

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';


export const runtime = 'edge' // Use Edge Runtime for better performance

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const marketId = searchParams.get('marketId')

    // Validation
    if (!marketId) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: {
          code: ErrorCode.INVALID_INPUT,
          message: 'marketId parameter is required',
        },
        timestamp: new Date().toISOString(),
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Get Perplexity client
    const client = getPerplexityClient()

    // Fetch market context
    const intelligence = await client.getMarketContext(marketId)

    const successResponse: ApiResponse<typeof intelligence> = {
      success: true,
      data: intelligence,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(successResponse, {
      headers: {
        'Cache-Control': intelligence.metadata.cached
          ? 'public, max-age=3600' // 1 hour cache for cached responses
          : 'public, max-age=300',  // 5 minutes for fresh responses
      },
    })
  } catch (error) {
    console.error('Market Context API Error:', error)

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code: ErrorCode.PERPLEXITY_ERROR,
        message: error instanceof Error ? error.message : 'Failed to fetch market context',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
