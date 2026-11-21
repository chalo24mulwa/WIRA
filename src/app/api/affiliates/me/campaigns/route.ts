import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAffiliate, handleApiError } from "@/lib/require-session";

export async function GET() {
  try {
    await requireAffiliate();
    const campaigns = await prisma.campaign.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, description: true },
    });
    return NextResponse.json({ campaigns });
  } catch (error) {
    return handleApiError(error);
  }
}
