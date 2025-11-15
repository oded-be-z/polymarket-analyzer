/**
 * Expert Analysis Intelligence Endpoint
 *
 * GET /api/intelligence/experts?marketId=X
 *
 * Returns expert predictions, consensus analysis, and sentiment breakdown.
 * Uses Sonar Reasoning Pro model for complex analytical synthesis.
 *
 * Created: 2025-11-15
 * Agent: Agent B - Perplexity Integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPerplexityClient } from '@/lib/perplexity-client'
import { ApiResponse, ErrorCode } from '@/INTERFACE_CONTRACTS'

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';


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
    const intelligence = await client.getExpertAnalysis(marketId)

    const successResponse: ApiResponse<typeof intelligence> = {
      success: true,
      data: intelligence,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(successResponse, {
      headers: {
        'Cache-Control': intelligence.metadata.cached
          ? 'public, max-age=21600'  // 6 hours for cached (expert opinions evolve slowly)
          : 'public, max-age=1800',   // 30 minutes for fresh
      },
    })
  } catch (error) {
    console.error('Expert Analysis API Error:', error)

    const errorResponse: ApiResponse<null> = {
      success: false,
      error: {
        code: ErrorCode.PERPLEXITY_ERROR,
        message: error instanceof Error ? error.message : 'Failed to fetch expert analysis',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
