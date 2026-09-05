import { Platform } from 'react-native';

// In Expo Go or mock environment, we gracefully handle Purchases
let Purchases: any = null;
try {
  Purchases = require('react-native-purchases').default;
} catch (e) {
  // Graceful fallback for non-native development
  console.log('[RevenueCat] Native Purchases module not available in current environment; running in mock mode.');
}

const ENTITLEMENT_ID = 'edgepoint_pro';

export async function initRevenueCat(userId?: string) {
  if (!Purchases) return;

  const apiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'appl_placeholder'
      : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || 'goog_placeholder';

  try {
    Purchases.configure({
      apiKey,
      appUserID: userId, // Associates purchases directly with the Supabase auth.users UUID
    });
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
  }
}

export async function checkProEntitlement(): Promise<boolean> {
  if (!Purchases) return false;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch (error) {
    console.error('[RevenueCat] Error checking customer info:', error);
    return false;
  }
}

export async function purchaseProPackage(packageType: 'monthly' | 'annual'): Promise<boolean> {
  if (!Purchases) {
    // In mock mode, simulate successful purchase
    console.log(`[RevenueCat Mock] Simulating ${packageType} subscription purchase.`);
    return true;
  }

  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null) {
      const selectedPackage =
        packageType === 'annual'
          ? offerings.current.annual
          : offerings.current.monthly;

      if (selectedPackage) {
        const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
        return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      }
    }
    return false;
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('[RevenueCat] Purchase failed:', error);
    }
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!Purchases) return false;
  try {
    const customerInfo = await Purchases.restorePurchases();
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch (error) {
    console.error('[RevenueCat] Restore failed:', error);
    return false;
  }
}
