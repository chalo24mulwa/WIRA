import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { getOrCreateWallet } from "@/lib/wallet";
import { notify } from "@/lib/notify";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/hiring-requests/[id]/resume">
) {
  try {
    const session = await requireRole("CUSTOMER");
    const { id } = await params;

    const hiringRequest = await prisma.hiringRequest.findUnique({
      where: { id },
      include: {
        recipients: { include: { professional: { select: { userId: true } } } },
      },
    });
    if (!hiringRequest || hiringRequest.employerId !== session.userId) {
      throw new ApiError("Hiring request not found.", 404);
    }
    if (hiringRequest.status !== "PENDING_FUNDING") {
      return NextResponse.json({ hiringRequest, alreadyResolved: true });
    }

    const wallet = await getOrCreateWallet(session.userId);
    if (wallet.balance < hiringRequest.feeAmount) {
      throw new ApiError(
        `Your WIRA Coins balance is still insufficient. Required KSh ${hiringRequest.feeAmount}, available KSh ${wallet.balance}.`
      );
    }

    const updated = await prisma.hiringRequest.update({
      where: { id },
      data: { status: "SENT" },
    });

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: session.userId },
      include: { companyProfile: true },
    });
    const employerLabel = user.companyProfile?.companyName ?? user.name;

    await Promise.all(
      hiringRequest.recipients.map((r) =>
        notify(
          r.professional.userId,
          "New hiring invitation",
          `${employerLabel} invited you for "${hiringRequest.jobTitle}"`,
          "/dashboard/professional/hiring-invitations",
          "hiring_invitation"
        )
      )
    );

    await notify(
      session.userId,
      "Hiring request sent",
      `Your hiring request for "${hiringRequest.jobTitle}" has been dispatched.`,
      `/dashboard/customer/hiring-requests`,
      "hiring_request_sent"
    );

    return NextResponse.json({ hiringRequest: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
