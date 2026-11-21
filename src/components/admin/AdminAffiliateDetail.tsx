"use client";

import { useState } from "react";
import useSWR from "swr";
import { CheckCircle, RotateCcw, Smartphone, Banknote } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Referral = {
  id: string;
  status: "PENDING" | "ELIGIBLE" | "INELIGIBLE";
  createdAt: string;
  eligibleAt: string | null;
  referredUser: {
    name: string;
    email: string;
    role: string;
    accountKind: string;
    emailVerifiedAt: string | null;
    phoneVerifiedAt: string | null;
  };
  campaign: { name: string } | null;
  commission: {
    id: string;
    amount: number;
    status: "PENDING" | "APPROVED" | "PAID" | "REVERSED";
    reversalReason: string | null;
  } | null;
};

type Payout = {
  id: string;
  amount: number;
  method: "MPESA" | "MANUAL";
  receiptNumber: string | null;
  note: string | null;
  createdAt: string;
};

type AffiliateDetail = {
  id: string;
  businessName: string | null;
  referralCode: string | null;
  payoutPhone: string;
  status: string;
  user: { name: string; email: string; phone: string | null; county: string | null; createdAt: string };
  referrals: Referral[];
  payouts: Payout[];
};

const REFERRAL_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ELIGIBLE: "bg-green-100 text-green-700",
  INELIGIBLE: "bg-navy/5 text-navy/40",
};

const COMMISSION_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  REVERSED: "bg-red-100 text-red-700",
};

