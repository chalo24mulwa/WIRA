"use client";

import { useState } from "react";
import useSWR from "swr";
import { MapPin } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type RequestItem = {
  id: string;
  description: string;
  county: string;
  town: string | null;
  distanceKm: number | null;
  category: { name: string };
  customer: { name: string };
  budgetAmount: number | null;
  budgetMethod: "PER_HOUR" | "PER_JOB" | null;
};

function BudgetHint({ amount, method }: { amount: number | null; method: string | null }) {
  if (!amount) return null;
  return (
    <p className="mt-1 text-xs font-medium text-navy/50">
      Customer&apos;s budget: KSh {amount.toLocaleString()}
      {method === "PER_HOUR" ? " / hour" : " total (estimate)"}
    </p>
  );
}

function QuoteForm({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const [amount, setAmount] = useState("");
  const [pricingMethod, setPricingMethod] = useState<"PER_HOUR" | "PER_JOB">("PER_JOB");
  const [estimatedCompletion, setEstimatedCompletion] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), pricingMethod, estimatedCompletion, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit quotation.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit quotation.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-navy/[0.03] p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-navy/70">Amount (KSh)</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-32 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy/70">Pricing</label>
          <select
            value={pricingMethod}
            onChange={(e) => setPricingMethod(e.target.value as "PER_HOUR" | "PER_JOB")}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
          >
            <option value="PER_JOB">Per job</option>
            <option value="PER_HOUR">Per hour</option>
          </select>
        </div>
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-xs font-medium text-navy/70">
            Estimated completion (optional)
          </label>
          <input
            value={estimatedCompletion}
            onChange={(e) => setEstimatedCompletion(e.target.value)}
            placeholder="e.g. 2 hours, same day"
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
          />
        </div>
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
        placeholder="Additional comments or conditions (optional)…"
      />
      <button
        onClick={submit}
        disabled={submitting}
        className="rounded-lg wira-gradient-cta px-4 py-2 text-sm font-semibold text-navy hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send quote"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function NearbyRequestsList() {
  const { data, mutate, isLoading } = useSWR("/api/requests/nearby", fetcher, {
    refreshInterval: 20000,
  });
  const [quotingId, setQuotingId] = useState<string | null>(null);

  if (isLoading || !data) return <p className="text-sm text-navy/50">Loading…</p>;

  const requests: RequestItem[] = data.requests ?? [];

  if (requests.length === 0) {
    return (
      <p className="text-sm text-navy/50">
        No open requests near you right now. Make sure you&apos;re online and your categories
        and county are set correctly in your profile.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-navy">{r.category.name}</p>
              <p className="text-sm text-navy/60">{r.description}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-navy/50">
                <MapPin size={12} />
                {r.town ? `${r.town}, ` : ""}
                {r.county}
                {typeof r.distanceKm === "number" && ` · ${r.distanceKm.toFixed(1)} km away`}
              </p>
              <BudgetHint amount={r.budgetAmount} method={r.budgetMethod} />
            </div>
            {quotingId !== r.id && (
              <button
                onClick={() => setQuotingId(r.id)}
                className="shrink-0 rounded-full border border-orange px-4 py-1.5 text-sm font-semibold text-orange hover:bg-orange/5"
              >
                Quote
              </button>
            )}
          </div>
          {quotingId === r.id && (
            <QuoteForm
              requestId={r.id}
              onDone={() => {
                setQuotingId(null);
                mutate();
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
