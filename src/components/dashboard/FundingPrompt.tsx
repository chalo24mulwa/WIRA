"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export function FundingPrompt({
  label,
  requiredAmount,
  availableAmount,
  onFunded,
  onCancel,
}: {
  label: string;
  requiredAmount: number;
  availableAmount: number;
  onFunded: () => void | Promise<void>;
  onCancel?: () => void;
}) {
  const shortfall = Math.max(requiredAmount - availableAmount, 0);
  const [amount, setAmount] = useState(String(shortfall));
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState("");

  async function handleFund() {
    setError("");
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setFunding(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const res = await fetch("/api/wallet/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, clientReference: crypto.randomUUID() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Funding failed.");
      await onFunded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Funding failed.");
    } finally {
      setFunding(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold text-amber-900">
            Your WIRA Coins balance is insufficient to {label}.
          </p>
          <div className="mt-2 grid grid-cols-3 gap-3 text-sm text-amber-900/80">
            <div>
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Required</p>
              <p className="font-semibold">KSh {requiredAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Available</p>
              <p className="font-semibold">KSh {availableAmount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-amber-700/70">Needed</p>
              <p className="font-semibold">KSh {shortfall.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-amber-900/70">
            Amount to fund (KSh)
          </label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-32 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange"
          />
        </div>
        <button
          onClick={handleFund}
          disabled={funding}
          className="flex items-center gap-2 rounded-lg wira-gradient-cta px-5 py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          {funding && <Loader2 size={15} className="animate-spin" />}
          {funding ? "Processing…" : "Fund Account & Continue"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={funding}
            className="rounded-lg border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100"
          >
            Cancel
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
