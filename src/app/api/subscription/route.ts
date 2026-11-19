import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { getSubscriptionSummary } from "@/lib/credits";

export async function GET() {
  try {
    const session = await requireRole("PROFESSIONAL");
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const summary = await getSubscriptionSummary(profile.id);
    return NextResponse.json({ subscription: summary });
  } catch (error) {
    return handleApiError(error);
  }
}
