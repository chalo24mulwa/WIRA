import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";

export async function POST(request: Request) {
  try {
    const session = await requireRole("PROFESSIONAL");
    const body = await request.json().catch(() => null);
    if (typeof body?.isOnline !== "boolean") {
      throw new ApiError("isOnline must be a boolean.");
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const updated = await prisma.professionalProfile.update({
      where: { id: profile.id },
      data: { isOnline: body.isOnline },
    });

    return NextResponse.json({ isOnline: updated.isOnline });
  } catch (error) {
    return handleApiError(error);
  }
}
