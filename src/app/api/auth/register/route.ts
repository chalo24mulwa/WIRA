import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validators";
import { PLAN_DETAILS } from "@/lib/constants";

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

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      role,
      accountKind,
      county: county || null,
    },
  });

  await prisma.walletAccount.create({ data: { userId: user.id, balance: 0 } });

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

  await setSessionCookie({
    userId: user.id,
    role: user.role,
    accountKind: user.accountKind,
    name: user.name,
    email: user.email,
  });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, accountKind: user.accountKind },
  });
}
