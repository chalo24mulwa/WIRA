import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/hiring-requests/[id]/close">
) {
  try {
    const session = await requireRole("CUSTOMER");
    const { id } = await params;

    const hiringRequest = await prisma.hiringRequest.findUnique({ where: { id } });
    if (!hiringRequest || hiringRequest.employerId !== session.userId) {
      throw new ApiError("Hiring request not found.", 404);
    }
    if (hiringRequest.status === "CLOSED" || hiringRequest.status === "CANCELLED") {
      return NextResponse.json({ hiringRequest });
    }

    const updated = await prisma.hiringRequest.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    return NextResponse.json({ hiringRequest: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
