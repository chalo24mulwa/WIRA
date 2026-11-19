import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { notify } from "@/lib/notify";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/quotations/[id]/decline">
) {
  try {
    const session = await requireRole("CUSTOMER");
    const { id } = await params;

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { request: true, professional: true },
    });
    if (!quotation) throw new ApiError("Quotation not found.", 404);
    if (quotation.request.customerId !== session.userId) {
      throw new ApiError("You do not have permission to do this.", 403);
    }
    if (quotation.status !== "PENDING") {
      throw new ApiError("This quotation is no longer pending.");
    }

    await prisma.quotation.update({ where: { id }, data: { status: "DECLINED" } });

    await notify(
      quotation.professional.userId,
      "Quotation declined",
      "A customer declined your quotation for a service request.",
      "/dashboard/professional/bookings",
      "quotation_declined"
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
