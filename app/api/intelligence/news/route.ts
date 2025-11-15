/**
 * News Flash Intelligence Endpoint
 *
 * GET /api/intelligence/news?marketId=X
 *
 * Returns breaking news and latest developments (last 24 hours).
 * Uses fast Sonar model for real-time news updates.
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
    const intelligence = await client.getNewsFlash(marketId)

    const successResponse: ApiResponse<typeof intelligence> = {
      success: true,
      data: intelligence,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(successResponse, {
      headers: {
        'Cache-Control': intelligence.metadata.cached
          ? 'public, max-age=900'  // 15 minutes for cached
          : 'public, max-age=300',  // 5 minutes for fresh (news changes fast)
      },
    })
  } catch (error) {
    console.error('News Flash API Error:', error)

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code: ErrorCode.PERPLEXITY_ERROR,
        message: error instanceof Error ? error.message : 'Failed to fetch news flash',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
