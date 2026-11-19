import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/require-session";

export async function GET() {
  try {
    const session = await requireRole("CUSTOMER");
    const saved = await prisma.savedProfessional.findMany({
      where: { customerId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        professional: {
          include: {
            user: { select: { name: true } },
            categories: { include: { category: true } },
          },
        },
      },
    });
    return NextResponse.json({ saved });
  } catch (error) {
    return handleApiError(error);
  }
}
