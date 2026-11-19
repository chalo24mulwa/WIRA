"use client";

import { useState } from "react";
import useSWR from "swr";
import { BadgeCheck, Ban, CheckCircle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Account = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "PROFESSIONAL";
  accountKind: "INDIVIDUAL" | "COMPANY";
  isSuspended: boolean;
  createdAt: string;
  companyProfile: { companyName: string; verified: boolean } | null;
  professional: { verified: boolean; agencyOwnerId: string | null } | null;
  wallet: { balance: number } | null;
};

export function AccountsTable() {
  const [filter, setFilter] = useState("");
  const { data, mutate, isLoading } = useSWR<{ users: Account[] }>(
    `/api/admin/accounts${filter ? `?role=${filter}` : ""}`,
    fetcher
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleSuspend(id: string, current: boolean) {
    setBusyId(id);
    await fetch(`/api/admin/accounts/${id}/suspend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: !current }),
    });
    await mutate();
    setBusyId(null);
  }

  async function toggleVerify(id: string, current: boolean) {
    setBusyId(id);
    await fetch(`/api/admin/accounts/${id}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verified: !current }),
    });
    await mutate();
    setBusyId(null);
  }

  const users = data?.users ?? [];

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {["", "CUSTOMER", "PROFESSIONAL"].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === r ? "border-orange bg-orange/10 text-orange" : "border-black/10 text-navy/60"
            }`}
          >
            {r || "All"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-navy/50">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-navy/40">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const verified = u.companyProfile?.verified || u.professional?.verified;
                const canVerify = Boolean(u.companyProfile || u.professional);
                return (
                  <tr key={u.id} className="border-b border-black/5 last:border-0">
                    <td className="px-4 py-3">
                      <p className="flex items-center gap-1 font-medium text-navy">
                        {u.companyProfile?.companyName ?? u.name}
                        {verified && <BadgeCheck size={14} className="text-orange" />}
                      </p>
                      <p className="text-xs text-navy/40">{u.email}</p>
                    </td>
                    <td className="px-4 py-3 text-navy/70">
                      {u.role === "PROFESSIONAL"
                        ? u.accountKind === "COMPANY"
                          ? "Agency"
                          : "Individual Pro"
                        : u.accountKind === "COMPANY"
                        ? "Company"
                        : "Individual"}
                    </td>
                    <td className="px-4 py-3 text-navy/70">
                      KSh {(u.wallet?.balance ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          u.isSuspended ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {u.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {canVerify && (
                          <button
                            onClick={() => toggleVerify(u.id, Boolean(verified))}
                            disabled={busyId === u.id}
                            className="flex items-center gap-1 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5 disabled:opacity-60"
                          >
                            <CheckCircle size={13} />
                            {verified ? "Unverify" : "Verify"}
                          </button>
                        )}
                        <button
                          onClick={() => toggleSuspend(u.id, u.isSuspended)}
                          disabled={busyId === u.id}
                          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:opacity-60 ${
                            u.isSuspended
                              ? "border-green-200 text-green-700 hover:bg-green-50"
                              : "border-red-200 text-red-600 hover:bg-red-50"
                          }`}
                        >
                          <Ban size={13} />
                          {u.isSuspended ? "Reinstate" : "Suspend"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
