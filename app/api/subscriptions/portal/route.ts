/**
 * Stripe Customer Portal API Route
 *
 * POST /api/subscriptions/portal
 * Creates a Stripe Customer Portal session for subscription management
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-client';

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    // TODO: Get user from session/auth
    // For now, using placeholder
    const userId = 'user-placeholder';

    // Get user's Stripe customer ID from database
    // Placeholder - replace with actual database query
    const stripeCustomerId = 'cus_placeholder';

    if (!stripeCustomerId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No Stripe customer found',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/settings/billing`,
    });

    return NextResponse.json({
      success: true,
      data: {
        portalUrl: session.url,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Customer portal API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'STRIPE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create customer portal session',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
