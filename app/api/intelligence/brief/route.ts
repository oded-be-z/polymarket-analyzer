/**
 * Daily Brief Intelligence Endpoint
 *
 * GET /api/intelligence/brief?marketId=X
 *
 * Returns executive summary, key insights, market mood, risk level, and recommendations.
 * One brief per market per day (cached for 24 hours).
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPerplexityClient } from '@/lib/perplexity-client'
import { ApiResponse, ErrorCode } from '@/INTERFACE_CONTRACTS'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const marketId = searchParams.get('marketId')

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

    const client = getPerplexityClient()
    const intelligence = await client.getDailyBrief(marketId)

    const successResponse: ApiResponse<typeof intelligence> = {
      success: true,
      data: intelligence,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(successResponse, {
      headers: {
        'Cache-Control': intelligence.metadata.cached
          ? 'public, max-age=86400'  // 24 hours for cached (daily brief)
          : 'public, max-age=3600',   // 1 hour for fresh
      },
    })
  } catch (error) {
    console.error('Daily Brief API Error:', error)

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code: ErrorCode.PERPLEXITY_ERROR,
        message: error instanceof Error ? error.message : 'Failed to fetch daily brief',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
