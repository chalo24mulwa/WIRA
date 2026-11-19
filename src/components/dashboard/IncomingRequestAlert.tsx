"use client";

import { useState } from "react";
import useSWR from "swr";
import { Bell, Check, MapPin, X } from "lucide-react";
import { useRingtone } from "@/lib/use-ringtone";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type RingingRequest = {
  id: string;
  description: string;
  county: string;
  town: string | null;
  category: { name: string };
  budgetAmount: number | null;
  budgetMethod: "PER_HOUR" | "PER_JOB" | null;
};

export function IncomingRequestAlert() {
  const { data, mutate } = useSWR<{ request: RingingRequest | null; waitingCount: number }>(
    "/api/requests/ringing",
    fetcher,
    { refreshInterval: 6000 }
  );
  const [quoting, setQuoting] = useState(false);
  const [amount, setAmount] = useState("");
  const [pricingMethod, setPricingMethod] = useState<"PER_HOUR" | "PER_JOB">("PER_JOB");
  const [estimatedCompletion, setEstimatedCompletion] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const request = data?.request ?? null;
  useRingtone(Boolean(request) && !busy);

  if (!request) return null;

  function resetLocal() {
    setQuoting(false);
    setAmount("");
    setPricingMethod("PER_JOB");
    setEstimatedCompletion("");
    setMessage("");
    setError("");
  }

  async function handleDecline() {
    setBusy(true);
    try {
      await fetch(`/api/requests/${request!.id}/decline`, { method: "POST" });
      resetLocal();
      await mutate();
    } finally {
      setBusy(false);
    }
  }

  async function handleAccept() {
    setError("");
    if (!amount || Number(amount) <= 0) {
      setError("Enter the amount you'd charge for this job.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/requests/${request!.id}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), pricingMethod, estimatedCompletion, message }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error ?? "This job may have just been taken. Trying the next one…");
        await mutate();
        resetLocal();
        return;
      }
      resetLocal();
      await mutate();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[100] w-[22rem] max-w-[calc(100vw-2.5rem)]">
      <div className="animate-[pulse_2.2s_ease-in-out_infinite] rounded-2xl border-2 border-orange bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange/10 text-orange">
              <Bell size={18} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-orange">
                New job request
              </p>
              <p className="font-semibold text-navy">{request.category.name}</p>
            </div>
          </div>
          {data && data.waitingCount > 0 && (
            <span className="rounded-full bg-navy/5 px-2 py-1 text-[11px] font-semibold text-navy/60">
              +{data.waitingCount} waiting
            </span>
          )}
        </div>

        <p className="mt-3 line-clamp-3 text-sm text-navy/70">{request.description}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-navy/50">
          <MapPin size={12} />
          {request.town ? `${request.town}, ` : ""}
          {request.county}
        </p>
        {request.budgetAmount && (
          <p className="mt-1 text-xs font-medium text-navy/50">
            Customer&apos;s budget: KSh {request.budgetAmount.toLocaleString()}
            {request.budgetMethod === "PER_HOUR" ? " / hour" : " total (estimate)"}
          </p>
        )}

        {quoting ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="mb-1 block text-xs font-medium text-navy/70">
                  Your price (KSh)
                </label>
                <input
                  type="number"
                  min={1}
                  autoFocus
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-navy/70">Pricing</label>
                <select
                  value={pricingMethod}
                  onChange={(e) => setPricingMethod(e.target.value as "PER_HOUR" | "PER_JOB")}
                  className="rounded-lg border border-black/10 px-2 py-2 text-sm outline-none focus:border-orange"
                >
                  <option value="PER_JOB">Per job</option>
                  <option value="PER_HOUR">Per hour</option>
                </select>
              </div>
            </div>
            <input
              value={estimatedCompletion}
              onChange={(e) => setEstimatedCompletion(e.target.value)}
              placeholder="Estimated completion time (optional)…"
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
            />
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Additional comments or conditions (optional)…"
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleAccept}
                disabled={busy}
                className="flex-1 rounded-lg wira-gradient-cta py-2 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Sending…" : "Confirm & Send"}
              </button>
              <button
                onClick={resetLocal}
                disabled={busy}
                className="rounded-lg border border-black/10 px-3 py-2 text-sm font-semibold text-navy/60 hover:bg-navy/5"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setQuoting(true)}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg wira-gradient-cta py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
            >
              <Check size={16} />
              Accept
            </button>
            <button
              onClick={handleDecline}
              disabled={busy}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-black/10 py-2.5 text-sm font-semibold text-navy/70 hover:bg-navy/5 disabled:opacity-60"
            >
              <X size={16} />
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
