import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { PLAN_DETAILS } from "@/lib/constants";
import { normalizePhone } from "@/lib/phone";
import { issueVerificationCode } from "@/lib/verification";
import { attributeReferralIfPresent } from "@/lib/affiliate";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, phone, password, role, accountKind, companyName, county } = parsed.data;
  const phoneNormalized = normalizePhone(phone);

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const existingPhone = phoneNormalized
    ? await prisma.user.findUnique({ where: { phoneNormalized } })
    : null;
  if (existingPhone) {
    return NextResponse.json(
      { error: "An account with this phone number already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      phoneNormalized,
      passwordHash,
      role,
      accountKind,
      county: county || null,
    },
  });

  await prisma.walletAccount.create({ data: { userId: user.id, balance: 0 } });

  await attributeReferralIfPresent({
    newUserId: user.id,
    newUserEmail: user.email,
    newUserPhoneNormalized: user.phoneNormalized,
  });

  if (accountKind === "COMPANY") {
    await prisma.companyProfile.create({
      data: { userId: user.id, companyName: companyName!.trim() },
    });
  }

  if (role === "PROFESSIONAL") {
    const professional = await prisma.professionalProfile.create({
      data: {
        userId: user.id,
        county: county || "Nairobi",
      },
    });
    await prisma.subscription.create({
      data: {
        professionalId: professional.id,
        plan: "FREE",
        creditsTotal: PLAN_DETAILS.FREE.credits,
        periodEnd: new Date(Date.now() + 30 * 86_400_000),
      },
    });
  }

  const emailCode = await issueVerificationCode(user.id, "EMAIL_VERIFY", email);
  const phoneCode = await issueVerificationCode(user.id, "PHONE_VERIFY", phoneNormalized!);

  // No session cookie yet — the account is created but inactive until both
  // the email and phone verification codes are confirmed via /api/auth/verify.
  return NextResponse.json({
    requiresVerification: true,
    userId: user.id,
    email: user.email,
    phone: user.phone,
    devEmailCode: emailCode.devCode,
    devPhoneCode: phoneCode.devCode,
  });
}
