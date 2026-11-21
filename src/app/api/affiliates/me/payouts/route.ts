import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAffiliate, handleApiError, ApiError } from "@/lib/require-session";

export async function GET() {
  try {
    const session = await requireAffiliate();
    const affiliate = await prisma.affiliate.findUnique({ where: { userId: session.userId } });
    if (!affiliate) throw new ApiError("Affiliate profile not found.", 404);

    const payouts = await prisma.payout.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
      include: { commissions: { select: { id: true } } },
    });

    return NextResponse.json({
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        receiptNumber: p.receiptNumber,
        note: p.note,
        commissionCount: p.commissions.length,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
