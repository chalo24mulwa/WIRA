import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/require-session";

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    const users = await prisma.user.findMany({
      where: role ? { role: role as "CUSTOMER" | "PROFESSIONAL" | "ADMIN" } : { role: { not: "ADMIN" } },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        companyProfile: true,
        professional: { select: { id: true, verified: true, agencyOwnerId: true } },
        wallet: { select: { balance: true } },
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
