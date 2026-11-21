import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/require-session";

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const affiliates = await prisma.affiliate.findMany({
      where: status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, phone: true, county: true } },
        _count: { select: { referrals: true } },
        commissions: { select: { amount: true, status: true } },
      },
    });

    return NextResponse.json({
      affiliates: affiliates.map((a) => {
        const commissionTotals = a.commissions.reduce(
          (acc, c) => {
            acc[c.status] = (acc[c.status] ?? 0) + c.amount;
            return acc;
          },
          {} as Record<string, number>
        );
        return {
          id: a.id,
          name: a.user.name,
          email: a.user.email,
          phone: a.user.phone,
          county: a.user.county,
          businessName: a.businessName,
          referralCode: a.referralCode,
          payoutPhone: a.payoutPhone,
          status: a.status,
          rejectionReason: a.rejectionReason,
          appliedAt: a.appliedAt,
          decidedAt: a.decidedAt,
          referralCount: a._count.referrals,
          commissionPending: commissionTotals.PENDING ?? 0,
          commissionApproved: commissionTotals.APPROVED ?? 0,
          commissionPaid: commissionTotals.PAID ?? 0,
        };
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
