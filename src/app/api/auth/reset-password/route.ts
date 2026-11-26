import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { resetPasswordSchema } from "@/lib/validators";
import { consumeVerificationCode, VerificationError } from "@/lib/verification";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email, code, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  // Deliberately the same error whether the email doesn't exist or the code
  // is wrong — never confirm which one it was.
  const genericError = "That code is invalid or has expired.";
  if (!user) {
    return NextResponse.json({ error: genericError }, { status: 400 });
  }

  try {
    await consumeVerificationCode(user.id, "PASSWORD_RESET", code);
  } catch (error) {
    if (error instanceof VerificationError) {
      return NextResponse.json({ error: genericError }, { status: 400 });
    }
    throw error;
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return NextResponse.json({ ok: true });
}
