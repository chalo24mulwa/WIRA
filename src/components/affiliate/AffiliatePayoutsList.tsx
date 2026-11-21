"use client";

import useSWR from "swr";
import { Smartphone, Banknote } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Payout = {
  id: string;
  amount: number;
  method: "MPESA" | "MANUAL";
  receiptNumber: string | null;
  note: string | null;
  commissionCount: number;
  createdAt: string;
};

export function AffiliatePayoutsList() {
  const { data, isLoading } = useSWR<{ payouts: Payout[] }>("/api/affiliates/me/payouts", fetcher);

  if (isLoading) return <p className="text-sm text-navy/50">Loading…</p>;
  const payouts = data?.payouts ?? [];

  if (payouts.length === 0) {
    return <p className="text-sm text-navy/50">No payouts recorded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {payouts.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700">
              {p.method === "MPESA" ? <Smartphone size={16} /> : <Banknote size={16} />}
            </span>
            <div>
              <p className="font-semibold text-navy">KSh {p.amount.toLocaleString()}</p>
              <p className="text-xs text-navy/50">
                {p.method === "MPESA" ? "M-Pesa" : "Manual"} · {p.commissionCount} commission
                {p.commissionCount === 1 ? "" : "s"} · {new Date(p.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {p.receiptNumber && (
            <span className="font-mono text-xs text-navy/50">{p.receiptNumber}</span>
          )}
        </div>
      ))}
    </div>
  );
}
