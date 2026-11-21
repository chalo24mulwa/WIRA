import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { affiliateApplySchema } from "@/lib/validators";
import { normalizePhone } from "@/lib/phone";
import { issueVerificationCode } from "@/lib/verification";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = affiliateApplySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, businessName, accountKind, email, phone, payoutPhone, county, password } = parsed.data;
  const phoneNormalized = normalizePhone(phone);

  if (accountKind === "COMPANY" && (!businessName || businessName.trim().length < 2)) {
    return NextResponse.json(
      { error: "Enter your business or agency name." },
      { status: 400 }
    );
  }

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
      role: "AFFILIATE",
      accountKind,
      county,
    },
  });

  await prisma.walletAccount.create({ data: { userId: user.id, balance: 0 } });

  if (accountKind === "COMPANY") {
    await prisma.companyProfile.create({
      data: { userId: user.id, companyName: businessName!.trim() },
    });
  }

  await prisma.affiliate.create({
    data: {
      userId: user.id,
      businessName: accountKind === "COMPANY" ? businessName!.trim() : null,
      payoutPhone,
      status: "PENDING",
    },
  });

  const emailCode = await issueVerificationCode(user.id, "EMAIL_VERIFY", email);
  const phoneCode = await issueVerificationCode(user.id, "PHONE_VERIFY", phoneNormalized!);

  return NextResponse.json({
    requiresVerification: true,
    userId: user.id,
    email: user.email,
    phone: user.phone,
    devEmailCode: emailCode.devCode,
    devPhoneCode: phoneCode.devCode,
  });
}
