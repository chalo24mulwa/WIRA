import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency, handleApiError, ApiError } from "@/lib/require-session";
import { professionalProfileSchema } from "@/lib/validators";

async function loadOwnedWorker(id: string, agencyUserId: string) {
  const worker = await prisma.professionalProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      categories: { include: { category: true } },
      specializations: { include: { specialization: true } },
    },
  });
  if (!worker || worker.agencyOwnerId !== agencyUserId) {
    throw new ApiError("Worker not found.", 404);
  }
  return worker;
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/agency/workers/[id]">
) {
  try {
    const session = await requireAgency();
    const { id } = await params;
    const worker = await loadOwnedWorker(id, session.userId);
    return NextResponse.json({ worker });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext<"/api/agency/workers/[id]">
) {
  try {
    const session = await requireAgency();
    const { id } = await params;
    await loadOwnedWorker(id, session.userId);

    const body = await request.json().catch(() => null);
    const parsed = professionalProfileSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const { categoryIds, specializationIds, ...rest } = parsed.data;

    await prisma.$transaction(async (tx) => {
      await tx.professionalProfile.update({ where: { id }, data: rest });
      await tx.professionalCategory.deleteMany({ where: { professionalId: id } });
      await tx.professionalCategory.createMany({
        data: categoryIds.map((categoryId) => ({ professionalId: id, categoryId })),
      });
      await tx.professionalSpecialization.deleteMany({ where: { professionalId: id } });
      if (specializationIds?.length) {
        await tx.professionalSpecialization.createMany({
          data: specializationIds.map((specializationId) => ({ professionalId: id, specializationId })),
        });
      }
    });

    const updated = await loadOwnedWorker(id, session.userId);
    return NextResponse.json({ worker: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