export function AdminAffiliateDetail({ id }: { id: string }) {
  const { data, mutate, isLoading } = useSWR<{ affiliate: AffiliateDetail }>(
    `/api/admin/affiliates/${id}`,
    fetcher
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);
  const [payoutMethod, setPayoutMethod] = useState<"MPESA" | "MANUAL">("MPESA");
  const [payoutNote, setPayoutNote] = useState("");
  const [payingOut, setPayingOut] = useState(false);
  const [payoutError, setPayoutError] = useState("");

  if (isLoading || !data) return <p className="text-sm text-navy/50">Loading…</p>;
  const affiliate = data.affiliate;

  async function approveCommission(commissionId: string) {
    setBusyId(commissionId);
    await fetch(`/api/admin/commissions/${commissionId}/approve`, { method: "POST" });
    await mutate();
    setBusyId(null);
  }

  async function confirmReverse(commissionId: string) {
    setBusyId(commissionId);
    await fetch(`/api/admin/commissions/${commissionId}/reverse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reversalReason }),
    });
    setReversingId(null);
    setReversalReason("");
    await mutate();
    setBusyId(null);
  }

  function toggleCommission(commissionId: string) {
    setSelectedCommissionIds((prev) =>
      prev.includes(commissionId) ? prev.filter((c) => c !== commissionId) : [...prev, commissionId]
    );
  }

  const approvedCommissions = affiliate.referrals
    .map((r) => r.commission)
    .filter((c): c is NonNullable<typeof c> => Boolean(c) && c!.status === "APPROVED");
  const payoutAmount = approvedCommissions
    .filter((c) => selectedCommissionIds.includes(c.id))
    .reduce((sum, c) => sum + c.amount, 0);

  async function recordPayout() {
    setPayoutError("");
    if (selectedCommissionIds.length === 0) {
      setPayoutError("Select at least one approved commission.");
      return;
    }
    setPayingOut(true);
    try {
      const res = await fetch(`/api/admin/affiliates/${id}/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: payoutMethod,
          commissionIds: selectedCommissionIds,
          note: payoutNote,
          clientReference: crypto.randomUUID(),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Could not record payout.");
      setSelectedCommissionIds([]);
      setPayoutNote("");
      await mutate();
    } catch (err) {
      setPayoutError(err instanceof Error ? err.message : "Could not record payout.");
    } finally {
      setPayingOut(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-navy/40">Affiliate</p>
          <p className="font-semibold text-navy">{affiliate.businessName ?? affiliate.user.name}</p>
          <p className="text-sm text-navy/60">{affiliate.user.email}</p>
          <p className="text-sm text-navy/60">{affiliate.user.phone}</p>
          <p className="text-sm text-navy/60">{affiliate.user.county}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-navy/40">Referral code</p>
          <p className="font-mono text-sm font-semibold text-navy">{affiliate.referralCode ?? "Not yet approved"}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-navy/40">Payout number</p>
          <p className="text-sm text-navy/70">{affiliate.payoutPhone}</p>
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-navy">Referred members &amp; commissions</h3>
        {affiliate.referrals.length === 0 ? (
          <p className="text-sm text-navy/50">No referrals yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-navy/40">
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliate.referrals.map((r) => (
                  <tr key={r.id} className="border-b border-black/5 last:border-0 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{r.referredUser.name}</p>
                      <p className="text-xs text-navy/40">{r.referredUser.email}</p>
                      {r.campaign && <p className="text-xs text-orange">{r.campaign.name}</p>}
                    </td>
                    <td className="px-4 py-3 text-navy/70">
                      {r.referredUser.role === "PROFESSIONAL" ? "Professional" : "Customer"} ·{" "}
                      {r.referredUser.accountKind === "COMPANY" ? "Company" : "Individual"}
                    </td>
                    <td className="px-4 py-3 text-navy/70">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${REFERRAL_STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.commission ? (
                        <>
                          <span className="font-semibold text-navy">KSh {r.commission.amount.toLocaleString()}</span>{" "}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${COMMISSION_STATUS_STYLES[r.commission.status]}`}
                          >
                            {r.commission.status}
                          </span>
                          {r.commission.reversalReason && (
                            <p className="mt-1 text-[11px] text-red-600">{r.commission.reversalReason}</p>
                          )}
                        </>
                      ) : (
                        <span className="text-navy/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.commission?.status === "PENDING" && (
                        <button
                          onClick={() => approveCommission(r.commission!.id)}
                          disabled={busyId === r.commission!.id}
                          className="flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
                        >
                          <CheckCircle size={13} /> Approve
                        </button>
                      )}
                      {(r.commission?.status === "PENDING" || r.commission?.status === "APPROVED") && (
                        <div className="mt-1">
                          {reversingId === r.commission!.id ? (
                            <div className="flex flex-col gap-1">
                              <input
                                value={reversalReason}
                                onChange={(e) => setReversalReason(e.target.value)}
                                placeholder="Reason…"
                                className="w-40 rounded-lg border border-black/10 px-2 py-1 text-xs outline-none focus:border-orange"
                              />
                              <button
                                onClick={() => confirmReverse(r.commission!.id)}
                                disabled={busyId === r.commission!.id}
                                className="rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                              >
                                Confirm reverse
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReversingId(r.commission!.id)}
                              className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                            >
                              <RotateCcw size={12} /> Reverse
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-navy">Record a payout</h3>
        {approvedCommissions.length === 0 ? (
          <p className="mt-2 text-sm text-navy/50">No approved commissions awaiting payout.</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap gap-2">
              {approvedCommissions.map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                    selectedCommissionIds.includes(c.id) ? "border-orange bg-orange/10 text-orange" : "border-black/10 text-navy/70"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCommissionIds.includes(c.id)}
                    onChange={() => toggleCommission(c.id)}
                    className="h-3.5 w-3.5 accent-orange"
                  />
                  KSh {c.amount.toLocaleString()}
                </label>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-navy/70">Method</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as "MPESA" | "MANUAL")}
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
                >
                  <option value="MPESA">M-Pesa</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>
              <div className="min-w-[180px] flex-1">
                <label className="mb-1 block text-xs font-medium text-navy/70">Note (optional)</label>
                <input
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
                />
              </div>
              <button
                onClick={recordPayout}
                disabled={payingOut || selectedCommissionIds.length === 0}
                className="flex items-center gap-1.5 rounded-lg wira-gradient-cta px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
              >
                {payoutMethod === "MPESA" ? <Smartphone size={15} /> : <Banknote size={15} />}
                {payingOut ? "Recording…" : `Pay KSh ${payoutAmount.toLocaleString()}`}
              </button>
            </div>
            {payoutError && <p className="mt-2 text-sm text-red-600">{payoutError}</p>}
          </>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-navy">Payout history</h3>
        {affiliate.payouts.length === 0 ? (
          <p className="text-sm text-navy/50">No payouts recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {affiliate.payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-black/5 bg-white px-4 py-3 text-sm shadow-sm">
                <div>
                  <span className="font-semibold text-navy">KSh {p.amount.toLocaleString()}</span>{" "}
                  <span className="text-navy/50">
                    via {p.method === "MPESA" ? "M-Pesa" : "Manual"} · {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {p.receiptNumber && <span className="font-mono text-xs text-navy/40">{p.receiptNumber}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
