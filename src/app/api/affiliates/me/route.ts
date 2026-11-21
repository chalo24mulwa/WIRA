import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAffiliate, handleApiError, ApiError } from "@/lib/require-session";

export async function GET() {
  try {
    const session = await requireAffiliate();
    const affiliate = await prisma.affiliate.findUnique({ where: { userId: session.userId } });
    if (!affiliate) throw new ApiError("Affiliate profile not found.", 404);

    const [totalReferrals, eligibleReferrals, pendingReferrals, ineligibleReferrals, commissionAgg] =
      await Promise.all([
        prisma.referral.count({ where: { affiliateId: affiliate.id } }),
        prisma.referral.count({ where: { affiliateId: affiliate.id, status: "ELIGIBLE" } }),
        prisma.referral.count({ where: { affiliateId: affiliate.id, status: "PENDING" } }),
        prisma.referral.count({ where: { affiliateId: affiliate.id, status: "INELIGIBLE" } }),
        prisma.commission.groupBy({
          by: ["status"],
          where: { affiliateId: affiliate.id },
          _sum: { amount: true },
        }),
      ]);

    const commissionByStatus: Record<string, number> = {
      PENDING: 0,
      APPROVED: 0,
      PAID: 0,
      REVERSED: 0,
    };
    for (const row of commissionAgg) {
      commissionByStatus[row.status] = row._sum.amount ?? 0;
    }

    const conversionRate = totalReferrals > 0 ? Math.round((eligibleReferrals / totalReferrals) * 100) : 0;

    return NextResponse.json({
      affiliate: {
        status: affiliate.status,
        businessName: affiliate.businessName,
        referralCode: affiliate.referralCode,
        payoutPhone: affiliate.payoutPhone,
        rejectionReason: affiliate.rejectionReason,
      },
      stats: {
        totalReferrals,
        eligibleReferrals,
        pendingReferrals,
        ineligibleReferrals,
        conversionRate,
        commissionEarned: commissionByStatus.PENDING + commissionByStatus.APPROVED + commissionByStatus.PAID,
        commissionPending: commissionByStatus.PENDING,
        commissionApproved: commissionByStatus.APPROVED,
        commissionPaid: commissionByStatus.PAID,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
