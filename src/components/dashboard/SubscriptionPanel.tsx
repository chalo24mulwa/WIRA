"use client";

import { useState } from "react";
import useSWR from "swr";
import { Check } from "lucide-react";
import { PLAN_DETAILS } from "@/lib/constants";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PLANS: { key: keyof typeof PLAN_DETAILS; blurb: string }[] = [
  { key: "FREE", blurb: "Try WIRA with a handful of confirmed requests." },
  { key: "STANDARD", blurb: "For professionals getting steady work." },
  { key: "PROFESSIONAL", blurb: "For busy professionals who want more leads." },
  { key: "BUSINESS", blurb: "Unlimited confirmed bookings, fair-use applies." },
];

export function SubscriptionPanel() {
  const { data, mutate, isLoading } = useSWR("/api/subscription", fetcher);
  const [changing, setChanging] = useState<string | null>(null);

  async function changePlan(plan: string) {
    setChanging(plan);
    await fetch("/api/subscription/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    await mutate();
    setChanging(null);
  }

  const subscription = data?.subscription;

  return (
    <div className="space-y-6">
      {!isLoading && subscription && (
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm text-navy/60">Current plan</p>
          <p className="text-2xl font-bold text-navy">{PLAN_DETAILS[subscription.plan as keyof typeof PLAN_DETAILS].label}</p>
          <p className="mt-1 text-sm text-navy/60">
            {subscription.unlimited
              ? "Unlimited confirmed bookings (fair-use applies)"
              : `${subscription.creditsUsed} / ${subscription.creditsLimit} credits used this period`}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map(({ key, blurb }) => {
          const details = PLAN_DETAILS[key];
          const isCurrent = subscription?.plan === key;
          return (
            <div
              key={key}
              className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                isCurrent ? "border-orange ring-1 ring-orange" : "border-black/5"
              }`}
            >
              <h3 className="font-semibold text-navy">{details.label}</h3>
              <p className="mt-1 text-sm text-navy/60">{blurb}</p>
              <p className="mt-3 text-2xl font-bold text-navy">
                {details.price === 0 ? "Free" : `KSh ${details.price.toLocaleString()}`}
                {details.price > 0 && <span className="text-sm font-normal text-navy/50">/mo</span>}
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm text-navy/70">
                <Check size={14} className="text-green-600" />
                {details.credits === -1 ? "Unlimited" : details.credits} confirmed requests
              </p>
              <button
                onClick={() => changePlan(key)}
                disabled={isCurrent || changing === key}
                className="mt-4 rounded-full wira-gradient-cta px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {isCurrent ? "Current plan" : changing === key ? "Switching…" : "Choose plan"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-navy/40">
        Only permanently confirmed bookings consume credits. Credit totals reset every billing
        period.
      </p>
    </div>
  );
}
