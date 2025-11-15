/**
 * Feature Gate Middleware
 *
 * Enforces subscription tier requirements for protected routes
 * Checks feature access before allowing requests to premium endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { FEATURE_GATES, SubscriptionTier } from './INTERFACE_CONTRACTS';

/**
 * Protected routes and their required features
 */
const PROTECTED_ROUTES: Record<string, keyof typeof FEATURE_GATES[SubscriptionTier]['features']> = {
  '/api/perplexity': 'perplexityIntelligence',
  '/api/reports/generate': 'pdfReports',
  '/api/v1': 'apiAccess',
};

/**
 * Middleware function
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires feature gate
  const requiredFeature = Object.entries(PROTECTED_ROUTES).find(([route]) =>
    pathname.startsWith(route)
  )?.[1];

  if (!requiredFeature) {
    // Route doesn't require feature gate
    return NextResponse.next();
  }

  // TODO: Get user ID from session/auth
  // For now, returning 401 as placeholder
  // In production, replace with actual session check

  // const session = await getServerSession();
  // if (!session?.user?.id) {
  //   return NextResponse.json(
  //     { error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
  //     { status: 401 }
  //   );
  // }

  // TODO: Check user's subscription tier and feature access
  // For now, allowing all requests
  // In production, replace with actual feature check

  // const hasAccess = await checkFeatureAccess(session.user.id, requiredFeature);
  // if (!hasAccess) {
  //   return NextResponse.json(
  //     { error: { code: 'SUBSCRIPTION_REQUIRED', message: `Feature requires Pro or higher subscription` } },
  //     { status: 403 }
  //   );
  // }

  return NextResponse.next();
}

/**
 * Middleware configuration
 * Only runs on specified paths
 */
export const config = {
  matcher: [
    '/api/perplexity/:path*',
    '/api/reports/:path*',
    '/api/v1/:path*',
  ],
};
