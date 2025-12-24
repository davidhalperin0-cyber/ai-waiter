/**
 * Subscription validation and management utilities
 */

export interface Subscription {
  status: 'trial' | 'active' | 'expired' | 'past_due';
  planType?: 'full' | 'menu_only'; // 'full' = כל התכונות, 'menu_only' = רק תפריט
  menuOnlyMessage?: string | null; // Custom message for menu-only plan (shown to customers)
  tablesAllowed: number;
  nextBillingDate?: string | null;
}

/**
 * Checks if a subscription is currently active
 * 
 * Rules:
 * - status must be "active"
 * - if nextBillingDate exists and is in the past → not active
 * 
 * @param subscription - The subscription object to validate
 * @returns true if subscription is active, false otherwise
 */
export function isSubscriptionActive(subscription: Subscription | null | undefined): boolean {
  if (!subscription) {
    return false;
  }

  // Status must be "active"
  if (subscription.status !== 'active') {
    return false;
  }

  // If nextBillingDate exists and is in the past, subscription is expired
  if (subscription.nextBillingDate) {
    const nextBillingDate = new Date(subscription.nextBillingDate);
    const now = new Date();
    
    if (now > nextBillingDate) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if subscription should be auto-expired based on nextBillingDate
 * This is a safety net for cases where webhooks are delayed
 * 
 * @param subscription - The subscription object to check
 * @returns true if subscription should be expired, false otherwise
 */
export function shouldAutoExpire(subscription: Subscription | null | undefined): boolean {
  if (!subscription) {
    return false;
  }

  // Only check if status is "active"
  if (subscription.status !== 'active') {
    return false;
  }

  // If nextBillingDate exists and is in the past, should expire
  if (subscription.nextBillingDate) {
    const nextBillingDate = new Date(subscription.nextBillingDate);
    const now = new Date();
    
    return now > nextBillingDate;
  }

  return false;
}



