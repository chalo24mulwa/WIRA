"use client";

import useSWR from "swr";
import { Briefcase, Building2, Megaphone, ShieldCheck, User, Users, Wallet } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AdminOverview() {
  const { data, isLoading } = useSWR("/api/admin/stats", fetcher);

  if (isLoading || !data) return <p className="text-sm text-navy/50">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <User className="text-orange" size={20} />
          <p className="mt-2 text-xl font-bold text-navy">{data.accounts.individualCustomers}</p>
          <p className="text-xs text-navy/60">Individual customers</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <Building2 className="text-orange" size={20} />
          <p className="mt-2 text-xl font-bold text-navy">{data.accounts.companyCustomers}</p>
          <p className="text-xs text-navy/60">Company customers</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <Briefcase className="text-orange" size={20} />
          <p className="mt-2 text-xl font-bold text-navy">{data.accounts.individualProfessionals}</p>
          <p className="text-xs text-navy/60">Individual professionals</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <Users className="text-orange" size={20} />
          <p className="mt-2 text-xl font-bold text-navy">{data.accounts.companyProfessionals}</p>
          <p className="text-xs text-navy/60">Agencies</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <ShieldCheck className="text-orange" size={22} />
          <p className="mt-3 text-2xl font-bold text-navy">{data.hiring.totalRequests}</p>
          <p className="text-sm text-navy/60">Hiring requests sent</p>
          <p className="mt-1 text-xs text-navy/40">{data.hiring.acceptanceRate}% recipient acceptance rate</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <Wallet className="text-orange" size={22} />
          <p className="mt-3 text-2xl font-bold text-navy">
            KSh {data.wallets.totalBalance.toLocaleString()}
          </p>
          <p className="text-sm text-navy/60">Total WIRA Coins in circulation</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <Building2 className="text-orange" size={22} />
          <p className="mt-3 text-2xl font-bold text-navy">{data.pendingVerifications}</p>
          <p className="text-sm text-navy/60">Companies awaiting verification</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <Megaphone className="text-orange" size={22} />
          <p className="mt-3 text-2xl font-bold text-navy">{data.affiliates.totalReferrals}</p>
          <p className="text-sm text-navy/60">Total affiliate referrals</p>
          <p className="mt-1 text-xs text-navy/40">
            {data.affiliates.totalApproved} active affiliates · {data.affiliates.pendingApplications} applications
            awaiting review
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <Wallet className="text-orange" size={22} />
          <p className="mt-3 text-2xl font-bold text-navy">
            KSh {data.affiliates.commissionLiability.toLocaleString()}
          </p>
          <p className="text-sm text-navy/60">Outstanding commission liability</p>
          <p className="mt-1 text-xs text-navy/40">Pending + approved, not yet paid out</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-navy">Top affiliates</p>
          {data.affiliates.topAffiliates.length === 0 ? (
            <p className="mt-2 text-xs text-navy/40">No referrals yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-navy/70">
              {data.affiliates.topAffiliates.map((a: { name: string; referrals: number }) => (
                <li key={a.name} className="flex justify-between">
                  <span>{a.name}</span>
                  <span className="font-semibold text-navy">{a.referrals}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
