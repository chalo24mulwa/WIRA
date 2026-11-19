import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError, ApiError } from "@/lib/require-session";
import { requestContactChangeSchema } from "@/lib/validators";
import { normalizePhone } from "@/lib/phone";
import { issueVerificationCode } from "@/lib/verification";

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = requestContactChangeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }
    const { email, phone } = parsed.data;
    if (!email && !phone) {
      throw new ApiError("Provide a new email or phone number.");
    }

    const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
    const result: { emailDevCode?: string; phoneDevCode?: string } = {};

    if (email) {
      if (email === user.email) throw new ApiError("That is already your email address.");
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) throw new ApiError("That email address is already in use.");

      await prisma.user.update({ where: { id: user.id }, data: { pendingEmail: email } });
      const { devCode } = await issueVerificationCode(user.id, "EMAIL_CHANGE", email);
      result.emailDevCode = devCode;
    }

    if (phone) {
      const normalized = normalizePhone(phone);
      if (!normalized) throw new ApiError("Enter a valid Kenyan phone number.");
      if (normalized === user.phoneNormalized) {
        throw new ApiError("That is already your phone number.");
      }
      const taken = await prisma.user.findUnique({ where: { phoneNormalized: normalized } });
      if (taken) throw new ApiError("That phone number is already in use.");

      await prisma.user.update({
        where: { id: user.id },
        data: { pendingPhone: phone, pendingPhoneNormalized: normalized },
      });
      const { devCode } = await issueVerificationCode(user.id, "PHONE_CHANGE", normalized);
      result.phoneDevCode = devCode;
    }

    return NextResponse.json({ sent: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
