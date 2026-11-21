import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { logAdminAction } from "@/lib/audit-log";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/admin/affiliates/[id]/reactivate">
) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await params;

    const affiliate = await prisma.affiliate.findUnique({ where: { id } });
    if (!affiliate) throw new ApiError("Affiliate not found.", 404);
    if (affiliate.status !== "SUSPENDED") {
      throw new ApiError("Only a suspended affiliate can be reactivated.");
    }

    const updated = await prisma.affiliate.update({
      where: { id },
      data: { status: "APPROVED", suspendedAt: null },
    });

    await logAdminAction(session.userId, "AFFILIATE_REACTIVATED", "Affiliate", id);

    return NextResponse.json({ affiliate: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
