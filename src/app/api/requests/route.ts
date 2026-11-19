import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/require-session";
import { serviceRequestSchema } from "@/lib/validators";
import { distanceKm } from "@/lib/geo";
import { notify } from "@/lib/notify";

export async function POST(request: Request) {
  try {
    const session = await requireRole("CUSTOMER");
    const body = await request.json().catch(() => null);
    const parsed = serviceRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const {
      categoryId,
      description,
      county,
      town,
      latitude,
      longitude,
      photoUrls,
      budgetAmount,
      budgetMethod,
    } = parsed.data;

    const category = await prisma.serviceCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        customerId: session.userId,
        categoryId,
        description,
        county,
        town: town || null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        photoUrls: JSON.stringify(photoUrls ?? []),
        budgetAmount: budgetAmount ?? null,
        budgetMethod: budgetAmount ? budgetMethod ?? "PER_JOB" : null,
      },
    });

    // Notify nearby, online professionals who serve this category/county.
    const candidates = await prisma.professionalProfile.findMany({
      where: {
        isOnline: true,
        county,
        categories: { some: { categoryId } },
      },
      select: { id: true, userId: true, latitude: true, longitude: true, serviceRadiusKm: true },
      take: 100,
    });

    const toNotify = candidates.filter((c) => {
      if (latitude == null || longitude == null || c.latitude == null || c.longitude == null) {
        return true;
      }
      return distanceKm(latitude, longitude, c.latitude, c.longitude) <= c.serviceRadiusKm;
    });

    await Promise.all(
      toNotify.map((c) =>
        notify(
          c.userId,
          "New service request nearby",
          `${category.name} job in ${county}`,
          `/dashboard/professional/requests`,
          "new_request"
        )
      )
    );

    return NextResponse.json({ request: serviceRequest });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const session = await requireRole("CUSTOMER");
    const requests = await prisma.serviceRequest.findMany({
      where: { customerId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        quotations: true,
        booking: true,
      },
    });
    return NextResponse.json({ requests });
  } catch (error) {
    return handleApiError(error);
  }
}
