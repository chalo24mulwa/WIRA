"use client";

import { useState } from "react";
import useSWR from "swr";
import { ArrowDownCircle, ArrowUpCircle, Loader2, Wallet } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const QUICK_AMOUNTS = [100, 150, 500, 1000, 2000];

const TYPE_LABEL: Record<string, string> = {
  FUNDING: "Wallet top-up",
  HIRING_FEE: "Hiring request fee",
  CONTACT_UNLOCK: "Contact unlock",
  REFUND: "Refund",
  ADJUSTMENT: "Adjustment",
};

export function WalletPanel() {
  const { data, mutate, isLoading } = useSWR("/api/wallet", fetcher);
  const [amount, setAmount] = useState("500");
  const [phone, setPhone] = useState("");
  const [funding, setFunding] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleFund(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setFunding(true);
    setMessage("Sending STK push to your phone…");
    try {
      // Simulated STK Push delay — real integration would wait on Safaricom's
      // callback and only credit once that webhook verifies payment.
      await new Promise((resolve) => setTimeout(resolve, 900));
      const res = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, clientReference: crypto.randomUUID() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Funding failed.");
      setMessage(`KSh ${value.toLocaleString()} added to your wallet.`);
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Funding failed.");
      setMessage("");
    } finally {
      setFunding(false);
    }
  }

  const balance = data?.balance ?? 0;
  const totalSpent = data?.totalSpent ?? 0;
  const transactions = data?.transactions ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-navy/60">
            <Wallet size={16} className="text-orange" />
            <span className="text-sm font-medium">Available WIRA Coins</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-navy">
            {isLoading ? "…" : `KSh ${balance.toLocaleString()}`}
          </p>
          <p className="mt-1 text-xs text-navy/40">1 WIRA Coin = KSh 1</p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-navy/60">
            <ArrowUpCircle size={16} className="text-orange" />
            <span className="text-sm font-medium">Total spent</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-navy">
            {isLoading ? "…" : `KSh ${totalSpent.toLocaleString()}`}
          </p>
          <p className="mt-1 text-xs text-navy/40">Hiring fees + contact unlocks</p>
        </div>
      </div>

      <form
        onSubmit={handleFund}
        className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
      >
        <h2 className="font-semibold text-navy">Fund your wallet</h2>
        <p className="mt-1 text-sm text-navy/60">
          Prepared for M-Pesa STK Push — payments are verified before crediting. This
          environment simulates that confirmation.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((v) => (
            <button
              type="button"
              key={v}
              onClick={() => setAmount(String(v))}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                amount === String(v)
                  ? "border-orange bg-orange/10 text-orange"
                  : "border-black/10 text-navy/70 hover:border-navy/30"
              }`}
            >
              KSh {v.toLocaleString()}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-navy/70">Amount (KSh)</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-navy/70">
              M-Pesa phone number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07xx xxx xxx"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-3 text-sm text-green-600">{message}</p>}

        <button
          type="submit"
          disabled={funding}
          className="mt-4 flex items-center gap-2 rounded-xl wira-gradient-cta px-6 py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          {funding && <Loader2 size={16} className="animate-spin" />}
          {funding ? "Processing…" : "Fund via M-Pesa"}
        </button>
      </form>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-navy">Transaction history</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-navy/50">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map(
              (t: {
                id: string;
                type: string;
                amount: number;
                newBalance: number;
                createdAt: string;
              }) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between border-b border-black/5 py-2.5 last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    {t.type === "FUNDING" ? (
                      <ArrowUpCircle size={16} className="text-green-600" />
                    ) : (
                      <ArrowDownCircle size={16} className="text-orange" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-navy">
                        {TYPE_LABEL[t.type] ?? t.type}
                      </p>
                      <p className="text-xs text-navy/40">
                        {new Date(t.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        t.type === "FUNDING" ? "text-green-600" : "text-navy"
                      }`}
                    >
                      {t.type === "FUNDING" ? "+" : "-"}KSh {t.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-navy/40">Bal: KSh {t.newBalance.toLocaleString()}</p>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
