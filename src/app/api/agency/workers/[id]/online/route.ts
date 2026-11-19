import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAgency, handleApiError, ApiError } from "@/lib/require-session";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/agency/workers/[id]/online">
) {
  try {
    const session = await requireAgency();
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (typeof body?.isOnline !== "boolean") {
      throw new ApiError("isOnline must be a boolean.");
    }

    const worker = await prisma.professionalProfile.findUnique({ where: { id } });
    if (!worker || worker.agencyOwnerId !== session.userId) {
      throw new ApiError("Worker not found.", 404);
    }

    const updated = await prisma.professionalProfile.update({
      where: { id },
      data: { isOnline: body.isOnline },
    });

    return NextResponse.json({ isOnline: updated.isOnline });
  } catch (error) {
    return handleApiError(error);
  }
}
