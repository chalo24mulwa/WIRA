import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/require-session";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/saved-professionals/[id]">
) {
  try {
    const session = await requireRole("CUSTOMER");
    const { id } = await params;
    await prisma.savedProfessional.upsert({
      where: { customerId_professionalId: { customerId: session.userId, professionalId: id } },
      update: {},
      create: { customerId: session.userId, professionalId: id },
    });
    return NextResponse.json({ saved: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<"/api/saved-professionals/[id]">
) {
  try {
    const session = await requireRole("CUSTOMER");
    const { id } = await params;
    await prisma.savedProfessional.deleteMany({
      where: { customerId: session.userId, professionalId: id },
    });
    return NextResponse.json({ saved: false });
  } catch (error) {
    return handleApiError(error);
  }
}
