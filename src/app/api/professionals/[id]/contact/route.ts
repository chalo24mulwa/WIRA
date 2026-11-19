import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError, ApiError } from "@/lib/require-session";
import { getContactAccess } from "@/lib/contact-access";
import { getPlatformSettings } from "@/lib/platform-settings";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/professionals/[id]/contact">
) {
  try {
    const session = await requireUser();
    const { id } = await params;

    const settings = await getPlatformSettings();
    const access = await getContactAccess(session.userId, id);

    if (!access.unlocked) {
      return NextResponse.json({ unlocked: false, unlockFee: settings.contactUnlockFee });
    }

    const professional = await prisma.professionalProfile.findUnique({
      where: { id },
      include: { user: { select: { name: true, phone: true, email: true } } },
    });
    if (!professional) throw new ApiError("Professional not found.", 404);

    return NextResponse.json({
      unlocked: true,
      source: access.source,
      expiresAt: access.expiresAt,
      phone: professional.user.phone,
      email: professional.user.email,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
