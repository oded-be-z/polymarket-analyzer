/**
 * Pricing Page
 *
 * Displays subscription tiers and checkout options
 * Implements design from CEO_DESIGN_SPEC.txt with Sentimark branding
 */

'use client';

import { useState } from 'react';
import { SubscriptionTier } from '@/INTERFACE_CONTRACTS';

const PRICING_TIERS = [
  {
    id: SubscriptionTier.FREE,
    name: 'Free',
    price: 0,
    description: 'Get started with basic market analysis',
    cta: 'Current Plan',
    features: [
      'View all prediction markets',
      'Basic sentiment scores',
      '7 days price history',
      'Community support',
      '5 API calls/day',
    ],
    recommended: false,
  },
  {
    id: SubscriptionTier.PRO,
    name: 'Pro',
    price: 19,
    description: 'Full AI-powered market intelligence',
    cta: 'Start 7-Day Free Trial',
    trial: '7 days free',
    features: [
      'Everything in Free',
      'Perplexity AI insights',
      'Advanced analytics',
      '10 PDF reports/month',
      'API access (10K calls/mo)',
      '90 days history',
      'Email support',
    ],
    recommended: true,
  },
  {
    id: SubscriptionTier.ENTERPRISE,
    name: 'Enterprise',
    price: 99,
    description: 'Unlimited everything + dedicated support',
    cta: 'Contact Sales',
    features: [
      'Everything in Pro',
      'Unlimited API calls',
      'Unlimited PDF reports',
      'Dedicated account manager',
      'Priority support (4hr response)',
      'Custom integrations',
      'SLA: 99.9% uptime',
    ],
    recommended: false,
    annual: '$900/year (save $288)',
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  const handleCheckout = async (tierId: string) => {
    if (tierId === SubscriptionTier.FREE) {
      window.location.href = '/dashboard';
      return;
    }

    if (tierId === SubscriptionTier.ENTERPRISE) {
      window.location.href = '/contact?plan=enterprise';
      return;
    }

    setLoading(true);
    setSelectedTier(tierId);

    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { data } = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(false);
      setSelectedTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-text-primary mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Choose the perfect plan for your prediction market intelligence needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-background-surface rounded-lg shadow-lg overflow-hidden transition-all ${
                tier.recommended
                  ? 'ring-2 ring-primary scale-105'
                  : 'hover:shadow-xl'
              }`}
            >
              {/* Recommended Badge */}
              {tier.recommended && (
                <div className="bg-gradient text-white px-4 py-2 text-center text-sm font-semibold">
                  RECOMMENDED
                </div>
              )}

              {/* Card Content */}
              <div className="p-8">
                {/* Tier Name */}
                <h3 className="text-2xl font-bold text-text-primary mb-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-text-secondary mb-6">
                  {tier.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-text-primary">
                    ${tier.price}
                  </span>
                  {tier.price > 0 && (
                    <span className="text-text-secondary">/month</span>
                  )}
                </div>

                {/* Trial Badge */}
                {tier.trial && (
                  <p className="text-sm text-success font-semibold mb-4">
                    {tier.trial}
                  </p>
                )}

                {/* Annual Option */}
                {tier.annual && (
                  <p className="text-sm text-success font-semibold mb-4">
                    {tier.annual}
                  </p>
                )}

                {/* CTA Button */}
                <button
                  onClick={() => handleCheckout(tier.id)}
                  disabled={loading && selectedTier === tier.id}
                  className={`w-full py-3 rounded-lg font-semibold transition-all mb-8 ${
                    tier.recommended
                      ? 'bg-gradient text-white hover:opacity-90'
                      : 'bg-background-elevated text-text-primary hover:bg-opacity-80'
                  } ${
                    loading && selectedTier === tier.id
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {loading && selectedTier === tier.id
                    ? 'Loading...'
                    : tier.cta}
                </button>

                {/* Features List */}
                <ul className="space-y-3">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm">
                      <svg
                        className="w-5 h-5 text-success mr-3 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-text-primary">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-4">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto text-left space-y-4">
            <details className="bg-background-surface p-6 rounded-lg">
              <summary className="font-semibold text-text-primary cursor-pointer">
                Can I cancel my subscription anytime?
              </summary>
              <p className="mt-2 text-text-secondary">
                Yes! You can cancel your Pro or Enterprise subscription at any
                time. Your access will continue until the end of your billing
                period.
              </p>
            </details>

            <details className="bg-background-surface p-6 rounded-lg">
              <summary className="font-semibold text-text-primary cursor-pointer">
                What happens when I hit my PDF report limit?
              </summary>
              <p className="mt-2 text-text-secondary">
                Pro users get 10 PDF reports per month. Once you reach the
                limit, you&apos;ll be prompted to upgrade to Enterprise for unlimited
                reports.
              </p>
            </details>

            <details className="bg-background-surface p-6 rounded-lg">
              <summary className="font-semibold text-text-primary cursor-pointer">
                Do you offer annual billing?
              </summary>
              <p className="mt-2 text-text-secondary">
                Yes! Enterprise plans can be billed annually with significant
                savings. Contact our sales team for annual pricing.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
