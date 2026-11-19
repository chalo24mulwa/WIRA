import { prisma } from "@/lib/prisma";
import { PLAN_DETAILS, BILLING_PERIOD_DAYS } from "@/lib/constants";
import type { PlanType, Prisma } from "@prisma/client";

/**
 * Applies a (already paid-for, or free) plan to a professional's
 * subscription row: resets credits and starts a fresh 30-day period, since
 * every call site only reaches this after either no payment was needed
 * (FREE) or a successful charge.
 */
export async function applyPlanChange(
  client: Prisma.TransactionClient | typeof prisma,
  professionalId: string,
  plan: PlanType
) {
  const creditsTotal = PLAN_DETAILS[plan].credits;
  const periodEnd = new Date(Date.now() + BILLING_PERIOD_DAYS * 86_400_000);

  const existing = await client.subscription.findUnique({ where: { professionalId } });

  if (existing) {
    return client.subscription.update({
      where: { id: existing.id },
      data: { plan, creditsTotal, creditsUsed: 0, periodStart: new Date(), periodEnd },
    });
  }

  return client.subscription.create({
    data: { professionalId, plan, creditsTotal, periodEnd },
  });
}
