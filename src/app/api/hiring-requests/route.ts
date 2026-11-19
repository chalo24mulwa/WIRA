import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { hiringRequestSchema } from "@/lib/validators";
import { getPlatformSettings, hiringFeeFor } from "@/lib/platform-settings";
import { getOrCreateWallet } from "@/lib/wallet";
import { notify } from "@/lib/notify";

async function dispatchInvitations(hiringRequestId: string, jobTitle: string, employerLabel: string) {
  const recipients = await prisma.hiringRequestRecipient.findMany({
    where: { hiringRequestId },
    include: { professional: { select: { userId: true } } },
  });
  await Promise.all(
    recipients.map((r) =>
      notify(
        r.professional.userId,
        "New hiring invitation",
        `${employerLabel} invited you for "${jobTitle}"`,
        "/dashboard/professional/hiring-invitations",
        "hiring_invitation"
      )
    )
  );
}

export async function POST(request: Request) {
  try {
    const session = await requireRole("CUSTOMER");
    const body = await request.json().catch(() => null);
    const parsed = hiringRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const data = parsed.data;

    const professionals = await prisma.professionalProfile.findMany({
      where: { id: { in: data.professionalIds } },
      select: { id: true },
    });
    if (professionals.length === 0) {
      throw new ApiError("Select at least one valid professional.");
    }

    const [settings, wallet, user] = await Promise.all([
      getPlatformSettings(),
      getOrCreateWallet(session.userId),
      prisma.user.findUniqueOrThrow({ where: { id: session.userId }, include: { companyProfile: true } }),
    ]);
    const fee = hiringFeeFor(user.accountKind, settings);
    const canSendNow = wallet.balance >= fee;

    const hiringRequest = await prisma.hiringRequest.create({
      data: {
        employerId: session.userId,
        employmentType: data.employmentType,
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
        numberRequired: data.numberRequired,
        workLocationCounty: data.workLocationCounty,
        workLocationTown: data.workLocationTown || null,
        salaryOrPayment: data.salaryOrPayment,
        workingHours: data.workingHours || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        contractDurationDays: data.contractDurationDays ?? null,
        requiredQualifications: data.requiredQualifications || null,
        additionalInstructions: data.additionalInstructions || null,
        status: canSendNow ? "SENT" : "PENDING_FUNDING",
        feeAmount: fee,
        recipients: {
          create: professionals.map((p) => ({ professionalId: p.id })),
        },
      },
    });

    if (canSendNow) {
      const employerLabel = user.companyProfile?.companyName ?? user.name;
      await dispatchInvitations(hiringRequest.id, data.jobTitle, employerLabel);
    }

    return NextResponse.json({
      hiringRequest,
      requiresFunding: !canSendNow,
      feeAmount: fee,
      walletBalance: wallet.balance,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET() {
  try {
    const session = await requireRole("CUSTOMER");
    const hiringRequests = await prisma.hiringRequest.findMany({
      where: { employerId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        recipients: {
          include: { professional: { include: { user: { select: { name: true } } } } },
        },
      },
    });
    return NextResponse.json({ hiringRequests });
  } catch (error) {
    return handleApiError(error);
  }
}
