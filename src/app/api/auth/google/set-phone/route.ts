import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, ApiError } from "@/lib/require-session";
import { googleSetPhoneSchema } from "@/lib/validators";
import { normalizePhone } from "@/lib/phone";
import { issueVerificationCode } from "@/lib/verification";

/**
 * Collects the phone number for an account that was just created via Google
 * (which never provides one). No session exists yet, so this is scoped
 * tightly instead of trusting the userId alone: only an account that has a
 * googleId and no phoneVerifiedAt — i.e. is actually mid-onboarding — can be
 * touched here, which rules out using this to tamper with an unrelated,
 * already-active account.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = googleSetPhoneSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
    if (!user || !user.googleId || user.phoneVerifiedAt) {
      throw new ApiError("This account can't be set up here.", 403);
    }

    const phoneNormalized = normalizePhone(parsed.data.phone);
    if (!phoneNormalized) throw new ApiError("Enter a valid Kenyan phone number.");

    const existingPhone = await prisma.user.findUnique({ where: { phoneNormalized } });
    if (existingPhone && existingPhone.id !== user.id) {
      throw new ApiError("An account with this phone number already exists.", 409);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { phone: parsed.data.phone, phoneNormalized },
    });

    const { devCode } = await issueVerificationCode(user.id, "PHONE_VERIFY", phoneNormalized);

    return NextResponse.json({ ok: true, devPhoneCode: devCode });
  } catch (error) {
    return handleApiError(error);
  }
}
