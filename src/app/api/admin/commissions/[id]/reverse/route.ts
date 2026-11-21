import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { logAdminAction } from "@/lib/audit-log";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/admin/commissions/[id]/reverse">
) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    if (!reason) throw new ApiError("Enter a reason for reversing this commission.");

    const commission = await prisma.commission.findUnique({ where: { id } });
    if (!commission) throw new ApiError("Commission not found.", 404);
    if (commission.status === "PAID") {
      throw new ApiError("This commission has already been paid out and can no longer be reversed.");
    }
    if (commission.status === "REVERSED") {
      throw new ApiError("This commission is already reversed.");
    }

    const updated = await prisma.commission.update({
      where: { id },
      data: {
        status: "REVERSED",
        reversedAt: new Date(),
        reversedBy: session.userId,
        reversalReason: reason,
      },
    });

    await logAdminAction(session.userId, "COMMISSION_REVERSED", "Commission", id, {
      amount: commission.amount,
      reason,
    });

    return NextResponse.json({ commission: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
