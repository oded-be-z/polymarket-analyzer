/**
 * Stripe Webhook Handler API Route
 *
 * POST /api/subscriptions/webhook
 * Handles Stripe webhook events (subscriptions, payments, invoices)
 *
 * CRITICAL: This endpoint MUST verify webhook signatures
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe-client';

// Disable body parsing - we need the raw body for signature verification
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    console.error('Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    );
  }

  // Log webhook event to database
  try {
    // TODO: Log to database
    console.log(`Webhook event received: ${event.type}`);
  } catch (err) {
    console.error('Failed to log webhook event:', err);
  }

  // Handle specific webhook events
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json(
      { error: `Webhook processing failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

/**
 * Handle successful checkout session
 * Creates subscription record in database
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id);

  // Get subscription details
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error('No subscription ID in checkout session');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // TODO: Create subscription record in database
  // - Get user by customer ID
  // - Get tier by price ID
  // - Insert subscription record
  // - Send confirmation email

  console.log('Subscription created:', subscription.id);
}

/**
 * Handle subscription updates (status changes, plan changes)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);

  // TODO: Update subscription record in database
  // - Update status
  // - Update period dates
  // - Send notification if status changed to past_due

  console.log('Subscription status:', subscription.status);
}

/**
 * Handle subscription deletion/cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);

  // TODO: Update subscription record in database
  // - Set status to canceled
  // - Set ended_at timestamp
  // - Send cancellation confirmation email

  console.log('Subscription canceled');
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Invoice payment succeeded:', invoice.id);

  // TODO: Create/update invoice record in database
  // - Record payment success
  // - Update subscription if needed
  // - Send receipt email

  console.log('Payment succeeded for:', invoice.amount_paid / 100);
}

/**
 * Handle failed invoice payment
 */

// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);

  // TODO: Log payment failure
  // - Create payment_attempt record
  // - Send payment failure email
  // - Update subscription status if needed

  console.log('Payment failed for:', invoice.amount_due / 100);
}
