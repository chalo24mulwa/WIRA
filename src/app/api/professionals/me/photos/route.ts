import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";

export async function POST(request: Request) {
  try {
    const session = await requireRole("PROFESSIONAL");
    const body = await request.json().catch(() => null);
    if (!body?.url) throw new ApiError("Photo URL is required.");

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const photo = await prisma.portfolioPhoto.create({
      data: { professionalId: profile.id, url: body.url, caption: body.caption || null },
    });

    return NextResponse.json({ photo });
  } catch (error) {
    return handleApiError(error);
  }
}
