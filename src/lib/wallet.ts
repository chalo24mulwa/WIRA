import { prisma } from "@/lib/prisma";
import type { Prisma, WalletTransactionType } from "@prisma/client";

export class InsufficientFundsError extends Error {
  required: number;
  available: number;
  constructor(required: number, available: number) {
    super("INSUFFICIENT_FUNDS");
    this.required = required;
    this.available = available;
  }
}

export async function getOrCreateWallet(userId: string) {
  const existing = await prisma.walletAccount.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.walletAccount.create({ data: { userId, balance: 0 } });
}

/**
 * Credits a wallet. `reference` is an idempotency key — if a transaction
 * with the same reference already exists (e.g. a retried request after a
 * network blip), the existing result is returned instead of crediting
 * twice. This is the hook point for a real M-Pesa STK Push webhook later:
 * the webhook would call this once payment is verified server-side,
 * never trusting a frontend "payment succeeded" message.
 */
export async function fundWallet(userId: string, amount: number, reference: string) {
  if (amount <= 0) throw new Error("Funding amount must be positive.");

  const existingTx = await prisma.walletTransaction.findUnique({ where: { reference } });
  if (existingTx) {
    const wallet = await prisma.walletAccount.findUniqueOrThrow({ where: { id: existingTx.walletId } });
    return { wallet, transaction: existingTx };
  }

  return prisma.$transaction(async (tx) => {
    const wallet = await getWalletForUpdate(tx, userId);
    const previousBalance = wallet.balance;
    const newBalance = previousBalance + amount;

    const updated = await tx.walletAccount.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "FUNDING",
        amount,
        previousBalance,
        newBalance,
        reference,
        status: "SUCCESS",
      },
    });

    return { wallet: updated, transaction };
  });
}

async function getWalletForUpdate(tx: Prisma.TransactionClient, userId: string) {
  const existing = await tx.walletAccount.findUnique({ where: { userId } });
  if (existing) return existing;
  return tx.walletAccount.create({ data: { userId, balance: 0 } });
}

/**
 * Debits a wallet inside an already-open transaction client. Throws
 * InsufficientFundsError if the balance can't cover it — callers decide
 * whether that's fatal (e.g. contact unlock) or tolerated (the rare
 * hiring-fee-at-acceptance-time shortfall, where the contact has already
 * been promised to the professional and the debt is simply recorded).
 */
export async function debitWalletInTx(
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    amount: number;
    type: WalletTransactionType;
    relatedHiringRequestId?: string;
    relatedContactUnlockId?: string;
    allowNegative?: boolean;
  }
) {
  const wallet = await getWalletForUpdate(tx, params.userId);

  if (!params.allowNegative && wallet.balance < params.amount) {
    throw new InsufficientFundsError(params.amount, wallet.balance);
  }

  const previousBalance = wallet.balance;
  const newBalance = previousBalance - params.amount;

  const updated = await tx.walletAccount.update({
    where: { id: wallet.id },
    data: { balance: newBalance },
  });

  const transaction = await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: params.type,
      amount: params.amount,
      previousBalance,
      newBalance,
      relatedHiringRequestId: params.relatedHiringRequestId,
      relatedContactUnlockId: params.relatedContactUnlockId,
      status: "SUCCESS",
    },
  });

  return { wallet: updated, transaction };
}
