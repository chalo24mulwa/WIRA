import { prisma } from "@/lib/prisma";
import {
  BILLING_PERIOD_DAYS,
  BUSINESS_FAIR_USE_LIMIT,
  PLAN_DETAILS,
} from "@/lib/constants";
import type { PlanType, Prisma } from "@prisma/client";

export class InsufficientCreditsError extends Error {
  constructor() {
    super("INSUFFICIENT_CREDITS");
  }
}

function periodHasExpired(periodEnd: Date | null) {
  if (!periodEnd) return false;
  return periodEnd.getTime() < Date.now();
}

/**
 * Ensures a professional has a subscription row, rolling over to a fresh
 * billing period (resetting credits used) if the current one has elapsed.
 * Must run against the transaction client so the reset and the credit debit
 * that follows it are atomic.
 */
async function getOrResetSubscription(
  tx: Prisma.TransactionClient,
  professionalId: string
) {
  let subscription = await tx.subscription.findUnique({
    where: { professionalId },
  });

  if (!subscription) {
    subscription = await tx.subscription.create({
      data: {
        professionalId,
        plan: "FREE",
        creditsTotal: PLAN_DETAILS.FREE.credits,
        creditsUsed: 0,
        periodEnd: new Date(Date.now() + BILLING_PERIOD_DAYS * 86_400_000),
      },
    });
  }

  if (periodHasExpired(subscription.periodEnd)) {
    subscription = await tx.subscription.update({
      where: { id: subscription.id },
      data: {
        creditsUsed: 0,
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + BILLING_PERIOD_DAYS * 86_400_000),
      },
    });
  }

  return subscription;
}

export function creditLimitForPlan(plan: PlanType) {
  const configured = PLAN_DETAILS[plan].credits;
  return configured === -1 ? BUSINESS_FAIR_USE_LIMIT : configured;
}

/**
 * Debits exactly one credit for a confirmed booking. Only a permanently
 * confirmed booking should ever call this — never a quotation or a pending
 * request. All math happens server-side inside a transaction so two
 * concurrent confirmations can't both succeed past the limit.
 */
export async function consumeCreditForBooking(
  professionalId: string,
  bookingId: string
) {
  return prisma.$transaction(async (tx) => {
    const subscription = await getOrResetSubscription(tx, professionalId);
    const limit = creditLimitForPlan(subscription.plan);

    if (subscription.creditsUsed >= limit) {
      throw new InsufficientCreditsError();
    }

    const updated = await tx.subscription.update({
      where: { id: subscription.id },
      data: { creditsUsed: { increment: 1 } },
    });

    await tx.creditTransaction.create({
      data: {
        subscriptionId: subscription.id,
        bookingId,
        amount: 1,
        reason: "BOOKING_CONFIRMED",
      },
    });

    await tx.booking.update({
      where: { id: bookingId },
      data: { creditConsumed: true },
    });

    return updated;
  });
}

export async function getSubscriptionSummary(professionalId: string) {
  const subscription = await prisma.$transaction((tx) =>
    getOrResetSubscription(tx, professionalId)
  );
  const limit = creditLimitForPlan(subscription.plan);
  return {
    plan: subscription.plan,
    creditsUsed: subscription.creditsUsed,
    creditsLimit: limit,
    unlimited: PLAN_DETAILS[subscription.plan].credits === -1,
    creditsRemaining: Math.max(limit - subscription.creditsUsed, 0),
    periodEnd: subscription.periodEnd,
  };
}
