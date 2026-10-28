/**
 * Centralized Pricing & Subscription Configuration for EdgePoint+
 * All pricing, trial rules, and monetization flags live here.
 */

export const WEEKLY_NGN = 1500;
export const ANNUAL_NGN = 45000; // about ₦865/week, save ~42%
export const FOUNDING_WEEKLY_NGN = 1000; // first 200 subscribers
export const TRIAL_DAYS = 3; // no card required

/**
 * Global monetization feature flag.
 * While false:
 * - No user is charged.
 * - App runs on mock / waitlist mode.
 * - Primary button collects email for the waitlist.
 * - RevenueCat / Native In-App Purchases are disabled.
 */
export const PAYMENTS_ENABLED = false;

export interface PlanConfig {
  id: 'weekly' | 'annual';
  name: string;
  price: number;
  period: string;
  badge?: string;
  savingsNote?: string;
}

export const PRICING_PLANS: PlanConfig[] = [
  {
    id: 'weekly',
    name: 'Weekly Access',
    price: WEEKLY_NGN,
    period: '/ week',
  },
  {
    id: 'annual',
    name: 'Annual Pass',
    price: ANNUAL_NGN,
    period: '/ year',
    badge: 'SAVE 42%',
    savingsNote: 'About ₦865 / week',
  },
];
