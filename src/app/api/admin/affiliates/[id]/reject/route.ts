import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { logAdminAction } from "@/lib/audit-log";
import { notify } from "@/lib/notify";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/admin/affiliates/[id]/reject">
) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

    const affiliate = await prisma.affiliate.findUnique({ where: { id } });
    if (!affiliate) throw new ApiError("Affiliate not found.", 404);

    const updated = await prisma.affiliate.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: reason || "Application did not meet our current requirements.",
        decidedAt: new Date(),
        decidedBy: session.userId,
      },
    });

    await logAdminAction(session.userId, "AFFILIATE_REJECTED", "Affiliate", id, { reason });

    await notify(
      affiliate.userId,
      "Your affiliate application wasn't approved",
      updated.rejectionReason!,
      "/dashboard/affiliate",
      "affiliate_rejected"
    );

    return NextResponse.json({ affiliate: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
