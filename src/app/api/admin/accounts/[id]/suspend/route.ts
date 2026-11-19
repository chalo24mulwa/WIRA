import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/admin/accounts/[id]/suspend">
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (typeof body?.suspended !== "boolean") {
      throw new ApiError("suspended must be a boolean.");
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isSuspended: body.suspended },
    });

    return NextResponse.json({ isSuspended: user.isSuspended });
  } catch (error) {
    return handleApiError(error);
  }
}
