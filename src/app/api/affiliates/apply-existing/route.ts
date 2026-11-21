import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError, ApiError } from "@/lib/require-session";
import { affiliateApplyExistingSchema } from "@/lib/validators";
import { notify } from "@/lib/notify";

/**
 * Attaches an affiliate profile to the caller's existing Customer or
 * Professional account — no new account, no repeat of email/phone
 * verification, since logging in here already proves both. This is the
 * entry point reached from inside an existing dashboard; the public,
 * no-account-yet funnel is /api/affiliates/apply.
 */
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    if (session.role === "ADMIN" || session.role === "AFFILIATE") {
      throw new ApiError("This account type can't apply here.");
    }

    const existing = await prisma.affiliate.findUnique({ where: { userId: session.userId } });
    if (existing) {
      throw new ApiError("You already have an affiliate profile on this account.");
    }

    const body = await request.json().catch(() => null);
    const parsed = affiliateApplyExistingSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      include: { companyProfile: true },
    });

    const affiliate = await prisma.affiliate.create({
      data: {
        userId: session.userId,
        businessName: user.companyProfile?.companyName ?? null,
        payoutPhone: parsed.data.payoutPhone,
        status: "PENDING",
      },
    });

    await notify(
      session.userId,
      "Affiliate application submitted",
      "Your application to join the WIRA Affiliate Program is under review. We'll let you know as soon as it's approved.",
      "/dashboard/affiliate",
      "affiliate_applied"
    );

    return NextResponse.json({ affiliate });
  } catch (error) {
    return handleApiError(error);
  }
}
