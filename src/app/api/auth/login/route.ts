import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  if (user.isSuspended) {
    return NextResponse.json(
      { error: "This account has been suspended. Contact WIRA support." },
      { status: 403 }
    );
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
