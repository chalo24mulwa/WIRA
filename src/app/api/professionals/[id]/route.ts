import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/require-session";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/professionals/[id]">
) {
  try {
    const { id } = await params;
    const profile = await prisma.professionalProfile.findUnique({
      where: { id },
      include: {
        user: { select: { name: true } },
        categories: { include: { category: true } },
        specializations: { include: { specialization: true } },
        credentials: { orderBy: { createdAt: "desc" } },
        portfolioPhotos: { orderBy: { createdAt: "desc" } },
        reviewsReceived: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { customer: { select: { name: true } } },
        },
      },
    });

    if (!profile) throw new ApiError("Professional not found.", 404);

    return NextResponse.json({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}
