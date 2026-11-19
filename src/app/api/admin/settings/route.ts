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

    const numericFields = [
      "individualHiringFee",
      "companyHiringFee",
      "contactUnlockFee",
      "contactAccessDays",
      "standardPrice",
      "standardPromoPrice",
      "professionalPrice",
      "professionalPromoPrice",
      "businessPrice",
      "businessPromoPrice",
    ] as const;

    const data: Record<string, number | boolean | string> = {};
    for (const field of numericFields) {
      const value = body?.[field];
      if (value === undefined) continue;
      if (typeof value !== "number" || value < 0 || !Number.isFinite(value)) {
        throw new ApiError(`${field} must be a non-negative number.`);
      }
      data[field] = Math.round(value);
    }

    if (body?.subscriptionPromoActive !== undefined) {
      if (typeof body.subscriptionPromoActive !== "boolean") {
        throw new ApiError("subscriptionPromoActive must be true or false.");
      }
      data.subscriptionPromoActive = body.subscriptionPromoActive;
    }

    if (body?.subscriptionPromoLabel !== undefined) {
      if (typeof body.subscriptionPromoLabel !== "string" || body.subscriptionPromoLabel.length > 80) {
        throw new ApiError("subscriptionPromoLabel must be a short string.");
      }
      data.subscriptionPromoLabel = body.subscriptionPromoLabel;
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
