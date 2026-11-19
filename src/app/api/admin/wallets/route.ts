import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/require-session";

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    const wallets = await prisma.walletAccount.findMany({
      where: q
        ? { user: { OR: [{ name: { contains: q } }, { email: { contains: q } }] } }
        : undefined,
      orderBy: { balance: "desc" },
      take: 200,
      include: {
        user: { select: { name: true, email: true, role: true, accountKind: true } },
        transactions: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });

    return NextResponse.json({ wallets });
  } catch (error) {
    return handleApiError(error);
  }
}
