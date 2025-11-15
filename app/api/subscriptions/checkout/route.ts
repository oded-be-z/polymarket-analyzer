/**
 * Stripe Checkout Session API Route
 *
 * POST /api/subscriptions/checkout
 * Creates a Stripe checkout session for subscription signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeClient } from '@/lib/stripe-client';
import { SubscriptionTier } from '@/INTERFACE_CONTRACTS';

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { tierId } = body;

    // Validate tier
    if (!['pro', 'enterprise'].includes(tierId)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Invalid subscription tier' } },
        { status: 400 }
      );
    }

    // TODO: Get user ID from session/auth
    // For now, using a placeholder
    const userId = 'user-placeholder';

    // Create checkout session
    const { sessionId, checkoutUrl } = await stripeClient.createCheckoutSession(
      tierId as SubscriptionTier,
      userId
    );

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        url: checkoutUrl,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Checkout API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STRIPE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create checkout session',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
