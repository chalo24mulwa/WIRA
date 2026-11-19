import { prisma } from "@/lib/prisma";
import { distanceKm } from "@/lib/geo";
import type { Prisma } from "@prisma/client";
import type { ProfessionalCardData } from "@/components/ProfessionalCard";

export type ProfessionalSearchParams = {
  categoryId?: string;
  specializationId?: string;
  county?: string;
  q?: string;
  lat?: number;
  lng?: number;
  ids?: string[];
};

export async function searchProfessionals(
  params: ProfessionalSearchParams
): Promise<ProfessionalCardData[]> {
  const where: Prisma.ProfessionalProfileWhereInput = {};

  if (params.ids) where.id = { in: params.ids };
  if (params.categoryId) where.categories = { some: { categoryId: params.categoryId } };
  if (params.specializationId) {
    where.specializations = { some: { specializationId: params.specializationId } };
  }
  if (params.county) where.county = { equals: params.county };
  if (params.q) {
    where.OR = [
      { bio: { contains: params.q } },
      { user: { name: { contains: params.q } } },
    ];
  }

  const profiles = await prisma.professionalProfile.findMany({
    where,
    include: {
      user: { select: { name: true } },
      categories: { include: { category: true } },
    },
    take: 60,
  });

  let results: ProfessionalCardData[] = profiles.map((p) => {
    const dist =
      params.lat != null && params.lng != null && p.latitude != null && p.longitude != null
        ? distanceKm(params.lat, params.lng, p.latitude, p.longitude)
        : null;
    return {
      id: p.id,
      name: p.user.name,
      bio: p.bio,
      county: p.county,
      town: p.town,
      isOnline: p.isOnline,
      verified: p.verified,
      ratingAvg: p.ratingAvg,
      ratingCount: p.ratingCount,
      categories: p.categories.map((c) => c.category.name),
      distanceKm: dist,
    };
  });

  if (params.lat != null && params.lng != null) {
    results = results.sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  } else {
    results = results.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return b.ratingAvg - a.ratingAvg;
    });
  }

  return results;
}
