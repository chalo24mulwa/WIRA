import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAgency, handleApiError, ApiError } from "@/lib/require-session";
import { hashPassword } from "@/lib/auth";
import { agencyWorkerCreateSchema } from "@/lib/validators";
import { PLAN_DETAILS } from "@/lib/constants";
import { normalizePhone } from "@/lib/phone";

export async function GET() {
  try {
    const session = await requireAgency();
    const workers = await prisma.professionalProfile.findMany({
      where: { agencyOwnerId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        categories: { include: { category: true } },
      },
    });
    return NextResponse.json({ workers });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAgency();
    const body = await request.json().catch(() => null);
    const parsed = agencyWorkerCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const { name, email, phone, county, town, bio, categoryIds } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError("A WIRA account with this email already exists.");
    }

    const phoneNormalized = phone ? normalizePhone(phone) : null;
    if (phone && !phoneNormalized) {
      throw new ApiError("Enter a valid Kenyan phone number for this worker.");
    }
    if (phoneNormalized) {
      const existingPhone = await prisma.user.findUnique({ where: { phoneNormalized } });
      if (existingPhone) {
        throw new ApiError("A WIRA account with this phone number already exists.");
      }
    }

    // Workers added by an agency don't get their own login in this phase —
    // they're a roster entry the agency manages entirely. A real User row
    // still backs them so every existing relation (reviews, bookings,
    // quotations, subscriptions) works unmodified. The agency is vouching
    // for them, so they're marked verified immediately rather than routed
    // through the email/SMS OTP flow nobody can complete on their behalf.
    const passwordHash = await hashPassword(randomUUID());
    const now = new Date();

    const worker = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        phoneNormalized,
        passwordHash,
        role: "PROFESSIONAL",
        accountKind: "INDIVIDUAL",
        county,
        emailVerifiedAt: now,
        phoneVerifiedAt: now,
      },
    });

    await prisma.walletAccount.create({ data: { userId: worker.id, balance: 0 } });

    const profile = await prisma.professionalProfile.create({
      data: {
        userId: worker.id,
        agencyOwnerId: session.userId,
        bio: bio || null,
        county,
        town: town || null,
        categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
      },
    });

    await prisma.subscription.create({
      data: {
        professionalId: profile.id,
        plan: "FREE",
        creditsTotal: PLAN_DETAILS.FREE.credits,
        periodEnd: new Date(Date.now() + 30 * 86_400_000),
      },
    });

    return NextResponse.json({ worker: profile });
  } catch (error) {
    return handleApiError(error);
  }
}
