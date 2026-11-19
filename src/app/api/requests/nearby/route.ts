import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { distanceKm } from "@/lib/geo";

export async function GET() {
  try {
    const session = await requireRole("PROFESSIONAL");

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
      include: { categories: true },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const categoryIds = profile.categories.map((c) => c.categoryId);
    if (categoryIds.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    const requests = await prisma.serviceRequest.findMany({
      where: {
        status: { in: ["OPEN", "QUOTED"] },
        categoryId: { in: categoryIds },
        county: profile.county,
        quotations: { none: { professionalId: profile.id } },
        dismissals: { none: { professionalId: profile.id } },
      },
      orderBy: { createdAt: "desc" },
      include: { category: true, customer: { select: { name: true } } },
      take: 50,
    });

    const withDistance = requests.map((r) => ({
      ...r,
      distanceKm:
        profile.latitude != null && profile.longitude != null && r.latitude != null && r.longitude != null
          ? distanceKm(profile.latitude, profile.longitude, r.latitude, r.longitude)
          : null,
    }));

    return NextResponse.json({ requests: withDistance });
  } catch (error) {
    return handleApiError(error);
  }
}
