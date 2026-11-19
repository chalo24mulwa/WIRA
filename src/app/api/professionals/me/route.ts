import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { professionalProfileSchema } from "@/lib/validators";

async function getOwnProfile(userId: string) {
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId },
    include: {
      categories: { include: { category: true } },
      specializations: { include: { specialization: true } },
      credentials: { orderBy: { createdAt: "desc" } },
      portfolioPhotos: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!profile) throw new ApiError("Professional profile not found.", 404);
  return profile;
}

export async function GET() {
  try {
    const session = await requireRole("PROFESSIONAL");
    const profile = await getOwnProfile(session.userId);
    return NextResponse.json({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireRole("PROFESSIONAL");
    const body = await request.json().catch(() => null);
    const parsed = professionalProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const { categoryIds, specializationIds, ...rest } = parsed.data;

    const profile = await getOwnProfile(session.userId);

    await prisma.$transaction(async (tx) => {
      await tx.professionalProfile.update({
        where: { id: profile.id },
        data: rest,
      });

      await tx.professionalCategory.deleteMany({ where: { professionalId: profile.id } });
      await tx.professionalCategory.createMany({
        data: categoryIds.map((categoryId) => ({ professionalId: profile.id, categoryId })),
      });

      await tx.professionalSpecialization.deleteMany({ where: { professionalId: profile.id } });
      if (specializationIds?.length) {
        await tx.professionalSpecialization.createMany({
          data: specializationIds.map((specializationId) => ({
            professionalId: profile.id,
            specializationId,
          })),
        });
      }
    });

    const updated = await getOwnProfile(session.userId);
    return NextResponse.json({ profile: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
