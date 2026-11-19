import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { getSubscriptionSummary } from "@/lib/credits";
import { getOrCreateWallet } from "@/lib/wallet";
import { getPlatformSettings, planPricing } from "@/lib/platform-settings";
import type { PlanType } from "@prisma/client";

const PLANS: PlanType[] = ["FREE", "STANDARD", "PROFESSIONAL", "BUSINESS"];

export async function GET() {
  try {
    const session = await requireRole("PROFESSIONAL");
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const [summary, wallet, settings] = await Promise.all([
      getSubscriptionSummary(profile.id),
      getOrCreateWallet(session.userId),
      getPlatformSettings(),
    ]);

    const pricing = Object.fromEntries(PLANS.map((plan) => [plan, planPricing(plan, settings)]));

    return NextResponse.json({
      subscription: summary,
      walletBalance: wallet.balance,
      pricing,
      subscriptionPromoLabel: settings.subscriptionPromoLabel,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
