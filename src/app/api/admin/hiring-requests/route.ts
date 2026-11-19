import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/require-session";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const hiringRequests = await prisma.hiringRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        employer: { select: { name: true, accountKind: true, companyProfile: { select: { companyName: true } } } },
        recipients: { select: { status: true } },
      },
    });
    return NextResponse.json({ hiringRequests });
  } catch (error) {
    return handleApiError(error);
  }
}
