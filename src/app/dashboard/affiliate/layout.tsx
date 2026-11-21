import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Clock, ShieldAlert, XCircle } from "lucide-react";
import { InlineAffiliateApply } from "@/components/affiliate/InlineAffiliateApply";

export default async function AffiliateDashboardLayout({ children }: LayoutProps<"/dashboard/affiliate">) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "ADMIN") redirect("/admin");

  const affiliate = await prisma.affiliate.findUnique({ where: { userId: session.userId } });

  if (!affiliate) {
    // A Customer or Professional landing here for the first time: offer to
    // attach an affiliate profile to this same account instead of sending
    // them through a whole separate signup. An AFFILIATE-role account
    // always has its Affiliate row created at application time, so it
    // should never reach this branch — but if it somehow did, the form
    // below still degrades gracefully into the same apply flow.
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { phone: true } });
    return <InlineAffiliateApply accountPhone={user?.phone ?? null} />;
  }

  if (affiliate.status === "APPROVED") {
    return <>{children}</>;
  }

  const copy = {
    PENDING: {
      icon: Clock,
      title: "Your application is under review",
      body: "Thanks for applying to the WIRA Affiliate Program. Your dashboard will unlock as soon as our team approves your application — usually within a short while.",
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    REJECTED: {
      icon: XCircle,
      title: "Your application wasn't approved",
      body: affiliate.rejectionReason || "Contact support@wira.co.ke if you'd like to know more or re-apply.",
      color: "text-red-600 bg-red-50 border-red-200",
    },
    SUSPENDED: {
      icon: ShieldAlert,
      title: "Your affiliate account is suspended",
      body: "Your affiliate account has been suspended. Contact support@wira.co.ke for details.",
      color: "text-red-600 bg-red-50 border-red-200",
    },
  }[affiliate.status];

  const Icon = copy.icon;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className={`rounded-2xl border p-8 ${copy.color}`}>
        <Icon size={36} className="mx-auto" />
        <h1 className="mt-4 text-lg font-bold text-navy">{copy.title}</h1>
        <p className="mt-2 text-sm text-navy/70">{copy.body}</p>
      </div>
    </div>
  );
}
