/**
 * Stripe Client - Subscription Management
 *
 * Implements IStripeClient interface from INTERFACE_CONTRACTS.ts
 * Handles subscription creation, management, and feature access control
 */

import Stripe from 'stripe';
import { SubscriptionTier, SubscriptionStatus, UserSubscription, FEATURE_GATES } from '../INTERFACE_CONTRACTS';

// Initialize Stripe with API key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
  appInfo: {
    name: 'Sentimark',
    version: '1.0.0',
  },
});

/**
 * Database client (placeholder - will be replaced with actual DB client)
 * In production, this would use Prisma, Drizzle, or pg-promise
 */
const db = {
  async query(sql: string, params: any[]) {
    // Placeholder for database queries
    throw new Error('Database client not implemented - use actual DB client in production');
  }
};

/**
 * Stripe Client Implementation
 */
export const stripeClient = {
  /**
   * Create Stripe Checkout Session for subscription signup
   */
  async createCheckoutSession(tier: SubscriptionTier, userId: string): Promise<{ sessionId: string, checkoutUrl: string }> {
    try {
      // Get tier configuration from database
      const tierConfig: any = await db.query(
        'SELECT * FROM subscription_tiers WHERE name = $1',
        [tier]
      );

      if (!tierConfig) {
        throw new Error(`Subscription tier '${tier}' not found`);
      }

      // Get or create Stripe customer
      const user: any = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      let customerId = user?.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId },
        });
        customerId = customer.id;

        // Update user with Stripe customer ID
        await db.query(
          'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
          [customerId, userId]
        );
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: tierConfig.stripe_price_id,
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: tierConfig.trial_days || 0,
          metadata: {
            userId,
            tier,
          },
        },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      });

      return {
        sessionId: session.id,
        checkoutUrl: session.url!,
      };
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Get current subscription status and usage
   */
  async getSubscriptionStatus(userId: string): Promise<UserSubscription> {
    try {
      // Get active subscription
      const subscription: any = await db.query(
        `SELECT s.*, t.*
         FROM subscriptions s
         JOIN subscription_tiers t ON s.tier_id = t.id
         WHERE s.user_id = $1
         AND s.status IN ('active', 'trialing', 'past_due')
         ORDER BY s.created_at DESC
         LIMIT 1`,
        [userId]
      );

      // Default to free tier if no active subscription
      const tier = (subscription?.tier_name as SubscriptionTier) || SubscriptionTier.FREE;
      const status = (subscription?.status as SubscriptionStatus) || SubscriptionStatus.ACTIVE;

      // Get current period usage
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const usage: any = await db.query(
        `SELECT
          SUM(CASE WHEN metric_type = 'pdf_reports' THEN quantity ELSE 0 END) as pdf_reports,
          SUM(CASE WHEN metric_type = 'api_calls' THEN quantity ELSE 0 END) as api_calls
         FROM usage_metrics
         WHERE user_id = $1
         AND period_start >= $2
         AND period_end <= $3`,
        [userId, monthStart, monthEnd]
      );

      // Get limits from tier
      const limits = {
        free: { pdfReportsLimit: 0, apiCallsLimit: 5 },
        pro: { pdfReportsLimit: 10, apiCallsLimit: 10000 },
        enterprise: { pdfReportsLimit: Infinity, apiCallsLimit: Infinity },
      };

      return {
        userId,
        tier,
        status,
        currentPeriodStart: subscription?.current_period_start || monthStart.toISOString(),
        currentPeriodEnd: subscription?.current_period_end || monthEnd.toISOString(),
        cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
        usage: {
          pdfReportsGenerated: usage?.pdf_reports || 0,
          pdfReportsLimit: limits[tier].pdfReportsLimit,
          apiCallsUsed: usage?.api_calls || 0,
          apiCallsLimit: limits[tier].apiCallsLimit,
        },
        stripeCustomerId: subscription?.stripe_customer_id,
        stripeSubscriptionId: subscription?.stripe_subscription_id,
        stripePriceId: subscription?.stripe_price_id,
      };
    } catch (error) {
      console.error('Get subscription status error:', error);
      throw new Error(`Failed to get subscription status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Cancel subscription (at period end or immediately)
   */
  async cancelSubscription(userId: string): Promise<void> {
    try {
      const subscription = await db.query(
        'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1 AND status IN (\'active\', \'trialing\') LIMIT 1',
        [userId]
      ) as any;

      if (!subscription?.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      // Cancel at period end (don't cut off access immediately)
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      // Update database
      await db.query(
        'UPDATE subscriptions SET cancel_at_period_end = true, canceled_at = NOW() WHERE stripe_subscription_id = $1',
        [subscription.stripe_subscription_id]
      );
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw new Error(`Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Change subscription plan (upgrade/downgrade)
   */
  async changePlan(userId: string, newTier: SubscriptionTier): Promise<UserSubscription> {
    try {
      // Get current subscription
      const currentSub = await db.query(
        'SELECT * FROM subscriptions WHERE user_id = $1 AND status IN (\'active\', \'trialing\') LIMIT 1',
        [userId]
      ) as any;

      if (!currentSub?.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      // Get new tier config
      const newTierConfig = await db.query(
        'SELECT * FROM subscription_tiers WHERE name = $1',
        [newTier]
      ) as any;

      if (!newTierConfig) {
        throw new Error(`Tier '${newTier}' not found`);
      }

      // Update Stripe subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id);
      const updatedSubscription = await stripe.subscriptions.update(currentSub.stripe_subscription_id, {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newTierConfig.stripe_price_id,
          },
        ],
        proration_behavior: 'create_prorations',
      });

      // Update database
      await db.query(
        'UPDATE subscriptions SET tier_id = $1, updated_at = NOW() WHERE id = $2',
        [newTierConfig.id, currentSub.id]
      );

      // Return updated subscription status
      return this.getSubscriptionStatus(userId);
    } catch (error) {
      console.error('Change plan error:', error);
      throw new Error(`Failed to change plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Track usage (PDF reports, API calls)
   */
  async trackUsage(userId: string, usageType: 'pdf_report' | 'api_call'): Promise<void> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Map usage type to metric type
      const metricType = usageType === 'pdf_report' ? 'pdf_reports' : 'api_calls';

      // Check quota before tracking
      const subscription = await this.getSubscriptionStatus(userId);
      const currentUsage = metricType === 'pdf_reports'
        ? subscription.usage.pdfReportsGenerated
        : subscription.usage.apiCallsUsed;
      const limit = metricType === 'pdf_reports'
        ? subscription.usage.pdfReportsLimit
        : subscription.usage.apiCallsLimit;

      if (currentUsage >= limit) {
        throw new Error(`Usage limit exceeded for ${usageType}`);
      }

      // Track usage
      await db.query(
        `INSERT INTO usage_metrics (user_id, metric_type, quantity, period_start, period_end)
         VALUES ($1, $2, 1, $3, $4)`,
        [userId, metricType, monthStart, monthEnd]
      );

      // Update usage summary
      await db.query(
        `INSERT INTO usage_summary (user_id, period_start, period_end, ${metricType === 'pdf_reports' ? 'reports_generated' : 'api_calls_used'})
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (user_id, period_start, period_end)
         DO UPDATE SET ${metricType === 'pdf_reports' ? 'reports_generated' : 'api_calls_used'} = usage_summary.${metricType === 'pdf_reports' ? 'reports_generated' : 'api_calls_used'} + 1,
                       last_updated = NOW()`,
        [userId, monthStart, monthEnd]
      );
    } catch (error) {
      console.error('Track usage error:', error);
      throw new Error(`Failed to track usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Check if user has access to a feature
   */
  async checkFeatureAccess(userId: string, feature: keyof typeof FEATURE_GATES[SubscriptionTier]['features']): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionStatus(userId);
      const featureGate = FEATURE_GATES[subscription.tier];

      return featureGate.features[feature];
    } catch (error) {
      console.error('Check feature access error:', error);
      return false;
    }
  },
};

// Export types
export type { UserSubscription };
