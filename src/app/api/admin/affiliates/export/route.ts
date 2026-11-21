import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/require-session";

function csvEscape(value: string | number) {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export async function GET() {
  try {
    await requireRole("ADMIN");

    const affiliates = await prisma.affiliate.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        _count: { select: { referrals: true } },
        referrals: { where: { status: "ELIGIBLE" }, select: { id: true } },
        commissions: { select: { amount: true, status: true } },
      },
    });

    const header = [
      "Name",
      "Business Name",
      "Email",
      "Phone",
      "Status",
      "Referral Code",
      "Total Referrals",
      "Verified Referrals",
      "Commission Pending (KSh)",
      "Commission Approved (KSh)",
      "Commission Paid (KSh)",
    ];

    const rows = affiliates.map((a) => {
      const totals = a.commissions.reduce(
        (acc, c) => {
          acc[c.status] = (acc[c.status] ?? 0) + c.amount;
          return acc;
        },
        {} as Record<string, number>
      );
      return [
        a.user.name,
        a.businessName ?? "",
        a.user.email,
        a.user.phone ?? "",
        a.status,
        a.referralCode ?? "",
        a._count.referrals,
        a.referrals.length,
        totals.PENDING ?? 0,
        totals.APPROVED ?? 0,
        totals.PAID ?? 0,
      ];
    });

    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="wira-affiliate-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
