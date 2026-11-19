import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateWallet } from "@/lib/wallet";
import { ClipboardList, MapPin, Plus, UserCheck, Wallet as WalletIcon } from "lucide-react";

export default async function CustomerOverviewPage() {
  const session = await getSession();
  const isCompany = session!.accountKind === "COMPANY";

  const [requests, wallet, recipients] = await Promise.all([
    prisma.serviceRequest.findMany({
      where: { customerId: session!.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { category: true, quotations: true },
    }),
    getOrCreateWallet(session!.userId),
    prisma.hiringRequestRecipient.findMany({
      where: { hiringRequest: { employerId: session!.userId } },
      select: { status: true },
    }),
  ]);

  const hired = recipients.filter((r) => r.status === "ACCEPTED").length;
  const pendingOffers = recipients.filter((r) => r.status === "PENDING" || r.status === "VIEWED").length;
  const activeServiceRequests = requests.filter((r) => !["COMPLETED", "CANCELLED"].includes(r.status)).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">
          {isCompany ? "Company Dashboard" : `Welcome, ${session?.name.split(" ")[0]}`}
        </h1>
        <Link
          href="/dashboard/customer/requests/new"
          className="flex items-center gap-1.5 rounded-full wira-gradient-cta px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:opacity-90"
        >
          <Plus size={16} />
          New Request
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Link href="/dashboard/customer/wallet" className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <WalletIcon className="text-orange" size={20} />
          <p className="mt-2 text-xl font-bold text-navy">KSh {wallet.balance.toLocaleString()}</p>
          <p className="text-xs text-navy/60">{isCompany ? "Company wallet balance" : "Wallet balance"}</p>
        </Link>
        <Link href="/dashboard/customer/hiring-requests" className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <UserCheck className="text-orange" size={20} />
          <p className="mt-2 text-xl font-bold text-navy">{hired}</p>
          <p className="text-xs text-navy/60">Professionals hired</p>
        </Link>
        <Link href="/dashboard/customer/hiring-requests" className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <ClipboardList className="text-orange" size={20} />
          <p className="mt-2 text-xl font-bold text-navy">{pendingOffers}</p>
          <p className="text-xs text-navy/60">Pending offers</p>
        </Link>
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <ClipboardList className="text-orange" size={20} />
          <p className="mt-2 text-xl font-bold text-navy">{activeServiceRequests}</p>
          <p className="text-xs text-navy/60">Active service requests</p>
        </div>
      </div>

      <h2 className="mb-3 mt-8 font-semibold text-navy">My Service Requests</h2>

      {requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
          <ClipboardList className="mx-auto mb-3 text-navy/30" size={32} />
          <p className="text-navy/60">You haven&apos;t submitted any service requests yet.</p>
          <Link
            href="/dashboard/customer/requests/new"
            className="mt-4 inline-block rounded-full wira-gradient-cta px-5 py-2.5 text-sm font-semibold text-navy hover:opacity-90"
          >
            Submit your first request
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Link
              key={r.id}
              href={`/dashboard/customer/requests/${r.id}`}
              className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-semibold text-navy">{r.category.name}</p>
                <p className="flex items-center gap-1 text-xs text-navy/50">
                  <MapPin size={12} />
                  {r.town ? `${r.town}, ` : ""}
                  {r.county}
                </p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-navy/70">
                  {r.status.replace("_", " ")}
                </span>
                <p className="mt-1 text-xs text-navy/50">{r.quotations.length} quotation(s)</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
