import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { verifyAccountSchema } from "@/lib/validators";
import { consumeVerificationCode, VerificationError } from "@/lib/verification";
import { markReferralEligible } from "@/lib/affiliate";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = verifyAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { userId, emailCode, phoneCode } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  try {
    if (!user.emailVerifiedAt) {
      if (!emailCode) throw new VerificationError("Enter the email code.");
      await consumeVerificationCode(userId, "EMAIL_VERIFY", emailCode);
    }
    if (!user.phoneVerifiedAt) {
      if (!phoneCode) throw new VerificationError("Enter the phone code.");
      await consumeVerificationCode(userId, "PHONE_VERIFY", phoneCode);
    }
  } catch (error) {
    if (error instanceof VerificationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: user.emailVerifiedAt ?? new Date(), phoneVerifiedAt: user.phoneVerifiedAt ?? new Date() },
  });

  await markReferralEligible(updated.id);

  await setSessionCookie({
    userId: updated.id,
    role: updated.role,
    accountKind: updated.accountKind,
    name: updated.name,
    email: updated.email,
  });

  return NextResponse.json({
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      accountKind: updated.accountKind,
    },
  });
}
