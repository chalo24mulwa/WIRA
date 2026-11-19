import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, handleApiError } from "@/lib/require-session";
import { getOrCreateWallet } from "@/lib/wallet";

export async function GET() {
  try {
    const session = await requireUser();
    const wallet = await getOrCreateWallet(session.userId);
    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    const totalSpent = transactions
      .filter((t) => t.type !== "FUNDING" && t.status === "SUCCESS")
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      balance: wallet.balance,
      totalSpent,
      transactions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
