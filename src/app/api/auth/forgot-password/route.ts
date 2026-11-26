import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validators";
import { issueVerificationCode } from "@/lib/verification";

/**
 * Always responds the same way regardless of whether the email belongs to
 * an account — this is a public, unauthenticated endpoint, so confirming or
 * denying an email's existence here would let anyone enumerate registered
 * users. For the same reason, unlike every other verification flow in this
 * app, the dev-mode code is never echoed back in the response: the
 * "requester" and the "owner of that inbox" aren't provably the same person
 * on this endpoint. The code still reaches the server console via the usual
 * dev-mode delivery, which is enough to test the flow locally.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user && !user.isSuspended) {
    try {
      await issueVerificationCode(user.id, "PASSWORD_RESET", user.email);
    } catch {
      // Swallow resend-cooldown or any other issuance error — the response
      // must look identical either way.
    }
  }

  return NextResponse.json({ ok: true });
}
