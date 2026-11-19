import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSubscriptionSummary } from "@/lib/credits";
import { ClipboardList, ListChecks, Mail, Wallet } from "lucide-react";

export default async function ProfessionalOverviewPage() {
  const session = await getSession();
  const profile = await prisma.professionalProfile.findUnique({
    where: { userId: session!.userId },
    include: { categories: true },
  });

  if (!profile) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
        <p className="text-navy/60">Let&apos;s set up your professional profile first.</p>
        <Link
          href="/dashboard/professional/profile"
          className="mt-4 inline-block rounded-full wira-gradient-cta px-5 py-2.5 text-sm font-semibold text-navy hover:opacity-90"
        >
          Complete my profile
        </Link>
      </div>
    );
  }

  const categoryIds = profile.categories.map((c) => c.categoryId);

  const [nearbyCount, activeBookings, pendingInvitations, subscription] = await Promise.all([
    categoryIds.length
      ? prisma.serviceRequest.count({
          where: {
            status: { in: ["OPEN", "QUOTED"] },
            categoryId: { in: categoryIds },
            county: profile.county,
            quotations: { none: { professionalId: profile.id } },
            dismissals: { none: { professionalId: profile.id } },
          },
        })
      : 0,
    prisma.booking.count({
      where: { professionalId: profile.id, status: { in: ["CONFIRMED", "IN_PROGRESS"] } },
    }),
    prisma.hiringRequestRecipient.count({
      where: {
        professionalId: profile.id,
        status: { in: ["PENDING", "VIEWED"] },
        hiringRequest: { status: "SENT" },
      },
    }),
    getSubscriptionSummary(profile.id),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">Welcome, {session?.name.split(" ")[0]}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Link
          href="/dashboard/professional/hiring-invitations"
          className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <Mail className="text-orange" size={22} />
          <p className="mt-3 text-2xl font-bold text-navy">{pendingInvitations}</p>
          <p className="text-sm text-navy/60">Hiring invitations</p>
        </Link>
        <Link
          href="/dashboard/professional/requests"
          className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <ClipboardList className="text-orange" size={22} />
          <p className="mt-3 text-2xl font-bold text-navy">{nearbyCount}</p>
          <p className="text-sm text-navy/60">Nearby open requests</p>
        </Link>
        <Link
          href="/dashboard/professional/bookings"
          className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <ListChecks className="text-orange" size={22} />
          <p className="mt-3 text-2xl font-bold text-navy">{activeBookings}</p>
          <p className="text-sm text-navy/60">Active bookings</p>
        </Link>
        <Link
          href="/dashboard/professional/subscription"
          className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <Wallet className="text-orange" size={22} />
          <p className="mt-3 text-2xl font-bold text-navy">
            {subscription.unlimited
              ? "∞"
              : `${subscription.creditsRemaining}/${subscription.creditsLimit}`}
          </p>
          <p className="text-sm text-navy/60">{subscription.plan} credits remaining</p>
        </Link>
      </div>

      {!profile.isOnline && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You&apos;re currently <strong>offline</strong>. Go online from your profile to start
          receiving nearby service requests.
        </div>
      )}
    </div>
  );
}
