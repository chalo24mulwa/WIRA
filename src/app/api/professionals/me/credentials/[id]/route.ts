import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/professionals/me/credentials/[id]">
) {
  try {
    const session = await requireRole("PROFESSIONAL");
    const { id } = await params;

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const credential = await prisma.credential.findUnique({ where: { id } });
    if (!credential || credential.professionalId !== profile.id) {
      throw new ApiError("Credential not found.", 404);
    }

    await prisma.credential.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
