import { prisma } from "@/lib/prisma";

const SETTINGS_ID = "singleton";

const DEFAULTS = {
  individualHiringFee: 100,
  companyHiringFee: 150,
  contactUnlockFee: 20,
  contactAccessDays: 5,
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
