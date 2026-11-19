import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";

export async function GET() {
  try {
    const session = await requireRole("PROFESSIONAL");
    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const invitations = await prisma.hiringRequestRecipient.findMany({
      where: {
        professionalId: profile.id,
        hiringRequest: { status: { in: ["SENT", "CLOSED", "CANCELLED"] } },
      },
      orderBy: { createdAt: "desc" },
      include: {
        hiringRequest: {
          include: {
            employer: { select: { name: true, accountKind: true, companyProfile: true } },
          },
        },
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    return handleApiError(error);
  }
}
