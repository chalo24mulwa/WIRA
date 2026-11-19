import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resendCodeSchema } from "@/lib/validators";
import { issueVerificationCode } from "@/lib/verification";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resendCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { userId, purpose } = parsed.data;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const alreadyVerified = purpose === "EMAIL_VERIFY" ? user.emailVerifiedAt : user.phoneVerifiedAt;
  if (alreadyVerified) {
    return NextResponse.json({ error: "This is already verified." }, { status: 400 });
  }

  const target = purpose === "EMAIL_VERIFY" ? user.email : user.phoneNormalized;
  if (!target) {
    return NextResponse.json({ error: "No contact value on file to verify." }, { status: 400 });
  }

  try {
    const { devCode } = await issueVerificationCode(userId, purpose, target);
    return NextResponse.json({ sent: true, devCode });
  } catch (error) {
    if (error instanceof Error && error.message === "RESEND_TOO_SOON") {
      return NextResponse.json(
        { error: "Please wait a few seconds before requesting another code." },
        { status: 429 }
      );
    }
    throw error;
  }
}
