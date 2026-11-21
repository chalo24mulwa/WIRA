import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "singleton";

const DEFAULTS = {
  individualHiringFee: 100,
  companyHiringFee: 150,
  contactUnlockFee: 20,
  contactAccessDays: 5,
  subscriptionPromoActive: true,
  subscriptionPromoLabel: "SPECIAL LAUNCH OFFER",
  standardPrice: 1500,
  standardPromoPrice: 300,
  professionalPrice: 3000,
  professionalPromoPrice: 600,
  businessPrice: 6000,
  businessPromoPrice: 1200,
  affiliateDefaultCommission: 500,
  affiliateMinPayoutThreshold: 1000,
};

/**
 * Pricing is never hardcoded into business logic — it's read from this
 * DB-backed singleton (falling back to sane defaults on first run) so an
 * admin panel can change it later without a code change or redeploy.
 */
export async function getPlatformSettings() {
  const existing = await prisma.platformSettings.findUnique({
    where: { id: SETTINGS_ID },
  });
  if (existing) return existing;

  return prisma.platformSettings.create({
    data: { id: SETTINGS_ID, ...DEFAULTS },
  });
}

export function hiringFeeFor(accountKind: "INDIVIDUAL" | "COMPANY", settings: { individualHiringFee: number; companyHiringFee: number }) {
  return accountKind === "COMPANY" ? settings.companyHiringFee : settings.individualHiringFee;
}

export type PlanPricingSettings = {
  subscriptionPromoActive: boolean;
  subscriptionPromoLabel: string;
  standardPrice: number;
  standardPromoPrice: number;
  professionalPrice: number;
  professionalPromoPrice: number;
  businessPrice: number;
  businessPromoPrice: number;
};

/**
 * Original/effective price for a plan, driven entirely by the DB-backed
 * settings singleton so an admin can change or switch off the promo without
 * a code change. FREE is always 0 and never promoted.
 */
export function planPricing(plan: "FREE" | "STANDARD" | "PROFESSIONAL" | "BUSINESS", settings: PlanPricingSettings) {
  if (plan === "FREE") {
    return { originalPrice: 0, effectivePrice: 0, promoActive: false, percentOff: 0 };
  }

  const pairs: Record<Exclude<typeof plan, "FREE">, { original: number; promo: number }> = {
    STANDARD: { original: settings.standardPrice, promo: settings.standardPromoPrice },
    PROFESSIONAL: { original: settings.professionalPrice, promo: settings.professionalPromoPrice },
    BUSINESS: { original: settings.businessPrice, promo: settings.businessPromoPrice },
  };
  const { original, promo } = pairs[plan];
  const promoActive = settings.subscriptionPromoActive && promo < original;
  const effectivePrice = promoActive ? promo : original;
  const percentOff = promoActive ? Math.round(((original - promo) / original) * 100) : 0;

  return { originalPrice: original, effectivePrice, promoActive, percentOff };
}
