import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/require-session";
import { distanceKm } from "@/lib/geo";

export async function GET() {
  try {
    const session = await requireRole("PROFESSIONAL");

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
      include: { categories: true },
    });

    if (!profile || !profile.isOnline) {
      return NextResponse.json({ request: null, waitingCount: 0 });
    }

    const categoryIds = profile.categories.map((c) => c.categoryId);
    if (categoryIds.length === 0) {
      return NextResponse.json({ request: null, waitingCount: 0 });
    }

    const candidates = await prisma.serviceRequest.findMany({
      where: {
        status: { in: ["OPEN", "QUOTED"] },
        categoryId: { in: categoryIds },
        county: profile.county,
        quotations: { none: { professionalId: profile.id } },
        dismissals: { none: { professionalId: profile.id } },
      },
      orderBy: { createdAt: "asc" },
      include: { category: true },
      take: 10,
    });

    const inRange = candidates.filter((r) => {
      if (
        profile.latitude == null ||
        profile.longitude == null ||
        r.latitude == null ||
        r.longitude == null
      ) {
        return true;
      }
      return distanceKm(profile.latitude, profile.longitude, r.latitude, r.longitude) <= profile.serviceRadiusKm;
    });

    const [next, ...rest] = inRange;

    if (!next) {
      return NextResponse.json({ request: null, waitingCount: 0 });
    }

    return NextResponse.json({
      request: {
        id: next.id,
        description: next.description,
        county: next.county,
        town: next.town,
        createdAt: next.createdAt,
        category: { name: next.category.name },
        budgetAmount: next.budgetAmount,
        budgetMethod: next.budgetMethod,
      },
      waitingCount: rest.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
