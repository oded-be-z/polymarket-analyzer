/**
 * Subscription Status API Route
 *
 * GET /api/subscriptions/status
 * Returns current subscription status, tier, and usage metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeClient } from '@/lib/stripe-client';

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';


export async function GET(request: NextRequest) {
  try {
    // TODO: Get user ID from session/auth
    // For now, using a placeholder
    const userId = 'user-placeholder';

    // Get subscription status
    const subscription = await stripeClient.getSubscriptionStatus(userId);

    return NextResponse.json({
      success: true,
      data: subscription,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Subscription status API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get subscription status',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
