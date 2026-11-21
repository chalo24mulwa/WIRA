"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Ban, CheckCircle, Download, RotateCcw, XCircle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Affiliate = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  businessName: string | null;
  referralCode: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  referralCount: number;
  commissionPending: number;
  commissionApproved: number;
  commissionPaid: number;
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-navy/10 text-navy/60",
};

export function AdminAffiliatesTable() {
  const [filter, setFilter] = useState("");
  const { data, mutate, isLoading } = useSWR<{ affiliates: Affiliate[] }>(
    `/api/admin/affiliates${filter ? `?status=${filter}` : ""}`,
    fetcher
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function act(id: string, action: "approve" | "suspend" | "reactivate") {
    setBusyId(id);
    await fetch(`/api/admin/affiliates/${id}/${action}`, { method: "POST" });
    await mutate();
    setBusyId(null);
  }

  async function confirmReject(id: string) {
    setBusyId(id);
    await fetch(`/api/admin/affiliates/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setRejectingId(null);
    setReason("");
    await mutate();
    setBusyId(null);
  }

  const affiliates = data?.affiliates ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {["", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filter === s ? "border-orange bg-orange/10 text-orange" : "border-black/10 text-navy/60"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- downloads a file, not a page navigation */}
        <a
          href="/api/admin/affiliates/export"
          className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-1.5 text-sm font-medium text-navy hover:bg-navy/5"
        >
          <Download size={14} /> Export CSV
        </a>
      </div>

      {isLoading ? (
        <p className="text-sm text-navy/50">Loading…</p>
      ) : affiliates.length === 0 ? (
        <p className="text-sm text-navy/50">No affiliates found.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-navy/40">
                <th className="px-4 py-3">Affiliate</th>
                <th className="px-4 py-3">Referral code</th>
                <th className="px-4 py-3">Referrals</th>
                <th className="px-4 py-3">Commission (pending / approved / paid)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((a) => (
                <Fragment key={a.id}>
                  <tr className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/affiliates/${a.id}`} className="font-medium text-navy hover:underline">
                        {a.businessName ?? a.name}
                      </Link>
                      <p className="text-xs text-navy/40">{a.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-navy/70">{a.referralCode ?? "—"}</td>
                    <td className="px-4 py-3 text-navy/70">{a.referralCount}</td>
                    <td className="px-4 py-3 text-navy/70">
                      KSh {a.commissionPending.toLocaleString()} / KSh {a.commissionApproved.toLocaleString()} / KSh{" "}
                      {a.commissionPaid.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[a.status]}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {a.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => act(a.id, "approve")}
                              disabled={busyId === a.id}
                              className="flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60"
                            >
                              <CheckCircle size={13} /> Approve
                            </button>
                            <button
                              onClick={() => setRejectingId(rejectingId === a.id ? null : a.id)}
                              disabled={busyId === a.id}
                              className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                            >
                              <XCircle size={13} /> Reject
                            </button>
                          </>
                        )}
                        {a.status === "APPROVED" && (
                          <button
                            onClick={() => act(a.id, "suspend")}
                            disabled={busyId === a.id}
                            className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            <Ban size={13} /> Suspend
                          </button>
                        )}
                        {a.status === "SUSPENDED" && (
                          <button
                            onClick={() => act(a.id, "reactivate")}
                            disabled={busyId === a.id}
                            className="flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60"
                          >
                            <RotateCcw size={13} /> Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {rejectingId === a.id && (
                    <tr className="border-b border-black/5">
                      <td colSpan={6} className="bg-navy/[0.02] px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Reason for rejection (shown to the applicant)…"
                            className="min-w-[240px] flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
                          />
                          <button
                            onClick={() => confirmReject(a.id)}
                            disabled={busyId === a.id}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            Confirm reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
