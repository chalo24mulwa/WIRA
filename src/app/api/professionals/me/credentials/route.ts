import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";

export async function POST(request: Request) {
  try {
    const session = await requireRole("PROFESSIONAL");
    const body = await request.json().catch(() => null);
    if (!body?.title || !body?.fileUrl) {
      throw new ApiError("Title and file are required.");
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const credential = await prisma.credential.create({
      data: { professionalId: profile.id, title: body.title, fileUrl: body.fileUrl },
    });

    return NextResponse.json({ credential });
  } catch (error) {
    return handleApiError(error);
  }
}
