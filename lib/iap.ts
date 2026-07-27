import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

/**
 * RevenueCat integration for the Yato Track Pro subscription.
 *
 * Setup checklist:
 *
 * 1. Apple Developer Program enrollment ($99/year).
 * 2. App Store Connect → create the app + 2 auto-renewable subscription
 *    products under one Subscription Group:
 *      - product id "yearly"   ($24.99 / year)
 *      - product id "monthly"  ($3.99 / month)
 * 3. RevenueCat dashboard:
 *      - Project → connect to App Store with the shared secret.
 *      - Entitlements → create one with id "Yato Track Pro".
 *      - Products → import "yearly" and "monthly", attach both to the
 *        "Yato Track Pro" entitlement.
 *      - Offerings → "default" offering with packages
 *        $rc_annual → "yearly" and $rc_monthly → "monthly".
 *      - Paywalls → design a paywall for the default offering (this is
 *        what `presentPaywall()` renders natively).
 *      - Customer Center → enable + design (used by `presentCustomerCenter`).
 * 4. Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY in your .env.
 * 5. Test with a Sandbox tester account from App Store Connect.
 */

export const PREMIUM_ENTITLEMENT = "Yato Track Pro";

const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ?? "";
let configured = false;

/**
 * TEMPORARY KILL SWITCH — set back to `false` when you want RevenueCat
 * wired up again. While this is `true`:
 *   - `Purchases.configure()` is never called (no "Wrong API Key" alert
 *     in Release builds when using a `test_` key).
 *   - `isIAPConfigured()` returns false, so every IAP code path
 *     gracefully skips: usePremium → { isPro: false }, paywall buttons
 *     show "Premium not configured", listeners never register, etc.
 *   - The free-tier gates (5-goal limit, 7-day widget trial) still work
 *     because they only depend on `isPro` being false.
 *
 * To re-enable: flip `IAP_DISABLED` back to `false` and rebuild.
 */
const IAP_DISABLED = true;

export function isIAPConfigured(): boolean {
  if (IAP_DISABLED) return false;
  return apiKey.length > 0 && Platform.OS === "ios";
}

/** Initialize once at app start. Anonymous user until setIAPUser runs. */
export function initIAP(): void {
  if (IAP_DISABLED) return;
  if (configured || !isIAPConfigured()) return;
  Purchases.setLogLevel(Purchases.LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
  configured = true;
}

/** Bind purchases to the Supabase user so the sub follows them across devices. */
export async function setIAPUser(userId: string | null): Promise<void> {
  if (!configured) return;
  try {
    if (userId) await Purchases.logIn(userId);
    else await Purchases.logOut();
  } catch (err) {
    console.warn("[iap] setIAPUser failed", err);
  }
}

export function isPremium(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false;
  return !!info.entitlements.active[PREMIUM_ENTITLEMENT];
}

/** Fetch the current offering (with monthly + annual packages). */
export async function fetchCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (err) {
    console.warn("[iap] getOfferings failed", err);
    return null;
  }
}

/**
 * Trigger Apple's native StoreKit purchase sheet for the given package.
 * Throws if the user cancels (use isUserCancelled to detect).
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

/** Restore prior purchases for this Apple ID. */
export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

/** RevenueCat throws this shape when the user dismisses the StoreKit sheet. */
export function isUserCancelled(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as Record<string, unknown>;
  return e.userCancelled === true || e.code === "PURCHASE_CANCELLED";
}

/**
 * Present the RevenueCat-managed paywall for the current offering.
 * Returns true if the user purchased or restored a subscription.
 *
 * The paywall layout itself is configured in the RevenueCat dashboard.
 */
export async function presentPaywall(): Promise<boolean> {
  if (!isIAPConfigured()) return false;
  const result: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();
  switch (result) {
    case PAYWALL_RESULT.PURCHASED:
    case PAYWALL_RESULT.RESTORED:
      return true;
    case PAYWALL_RESULT.NOT_PRESENTED:
    case PAYWALL_RESULT.ERROR:
    case PAYWALL_RESULT.CANCELLED:
    default:
      return false;
  }
}

/**
 * Smart paywall gate — only presents if the user doesn't already have the
 * Yato Track Pro entitlement. Use this from feature gates (e.g. when the
 * user tries to create their 4th goal in the free tier).
 */
export async function presentPaywallIfNeeded(): Promise<boolean> {
  if (!isIAPConfigured()) return false;
  const result: PAYWALL_RESULT = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: PREMIUM_ENTITLEMENT,
  });
  return (
    result === PAYWALL_RESULT.PURCHASED ||
    result === PAYWALL_RESULT.RESTORED ||
    result === PAYWALL_RESULT.NOT_PRESENTED
  );
}

/**
 * Open RevenueCat's Customer Center — the native flow for managing the
 * active subscription (cancel, restore, request refund, change plan).
 * Apple links here from the App Store too.
 */
export async function presentCustomerCenter(): Promise<void> {
  if (!isIAPConfigured()) return;
  await RevenueCatUI.presentCustomerCenter();
}

/**
 * Subscribe to live customer info updates. The callback is invoked
 * immediately with the current state and again every time entitlements
 * change (purchase, restore, expiration, refund).
 */
export function subscribeCustomerInfo(
  cb: (info: CustomerInfo) => void
): () => void {
  if (!configured) return () => {};
  Purchases.getCustomerInfo().then(cb).catch(() => {
    /* swallow — listener still fires on changes */
  });
  Purchases.addCustomerInfoUpdateListener(cb);
  return () => Purchases.removeCustomerInfoUpdateListener(cb);
}

/** React hook: live `isPro` flag tied to the Yato Track Pro entitlement. */
export function usePremium(): { isPro: boolean; loading: boolean } {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(isIAPConfigured());

  useEffect(() => {
    if (!isIAPConfigured()) return;
    const unsub = subscribeCustomerInfo((info) => {
      setIsPro(isPremium(info));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { isPro, loading };
}
