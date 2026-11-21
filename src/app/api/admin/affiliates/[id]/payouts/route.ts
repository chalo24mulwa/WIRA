import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { affiliatePayoutSchema } from "@/lib/validators";
import { logAdminAction } from "@/lib/audit-log";
import { notify } from "@/lib/notify";

function fakeReceipt() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/admin/affiliates/[id]/payouts">
) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const parsed = affiliatePayoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const { method, commissionIds, note, clientReference } = parsed.data;

    const existingByReference = await prisma.payout.findUnique({ where: { reference: clientReference } });
    if (existingByReference) {
      return NextResponse.json({ payout: existingByReference });
    }

    const affiliate = await prisma.affiliate.findUnique({ where: { id } });
    if (!affiliate) throw new ApiError("Affiliate not found.", 404);

    const commissions = await prisma.commission.findMany({
      where: { id: { in: commissionIds }, affiliateId: id },
    });
    if (commissions.length !== commissionIds.length) {
      throw new ApiError("One or more commissions could not be found for this affiliate.");
    }
    const notApproved = commissions.some((c) => c.status !== "APPROVED");
    if (notApproved) {
      throw new ApiError("Only approved commissions can be included in a payout.");
    }

    const amount = commissions.reduce((sum, c) => sum + c.amount, 0);

    const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
    const minThreshold = settings?.affiliateMinPayoutThreshold ?? 0;
    if (amount < minThreshold) {
      throw new ApiError(
        `This payout (KSh ${amount.toLocaleString()}) is below the minimum payout threshold of KSh ${minThreshold.toLocaleString()}.`
      );
    }

    const payout = await prisma.$transaction(async (tx) => {
      const created = await tx.payout.create({
        data: {
          affiliateId: id,
          amount,
          method,
          reference: clientReference,
          receiptNumber: method === "MPESA" ? fakeReceipt() : null,
          note: note || null,
          createdBy: session.userId,
        },
      });

      await tx.commission.updateMany({
        where: { id: { in: commissionIds } },
        data: { status: "PAID", payoutId: created.id },
      });

      return created;
    });

    await logAdminAction(session.userId, "AFFILIATE_PAYOUT_RECORDED", "Affiliate", id, {
      amount,
      method,
      commissionIds,
      payoutId: payout.id,
    });

    await notify(
      affiliate.userId,
      "Commission payout sent!",
      `KSh ${amount.toLocaleString()} has been paid out to you via ${method === "MPESA" ? "M-Pesa" : "manual payment"}.`,
      "/dashboard/affiliate/payouts",
      "affiliate_payout"
    );

    return NextResponse.json({ payout });
  } catch (error) {
    return handleApiError(error);
  }
}
