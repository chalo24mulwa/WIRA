"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ELIGIBLE: "bg-green-100 text-green-700",
  INELIGIBLE: "bg-navy/5 text-navy/40",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending verification",
  ELIGIBLE: "Verified & eligible",
  INELIGIBLE: "Ineligible",
};

type Referral = {
  id: string;
  memberName: string;
  membershipType: string;
  status: string;
  campaign: string | null;
  createdAt: string;
  eligibleAt: string | null;
  commission: { amount: number; status: string } | null;
};

export function AffiliateReferralsList() {
  const { data, isLoading } = useSWR<{ referrals: Referral[] }>("/api/affiliates/me/referrals", fetcher);

  if (isLoading) return <p className="text-sm text-navy/50">Loading…</p>;
  const referrals = data?.referrals ?? [];

  if (referrals.length === 0) {
    return (
      <p className="text-sm text-navy/50">
        No referrals yet. Share your referral link from the dashboard overview to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-navy/40">
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Campaign</th>
            <th className="px-4 py-3">Registered</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Commission</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((r) => (
            <tr key={r.id} className="border-b border-black/5 last:border-0">
              <td className="px-4 py-3 font-medium text-navy">{r.memberName}</td>
              <td className="px-4 py-3 text-navy/70">{r.membershipType}</td>
              <td className="px-4 py-3 text-navy/70">{r.campaign ?? "—"}</td>
              <td className="px-4 py-3 text-navy/70">{new Date(r.createdAt).toLocaleDateString()}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-navy/70">
                {r.commission ? `KSh ${r.commission.amount.toLocaleString()}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
