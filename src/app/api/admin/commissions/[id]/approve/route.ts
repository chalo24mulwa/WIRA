import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { logAdminAction } from "@/lib/audit-log";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/admin/commissions/[id]/approve">
) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await params;

    const commission = await prisma.commission.findUnique({ where: { id } });
    if (!commission) throw new ApiError("Commission not found.", 404);
    if (commission.status !== "PENDING") {
      throw new ApiError("Only a pending commission can be approved.");
    }

    const updated = await prisma.commission.update({
      where: { id },
      data: { status: "APPROVED", approvedAt: new Date(), approvedBy: session.userId },
    });

    await logAdminAction(session.userId, "COMMISSION_APPROVED", "Commission", id, { amount: commission.amount });

    return NextResponse.json({ commission: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
