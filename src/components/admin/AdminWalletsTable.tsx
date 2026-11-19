"use client";

import { useState } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AdminWalletsTable() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useSWR(`/api/admin/wallets${q ? `?q=${encodeURIComponent(q)}` : ""}`, fetcher);

  const wallets = data?.wallets ?? [];

  return (
    <div>
      <div className="relative mb-4 max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-xl border border-black/10 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange"
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-navy/50">Loading…</p>
      ) : wallets.length === 0 ? (
        <p className="text-sm text-navy/50">No wallets found.</p>
      ) : (
        <div className="space-y-3">
          {wallets.map(
            (w: {
              id: string;
              balance: number;
              user: { name: string; email: string; role: string; accountKind: string };
              transactions: { id: string; type: string; amount: number; createdAt: string }[];
            }) => (
              <div key={w.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-navy">{w.user.name}</p>
                    <p className="text-xs text-navy/40">
                      {w.user.email} · {w.user.role} · {w.user.accountKind}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-navy">KSh {w.balance.toLocaleString()}</p>
                </div>
                {w.transactions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 border-t border-black/5 pt-2">
                    {w.transactions.map((t) => (
                      <span key={t.id} className="rounded-full bg-navy/5 px-2.5 py-1 text-xs text-navy/60">
                        {t.type} KSh {t.amount}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
