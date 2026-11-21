import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { logAdminAction } from "@/lib/audit-log";

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/admin/campaigns/[id]">
) {
  try {
    const session = await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json().catch(() => null);

    const data: { isActive?: boolean; commissionOverride?: number | null; description?: string } = {};
    if (typeof body?.isActive === "boolean") data.isActive = body.isActive;
    if (body?.commissionOverride !== undefined) {
      if (body.commissionOverride !== null && (typeof body.commissionOverride !== "number" || body.commissionOverride < 0)) {
        throw new ApiError("commissionOverride must be a non-negative number or null.");
      }
      data.commissionOverride = body.commissionOverride;
    }
    if (typeof body?.description === "string") data.description = body.description;

    const campaign = await prisma.campaign.update({ where: { id }, data });

    await logAdminAction(session.userId, "CAMPAIGN_UPDATED", "Campaign", id, data);

    return NextResponse.json({ campaign });
  } catch (error) {
    return handleApiError(error);
  }
}
