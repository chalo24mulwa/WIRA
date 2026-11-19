import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { VerificationPurpose } from "@prisma/client";

const CODE_TTL_MINUTES = 15;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Dev-mode delivery: this project has no SMTP/SMS provider configured, so
 * "sending" a code just logs it server-side and returns it to the caller.
 * Swap these two functions for a real provider (e.g. Resend for email,
 * Africa's Talking/Twilio for SMS) without touching any calling code —
 * callers only ever see { sent: true }.
 */
async function deliverEmailCode(email: string, code: string) {
  console.log(`[dev-mode email] Verification code for ${email}: ${code}`);
}

async function deliverSmsCode(phone: string, code: string) {
  console.log(`[dev-mode sms] Verification code for ${phone}: ${code}`);
}

const isDev = process.env.NODE_ENV !== "production";

/**
 * Creates a fresh verification code for the given purpose, invalidating any
 * still-pending code of the same purpose for the same user first (so a user
 * who requests several codes can only ever use the latest one).
 */
export async function issueVerificationCode(
  userId: string,
  purpose: VerificationPurpose,
  target: string
): Promise<{ devCode?: string }> {
  const recent = await prisma.verificationToken.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (recent && recent.createdAt.getTime() > Date.now() - RESEND_COOLDOWN_SECONDS * 1000) {
    throw new Error("RESEND_TOO_SOON");
  }

  await prisma.verificationToken.updateMany({
    where: { userId, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);

  await prisma.verificationToken.create({
    data: {
      userId,
      purpose,
      target,
      codeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
    },
  });

  const channel = purpose === "PHONE_VERIFY" || purpose === "PHONE_CHANGE" ? "sms" : "email";
  if (channel === "sms") {
    await deliverSmsCode(target, code);
  } else {
    await deliverEmailCode(target, code);
  }

  return isDev ? { devCode: code } : {};
}

export class VerificationError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export async function consumeVerificationCode(
  userId: string,
  purpose: VerificationPurpose,
  submittedCode: string
) {
  const token = await prisma.verificationToken.findFirst({
    where: { userId, purpose, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!token) throw new VerificationError("No pending verification code. Request a new one.");
  if (token.expiresAt.getTime() < Date.now()) {
    throw new VerificationError("This code has expired. Request a new one.");
  }
  if (token.attempts >= MAX_ATTEMPTS) {
    throw new VerificationError("Too many attempts. Request a new code.");
  }

  const valid = await bcrypt.compare(submittedCode, token.codeHash);
  if (!valid) {
    await prisma.verificationToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    throw new VerificationError("Incorrect code.");
  }

  await prisma.verificationToken.update({
    where: { id: token.id },
    data: { consumedAt: new Date() },
  });

  return token;
}
