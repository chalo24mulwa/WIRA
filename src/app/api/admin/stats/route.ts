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
      totalAffiliates,
      pendingAffiliateApplications,
      totalReferrals,
      commissionLiabilityAgg,
      topAffiliates,
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
      prisma.affiliate.count({ where: { status: "APPROVED" } }),
      prisma.affiliate.count({ where: { status: "PENDING" } }),
      prisma.referral.count(),
      prisma.commission.aggregate({
        where: { status: { in: ["PENDING", "APPROVED"] } },
        _sum: { amount: true },
      }),
      prisma.affiliate.findMany({
        where: { status: "APPROVED" },
        orderBy: { referrals: { _count: "desc" } },
        take: 3,
        select: {
          businessName: true,
          user: { select: { name: true } },
          _count: { select: { referrals: true } },
        },
      }),
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
      affiliates: {
        totalApproved: totalAffiliates,
        pendingApplications: pendingAffiliateApplications,
        totalReferrals,
        commissionLiability: commissionLiabilityAgg._sum.amount ?? 0,
        topAffiliates: topAffiliates.map((a) => ({
          name: a.businessName ?? a.user.name,
          referrals: a._count.referrals,
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
