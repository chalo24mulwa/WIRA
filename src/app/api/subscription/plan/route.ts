import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { PLAN_DETAILS, BILLING_PERIOD_DAYS } from "@/lib/constants";
import { getSubscriptionSummary } from "@/lib/credits";
import type { PlanType } from "@prisma/client";

const VALID_PLANS: PlanType[] = ["FREE", "STANDARD", "PROFESSIONAL", "BUSINESS"];

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

    const creditsTotal =
      PLAN_DETAILS[plan].credits === -1 ? PLAN_DETAILS[plan].credits : PLAN_DETAILS[plan].credits;

    if (existing) {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: {
          plan,
          creditsTotal,
          periodEnd: existing.periodEnd ?? new Date(Date.now() + BILLING_PERIOD_DAYS * 86_400_000),
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          professionalId: profile.id,
          plan,
          creditsTotal,
          periodEnd: new Date(Date.now() + BILLING_PERIOD_DAYS * 86_400_000),
        },
      });
    }

    const summary = await getSubscriptionSummary(profile.id);
    return NextResponse.json({ subscription: summary });
  } catch (error) {
    return handleApiError(error);
  }
}
