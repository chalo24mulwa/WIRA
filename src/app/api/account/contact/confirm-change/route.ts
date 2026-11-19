import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError, ApiError } from "@/lib/require-session";
import { confirmContactChangeSchema } from "@/lib/validators";
import { consumeVerificationCode, VerificationError } from "@/lib/verification";

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = confirmContactChangeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const { purpose, code } = parsed.data;

    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });

    try {
      await consumeVerificationCode(user.id, purpose, code);
    } catch (error) {
      if (error instanceof VerificationError) {
        throw new ApiError(error.message);
      }
      throw error;
    }

    if (purpose === "EMAIL_CHANGE") {
      if (!user.pendingEmail) throw new ApiError("No pending email change found.");
      const taken = await prisma.user.findUnique({ where: { email: user.pendingEmail } });
      if (taken && taken.id !== user.id) {
        throw new ApiError("That email address was just taken by another account. Try a different one.");
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { email: user.pendingEmail, pendingEmail: null },
      });
    } else {
      if (!user.pendingPhoneNormalized) throw new ApiError("No pending phone change found.");
      const taken = await prisma.user.findUnique({
        where: { phoneNormalized: user.pendingPhoneNormalized },
      });
      if (taken && taken.id !== user.id) {
        throw new ApiError("That phone number was just taken by another account. Try a different one.");
      }
      await prisma.user.update({
        where: { id: user.id },
        data: {
          phone: user.pendingPhone,
          phoneNormalized: user.pendingPhoneNormalized,
          pendingPhone: null,
          pendingPhoneNormalized: null,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
