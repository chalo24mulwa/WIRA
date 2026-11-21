"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Check, Copy, Users } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function readOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

type Stats = {
  totalReferrals: number;
  eligibleReferrals: number;
  pendingReferrals: number;
  ineligibleReferrals: number;
  conversionRate: number;
  commissionEarned: number;
  commissionPending: number;
  commissionApproved: number;
  commissionPaid: number;
};

type AffiliateInfo = {
  status: string;
  businessName: string | null;
  referralCode: string | null;
};

type Referral = {
  id: string;
  memberName: string;
  membershipType: string;
  status: string;
  campaign: string | null;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ELIGIBLE: "bg-green-100 text-green-700",
  INELIGIBLE: "bg-navy/5 text-navy/40",
};

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-navy/50">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-orange" : "text-navy"}`}>{value}</p>
    </div>
  );
}

export function AffiliateOverview() {
  const { data } = useSWR<{ affiliate: AffiliateInfo; stats: Stats }>("/api/affiliates/me", fetcher);
  const { data: referralData } = useSWR<{ referrals: Referral[] }>("/api/affiliates/me/referrals", fetcher);
  const [origin] = useState(readOrigin);
  const [copied, setCopied] = useState(false);

  if (!data) return <p className="text-sm text-navy/50">Loading…</p>;
  const { affiliate, stats } = data;
  const referralLink = affiliate.referralCode ? `${origin}/r/${affiliate.referralCode}` : "";

  function copyLink() {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const recentReferrals = (referralData?.referrals ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-navy">Your referral link</p>
        <p className="mt-1 text-xs text-navy/50">
          Share it anywhere — WhatsApp, Facebook, Instagram, TikTok. Every new member who
          registers through it, verifies their account, is attributed to you.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            readOnly
            value={referralLink}
            className="min-w-[220px] flex-1 rounded-lg border border-black/10 bg-navy/[0.03] px-3 py-2 text-sm text-navy outline-none"
          />
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-lg wira-gradient-cta px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:opacity-90"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total members referred" value={stats.totalReferrals} />
        <StatCard label="Verified & eligible" value={stats.eligibleReferrals} />
        <StatCard label="Pending" value={stats.pendingReferrals} />
        <StatCard label="Conversion rate" value={`${stats.conversionRate}%`} />
        <StatCard label="Commission earned" value={`KSh ${stats.commissionEarned.toLocaleString()}`} accent />
        <StatCard label="Pending commission" value={`KSh ${stats.commissionPending.toLocaleString()}`} />
        <StatCard label="Approved (awaiting payout)" value={`KSh ${stats.commissionApproved.toLocaleString()}`} />
        <StatCard label="Paid out" value={`KSh ${stats.commissionPaid.toLocaleString()}`} />
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-navy">Recent referrals</h3>
          <Link href="/dashboard/affiliate/referrals" className="text-xs font-semibold text-orange hover:underline">
            View all
          </Link>
        </div>
        {recentReferrals.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-navy/50">
            <Users size={16} /> No referrals yet — share your link to get started.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {recentReferrals.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-navy/[0.02] px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-navy">{r.memberName}</p>
                  <p className="text-xs text-navy/50">
                    {r.membershipType} · {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
                  {r.status === "ELIGIBLE" ? "Verified" : r.status === "PENDING" ? "Pending" : "Ineligible"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
