import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/hiring-requests/[id]">
) {
  try {
    const session = await requireRole("CUSTOMER");
    const { id } = await params;

    const hiringRequest = await prisma.hiringRequest.findUnique({
      where: { id },
      include: {
        recipients: {
          include: {
            professional: {
              include: { user: { select: { name: true } } },
            },
          },
        },
      },
    });
    if (!hiringRequest || hiringRequest.employerId !== session.userId) {
      throw new ApiError("Hiring request not found.", 404);
    }

    return NextResponse.json({ hiringRequest });
  } catch (error) {
    return handleApiError(error);
  }
}
