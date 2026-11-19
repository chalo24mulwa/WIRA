import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError, ApiError } from "@/lib/require-session";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/requests/[id]">
) {
  try {
    const session = await requireUser();
    const { id } = await params;

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        category: true,
        quotations: {
          orderBy: { amount: "asc" },
          include: {
            professional: {
              include: {
                user: { select: { name: true } },
                portfolioPhotos: { orderBy: { createdAt: "desc" }, take: 1 },
              },
            },
          },
        },
        booking: true,
      },
    });

    if (!serviceRequest) throw new ApiError("Request not found.", 404);
    if (serviceRequest.customerId !== session.userId && session.role !== "ADMIN") {
      throw new ApiError("You do not have permission to view this request.", 403);
    }

    return NextResponse.json({ request: serviceRequest });
  } catch (error) {
    return handleApiError(error);
  }
}
