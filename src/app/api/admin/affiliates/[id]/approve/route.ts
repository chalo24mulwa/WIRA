import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { generateUniqueReferralCode } from "@/lib/affiliate";
import { logAdminAction } from "@/lib/audit-log";
import { notify } from "@/lib/notify";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/admin/affiliates/[id]/approve">
) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await params;

    const affiliate = await prisma.affiliate.findUnique({ where: { id }, include: { user: true } });
    if (!affiliate) throw new ApiError("Affiliate not found.", 404);
    if (affiliate.status === "APPROVED") throw new ApiError("This affiliate is already approved.");

    const referralCode = affiliate.referralCode ?? (await generateUniqueReferralCode());

    const updated = await prisma.affiliate.update({
      where: { id },
      data: {
        status: "APPROVED",
        referralCode,
        decidedAt: new Date(),
        decidedBy: session.userId,
        rejectionReason: null,
        suspendedAt: null,
      },
    });

    await logAdminAction(session.userId, "AFFILIATE_APPROVED", "Affiliate", id, { referralCode });

    await notify(
      affiliate.userId,
      "Your affiliate application was approved!",
      "Your WIRA affiliate dashboard is now active. Find your referral link and marketing resources there.",
      "/dashboard/affiliate",
      "affiliate_approved"
    );

    return NextResponse.json({ affiliate: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
