import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser, handleApiError, ApiError } from "@/lib/require-session";
import { fundWallet } from "@/lib/wallet";

const MAX_FUNDING_AMOUNT = 500_000;

/**
 * Wallet funding is simulated here (no M-Pesa credentials are available in
 * this environment) but the shape mirrors a real STK Push integration: the
 * client never decides "payment succeeded" — this route plays the role of
 * the payment confirmation step, and `fundWallet` is idempotent on
 * `clientReference` so the webhook equivalent can safely retry.
 */
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const body = await request.json().catch(() => null);
    const amount = Number(body?.amount);
    const clientReference = typeof body?.clientReference === "string" ? body.clientReference : randomUUID();

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError("Enter a valid amount to fund.");
    }
    if (amount > MAX_FUNDING_AMOUNT) {
      throw new ApiError(`Maximum top-up is KSh ${MAX_FUNDING_AMOUNT.toLocaleString()}.`);
    }

    const { wallet, transaction } = await fundWallet(session.userId, Math.round(amount), clientReference);

    return NextResponse.json({
      balance: wallet.balance,
      transaction,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
