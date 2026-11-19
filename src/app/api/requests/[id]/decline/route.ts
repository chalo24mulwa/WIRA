import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/requests/[id]/decline">
) {
  try {
    const session = await requireRole("PROFESSIONAL");
    const { id } = await params;

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const serviceRequest = await prisma.serviceRequest.findUnique({ where: { id } });
    if (!serviceRequest) throw new ApiError("Request not found.", 404);

    await prisma.requestDismissal.upsert({
      where: { requestId_professionalId: { requestId: id, professionalId: profile.id } },
      update: {},
      create: { requestId: id, professionalId: profile.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
