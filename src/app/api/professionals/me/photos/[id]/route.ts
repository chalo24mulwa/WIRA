import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/professionals/me/photos/[id]">
) {
  try {
    const session = await requireRole("PROFESSIONAL");
    const { id } = await params;

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const photo = await prisma.portfolioPhoto.findUnique({ where: { id } });
    if (!photo || photo.professionalId !== profile.id) {
      throw new ApiError("Photo not found.", 404);
    }

    await prisma.portfolioPhoto.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
