import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/admin/affiliates/[id]">
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const affiliate = await prisma.affiliate.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, phone: true, county: true, createdAt: true } },
        referrals: {
          orderBy: { createdAt: "desc" },
          include: {
            referredUser: { select: { name: true, email: true, role: true, accountKind: true, emailVerifiedAt: true, phoneVerifiedAt: true } },
            campaign: { select: { name: true } },
            commission: true,
          },
        },
        payouts: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!affiliate) throw new ApiError("Affiliate not found.", 404);

    return NextResponse.json({ affiliate });
  } catch (error) {
    return handleApiError(error);
  }
}
