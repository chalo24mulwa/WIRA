import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { campaignSchema } from "@/lib/validators";
import { logAdminAction } from "@/lib/audit-log";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { referrals: true } } },
    });
    return NextResponse.json({
      campaigns: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        isActive: c.isActive,
        commissionOverride: c.commissionOverride,
        referralCount: c._count.referrals,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole("ADMIN");
    const body = await request.json().catch(() => null);
    const parsed = campaignSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const existing = await prisma.campaign.findUnique({ where: { slug: parsed.data.slug } });
    if (existing) throw new ApiError("A campaign with this slug already exists.");

    const campaign = await prisma.campaign.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        commissionOverride: parsed.data.commissionOverride ?? null,
      },
    });

    await logAdminAction(session.userId, "CAMPAIGN_CREATED", "Campaign", campaign.id, { name: campaign.name });

    return NextResponse.json({ campaign });
  } catch (error) {
    return handleApiError(error);
  }
}
