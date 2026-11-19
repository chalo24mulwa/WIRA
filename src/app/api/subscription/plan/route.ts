import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { getSubscriptionSummary } from "@/lib/credits";
import { getPlatformSettings, planPricing } from "@/lib/platform-settings";
import { debitWalletInTx, getOrCreateWallet, InsufficientFundsError } from "@/lib/wallet";
import { applyPlanChange } from "@/lib/subscription-checkout";
import type { PlanType } from "@prisma/client";

const VALID_PLANS: PlanType[] = ["FREE", "STANDARD", "PROFESSIONAL", "BUSINESS"];

/**
 * Pays for a plan straight out of the professional's existing WIRA Coins
 * balance — the shortcut offered on the M-Pesa checkout page for anyone who
 * already has enough balance and doesn't need a fresh STK push. The primary,
 * pay-as-you-go path is /api/subscription/checkout.
 */
export async function POST(request: Request) {
  try {
    const session = await requireRole("PROFESSIONAL");
    const body = await request.json().catch(() => null);
    const plan = body?.plan as PlanType;

    if (!VALID_PLANS.includes(plan)) {
      throw new ApiError("Invalid plan selected.");
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

    if (effectivePrice > 0) {
      try {
        await prisma.$transaction(async (tx) => {
          await debitWalletInTx(tx, {
            userId: session.userId,
            amount: effectivePrice,
            type: "SUBSCRIPTION",
          });
          await applyPlanChange(tx, profile.id, plan);
        });
      } catch (error) {
        if (error instanceof InsufficientFundsError) {
          const wallet = await getOrCreateWallet(session.userId);
          return NextResponse.json(
            {
              error: "Insufficient WIRA Coins balance for this plan.",
              requiresFunding: true,
              requiredAmount: effectivePrice,
              walletBalance: wallet.balance,
            },
            { status: 402 }
          );
        }
        throw error;
      }
    } else {
      await applyPlanChange(prisma, profile.id, plan);
    }

    const summary = await getSubscriptionSummary(profile.id);
    return NextResponse.json({ subscription: summary });
  } catch (error) {
    return handleApiError(error);
  }
}
