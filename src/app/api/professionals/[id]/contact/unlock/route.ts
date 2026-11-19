import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/require-session";
import { getContactAccess } from "@/lib/contact-access";
import { getPlatformSettings } from "@/lib/platform-settings";
import { debitWalletInTx, InsufficientFundsError } from "@/lib/wallet";
import { notify } from "@/lib/notify";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/professionals/[id]/contact/unlock">
) {
  try {
    const session = await requireRole("CUSTOMER");
    const { id } = await params;

    const professional = await prisma.professionalProfile.findUnique({
      where: { id },
      include: { user: { select: { name: true, phone: true, email: true } } },
    });
    if (!professional) throw new ApiError("Professional not found.", 404);

    // Already active (purchased or granted via an accepted hire) — never
    // charge twice for the same open access window.
    const existingAccess = await getContactAccess(session.userId, id);
    if (existingAccess.unlocked) {
      return NextResponse.json({
        unlocked: true,
        source: existingAccess.source,
        expiresAt: existingAccess.expiresAt,
        phone: professional.user.phone,
        email: professional.user.email,
        alreadyUnlocked: true,
      });
    }

    const settings = await getPlatformSettings();
    const fee = settings.contactUnlockFee;

    try {
      const result = await prisma.$transaction(async (tx) => {
        const expiresAt = new Date(Date.now() + settings.contactAccessDays * 86_400_000);
        const unlock = await tx.contactUnlock.create({
          data: {
            employerId: session.userId,
            professionalId: id,
            source: "PURCHASE",
            expiresAt,
          },
        });

        await debitWalletInTx(tx, {
          userId: session.userId,
          amount: fee,
          type: "CONTACT_UNLOCK",
          relatedContactUnlockId: unlock.id,
        });

        return unlock;
      });

      await notify(
        professional.userId,
        "Your contact was unlocked",
        `${session.name} unlocked your contact details.`,
        undefined,
        "contact_unlocked"
      );

      return NextResponse.json({
        unlocked: true,
        source: "PURCHASE",
        expiresAt: result.expiresAt,
        phone: professional.user.phone,
        email: professional.user.email,
      });
    } catch (error) {
      if (error instanceof InsufficientFundsError) {
        return NextResponse.json(
          {
            error: "INSUFFICIENT_FUNDS",
            required: error.required,
            available: error.available,
          },
          { status: 402 }
        );
      }
      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
