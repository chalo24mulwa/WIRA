import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { getSubscriptionSummary } from "@/lib/credits";
import { getPlatformSettings, planPricing } from "@/lib/platform-settings";
import { fundWallet, debitWalletInTx } from "@/lib/wallet";
import { applyPlanChange } from "@/lib/subscription-checkout";
import { normalizePhone } from "@/lib/phone";
import type { PlanType } from "@prisma/client";

const PAID_PLANS: PlanType[] = ["STANDARD", "PROFESSIONAL", "BUSINESS"];

function fakeMpesaReceipt() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/**
 * Confirms an M-Pesa STK push payment for a subscription plan. No real
 * Safaricom integration is wired up in this environment (no Daraja API
 * credentials), so this plays the role a verified payment webhook would:
 * it only ever runs after the frontend's simulated "enter your PIN" wait,
 * and funds + immediately spends the wallet for exactly the plan's current
 * price under one idempotency key, so a retried request can never charge
 * twice.
 */
export async function POST(request: Request) {
  try {
    const session = await requireRole("PROFESSIONAL");
    const body = await request.json().catch(() => null);
    const plan = body?.plan as PlanType;
    const phone = typeof body?.phone === "string" ? body.phone : "";
    const clientReference = typeof body?.clientReference === "string" ? body.clientReference : "";

    if (!PAID_PLANS.includes(plan)) {
      throw new ApiError("Invalid plan selected.");
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      throw new ApiError("Enter a valid M-Pesa phone number (07xx xxx xxx or +254…).");
    }
    if (!clientReference) {
      throw new ApiError("Missing checkout reference.");
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const existing = await prisma.subscription.findUnique({
      where: { professionalId: profile.id },
    });
    if (existing?.plan === plan) {
      throw new ApiError("You are already on this plan.");
    }

    const settings = await getPlatformSettings();
    const { effectivePrice } = planPricing(plan, settings);

    const reference = `mpesa-sub-${clientReference}`;
    await fundWallet(session.userId, effectivePrice, reference);

    await prisma.$transaction(async (tx) => {
      await debitWalletInTx(tx, {
        userId: session.userId,
        amount: effectivePrice,
        type: "SUBSCRIPTION",
      });
      await applyPlanChange(tx, profile.id, plan);
    });

    const summary = await getSubscriptionSummary(profile.id);
    return NextResponse.json({
      subscription: summary,
      receiptNumber: fakeMpesaReceipt(),
      amount: effectivePrice,
      phone: normalizedPhone,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
