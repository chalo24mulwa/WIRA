import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { debitWalletInTx } from "@/lib/wallet";
import { notify } from "@/lib/notify";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/hiring-requests/recipients/[recipientId]/respond">
) {
  try {
    const session = await requireRole("PROFESSIONAL");
    const { recipientId } = await params;
    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (action !== "ACCEPT" && action !== "DECLINE") {
      throw new ApiError("Invalid action.");
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!profile) throw new ApiError("Professional profile not found.", 404);

    const recipient = await prisma.hiringRequestRecipient.findUnique({
      where: { id: recipientId },
      include: { hiringRequest: true },
    });
    if (!recipient || recipient.professionalId !== profile.id) {
      throw new ApiError("Hiring invitation not found.", 404);
    }
    if (recipient.hiringRequest.status !== "SENT") {
      throw new ApiError("This hiring request is no longer open.");
    }

    if (action === "DECLINE") {
      const result = await prisma.hiringRequestRecipient.updateMany({
        where: { id: recipientId, status: { in: ["PENDING", "VIEWED"] } },
        data: { status: "DECLINED", respondedAt: new Date() },
      });
      if (result.count === 0) {
        throw new ApiError("You have already responded to this invitation.");
      }
      return NextResponse.json({ status: "DECLINED" });
    }

    // ACCEPT — this is the one-time-charge path.
    const outcome = await prisma.$transaction(async (tx) => {
      const claimed = await tx.hiringRequestRecipient.updateMany({
        where: { id: recipientId, status: { in: ["PENDING", "VIEWED"] } },
        data: { status: "ACCEPTED", respondedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new ApiError("You have already responded to this invitation.");
      }

      // Database-enforced, race-safe one-time charge: this UPDATE only
      // affects a row if chargeProcessed is still false, and only one
      // concurrent transaction can win it under SQLite's serialized writes.
      const wonCharge = await tx.hiringRequest.updateMany({
        where: { id: recipient.hiringRequestId, chargeProcessed: false },
        data: { chargeProcessed: true },
      });

      let charged = false;
      if (wonCharge.count === 1) {
        charged = true;
        // The balance was validated when the request was sent; if it has
        // since dropped (e.g. other unlocks), the contact has already been
        // promised to this professional — the debt is recorded rather than
        // blocking the acceptance, but it is still charged exactly once.
        await debitWalletInTx(tx, {
          userId: recipient.hiringRequest.employerId,
          amount: recipient.hiringRequest.feeAmount,
          type: "HIRING_FEE",
          relatedHiringRequestId: recipient.hiringRequestId,
          allowNegative: true,
        });
      }

      return { charged };
    });

    await notify(
      recipient.hiringRequest.employerId,
      "Hiring offer accepted",
      outcome.charged
        ? `A professional accepted "${recipient.hiringRequest.jobTitle}". KSh ${recipient.hiringRequest.feeAmount} was charged and their contact is now unlocked.`
        : `Another professional accepted "${recipient.hiringRequest.jobTitle}". Their contact is now unlocked — no additional charge.`,
      `/dashboard/customer/hiring-requests/${recipient.hiringRequestId}`,
      "hiring_accepted"
    );

    return NextResponse.json({ status: "ACCEPTED", charged: outcome.charged });
  } catch (error) {
    return handleApiError(error);
  }
}
