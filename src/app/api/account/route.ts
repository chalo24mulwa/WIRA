import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError } from "@/lib/require-session";

export async function GET() {
  try {
    const session = await requireUser();
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: {
        name: true,
        email: true,
        phone: true,
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        pendingEmail: true,
        pendingPhone: true,
      },
    });
    return NextResponse.json({ account: user });
  } catch (error) {
    return handleApiError(error);
  }
}
