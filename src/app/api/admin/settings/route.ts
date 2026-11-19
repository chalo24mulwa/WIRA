import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { getPlatformSettings } from "@/lib/platform-settings";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const settings = await getPlatformSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    await requireRole("ADMIN");
    const body = await request.json().catch(() => null);

    const fields = [
      "individualHiringFee",
      "companyHiringFee",
      "contactUnlockFee",
      "contactAccessDays",
    ] as const;

    const data: Record<string, number> = {};
    for (const field of fields) {
      const value = body?.[field];
      if (value === undefined) continue;
      if (typeof value !== "number" || value < 0 || !Number.isFinite(value)) {
        throw new ApiError(`${field} must be a non-negative number.`);
      }
      data[field] = Math.round(value);
    }

    await getPlatformSettings(); // ensures the singleton row exists
    const updated = await prisma.platformSettings.update({
      where: { id: "singleton" },
      data,
    });

    return NextResponse.json({ settings: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
