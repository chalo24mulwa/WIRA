import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/admin/accounts/[id]/verify">
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (typeof body?.verified !== "boolean") {
      throw new ApiError("verified must be a boolean.");
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { companyProfile: true, professional: true },
    });
    if (!user) throw new ApiError("Account not found.", 404);

    if (user.companyProfile) {
      await prisma.companyProfile.update({
        where: { userId: id },
        data: { verified: body.verified },
      });
    }
    if (user.professional) {
      await prisma.professionalProfile.update({
        where: { userId: id },
        data: { verified: body.verified },
      });
    }

    return NextResponse.json({ verified: body.verified });
  } catch (error) {
    return handleApiError(error);
  }
}
