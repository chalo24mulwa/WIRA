import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError, ApiError } from "@/lib/require-session";

export async function GET() {
  try {
    const session = await requireUser();
    const profile = await prisma.companyProfile.findUnique({ where: { userId: session.userId } });
    return NextResponse.json({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requireUser();
    const body = await request.json().catch(() => null);
    const companyName = typeof body?.companyName === "string" ? body.companyName.trim() : "";
    if (companyName.length < 2) throw new ApiError("Enter a valid company name.");

    const registrationNumber = typeof body?.registrationNumber === "string" ? body.registrationNumber.trim() : "";
    const industry = typeof body?.industry === "string" ? body.industry.trim() : "";

    const profile = await prisma.companyProfile.upsert({
      where: { userId: session.userId },
      update: {
        companyName,
        registrationNumber: registrationNumber || null,
        industry: industry || null,
      },
      create: {
        userId: session.userId,
        companyName,
        registrationNumber: registrationNumber || null,
        industry: industry || null,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}
