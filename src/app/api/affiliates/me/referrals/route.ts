import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAffiliate, handleApiError, ApiError } from "@/lib/require-session";
import { maskMemberName } from "@/lib/affiliate";

export async function GET() {
  try {
    const session = await requireAffiliate();
    const affiliate = await prisma.affiliate.findUnique({ where: { userId: session.userId } });
    if (!affiliate) throw new ApiError("Affiliate profile not found.", 404);

    const referrals = await prisma.referral.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
      include: {
        referredUser: { select: { name: true, role: true, accountKind: true } },
        campaign: { select: { name: true } },
        commission: { select: { amount: true, status: true } },
      },
    });

    return NextResponse.json({
      referrals: referrals.map((r) => ({
        id: r.id,
        memberName: maskMemberName(r.referredUser.name),
        membershipType: `${r.referredUser.role === "PROFESSIONAL" ? "Professional" : "Customer"} · ${
          r.referredUser.accountKind === "COMPANY" ? "Company" : "Individual"
        }`,
        status: r.status,
        campaign: r.campaign?.name ?? null,
        createdAt: r.createdAt,
        eligibleAt: r.eligibleAt,
        commission: r.commission ? { amount: r.commission.amount, status: r.commission.status } : null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
