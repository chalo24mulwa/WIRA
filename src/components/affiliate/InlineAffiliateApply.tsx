"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";

export function InlineAffiliateApply({ accountPhone }: { accountPhone: string | null }) {
  const router = useRouter();
  const [samePhone, setSamePhone] = useState(Boolean(accountPhone));
  const [payoutPhone, setPayoutPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/affiliates/apply-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutPhone: samePhone ? accountPhone ?? "" : payoutPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit your application.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your application.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange/10 text-orange">
          <Megaphone size={24} />
        </span>
        <h1 className="mt-4 text-lg font-bold text-navy">Become a WIRA Affiliate</h1>
        <p className="mt-2 text-sm text-navy/60">
          Earn a commission for every genuine new member you refer — using this same account, no
          new login needed. Just confirm where your commission payouts should go.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-left">
          {accountPhone && (
            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={samePhone}
                onChange={(e) => setSamePhone(e.target.checked)}
                className="h-4 w-4 accent-orange"
              />
              Use my account phone ({accountPhone}) for M-Pesa payouts
            </label>
          )}
          {!samePhone && (
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">
                M-Pesa number for commission payouts
              </label>
              <input
                required
                value={payoutPhone}
                onChange={(e) => setPayoutPhone(e.target.value)}
                placeholder="07xx xxx xxx"
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl wira-gradient-cta py-3 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Apply to become an affiliate"}
          </button>
          <p className="text-center text-xs text-navy/40">
            Applications are reviewed by the WIRA team before your affiliate dashboard activates.
          </p>
        </form>
      </div>
    </div>
  );
}
