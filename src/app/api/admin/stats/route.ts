import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/require-session";

export async function GET() {
  try {
    await requireRole("ADMIN");

    const [
      individualCustomers,
      companyCustomers,
      individualProfessionals,
      companyProfessionals,
      hiringRequests,
      acceptedRecipients,
      totalRecipients,
      walletAgg,
      pendingVerifications,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER", accountKind: "INDIVIDUAL" } }),
      prisma.user.count({ where: { role: "CUSTOMER", accountKind: "COMPANY" } }),
      prisma.user.count({ where: { role: "PROFESSIONAL", accountKind: "INDIVIDUAL" } }),
      prisma.user.count({ where: { role: "PROFESSIONAL", accountKind: "COMPANY" } }),
      prisma.hiringRequest.count(),
      prisma.hiringRequestRecipient.count({ where: { status: "ACCEPTED" } }),
      prisma.hiringRequestRecipient.count(),
      prisma.walletAccount.aggregate({ _sum: { balance: true } }),
      prisma.companyProfile.count({ where: { verified: false } }),
    ]);

    return NextResponse.json({
      accounts: { individualCustomers, companyCustomers, individualProfessionals, companyProfessionals },
      hiring: {
        totalRequests: hiringRequests,
        acceptedRecipients,
        totalRecipients,
        acceptanceRate: totalRecipients ? Math.round((acceptedRecipients / totalRecipients) * 100) : 0,
      },
      wallets: { totalBalance: walletAgg._sum.balance ?? 0 },
      pendingVerifications,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
