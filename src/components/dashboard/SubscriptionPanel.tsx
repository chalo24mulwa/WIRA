"use client";

import { useState } from "react";
import useSWR from "swr";
import { Check, Sparkles } from "lucide-react";
import { PLAN_DETAILS } from "@/lib/constants";
import { FundingPrompt } from "@/components/dashboard/FundingPrompt";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PLANS: { key: keyof typeof PLAN_DETAILS; blurb: string }[] = [
  { key: "FREE", blurb: "Try WIRA with a handful of confirmed requests." },
  { key: "STANDARD", blurb: "For professionals getting steady work." },
  { key: "PROFESSIONAL", blurb: "For busy professionals who want more leads." },
  { key: "BUSINESS", blurb: "Unlimited confirmed bookings, fair-use applies." },
];

type PlanPricing = {
  originalPrice: number;
  effectivePrice: number;
  promoActive: boolean;
  percentOff: number;
};

export function SubscriptionPanel() {
  const { data, mutate, isLoading } = useSWR("/api/subscription", fetcher);
  const [changing, setChanging] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [fundingFor, setFundingFor] = useState<{
    plan: string;
    required: number;
    available: number;
  } | null>(null);

  async function changePlan(plan: string) {
    setError("");
    setChanging(plan);
    try {
      const res = await fetch("/api/subscription/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const result = await res.json();
      if (res.status === 402 && result.requiresFunding) {
        setFundingFor({ plan, required: result.requiredAmount, available: result.walletBalance });
        return;
      }
      if (!res.ok) throw new Error(result.error ?? "Could not switch plans.");
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not switch plans.");
    } finally {
      setChanging(null);
    }
  }

  const subscription = data?.subscription;
  const pricing: Record<string, PlanPricing> | undefined = data?.pricing;
  const walletBalance: number | undefined = data?.walletBalance;

  return (
    <div className="space-y-6">
      {!isLoading && subscription && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm text-navy/60">Current plan</p>
            <p className="text-2xl font-bold text-navy">
              {PLAN_DETAILS[subscription.plan as keyof typeof PLAN_DETAILS].label}
            </p>
            <p className="mt-1 text-sm text-navy/60">
              {subscription.unlimited
                ? "Unlimited confirmed bookings (fair-use applies)"
                : `${subscription.creditsUsed} / ${subscription.creditsLimit} credits used this period`}
            </p>
          </div>
          {typeof walletBalance === "number" && (
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-navy/50">WIRA Coins balance</p>
              <p className="text-lg font-bold text-navy">KSh {walletBalance.toLocaleString()}</p>
            </div>
          )}
        </div>
      )}

      {fundingFor && (
        <FundingPrompt
          label={`switch to the ${PLAN_DETAILS[fundingFor.plan as keyof typeof PLAN_DETAILS].label} plan`}
          requiredAmount={fundingFor.required}
          availableAmount={fundingFor.available}
          onCancel={() => setFundingFor(null)}
          onFunded={async () => {
            const plan = fundingFor.plan;
            setFundingFor(null);
            await changePlan(plan);
          }}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map(({ key, blurb }) => {
          const details = PLAN_DETAILS[key];
          const price = pricing?.[key];
          const isCurrent = subscription?.plan === key;
          const showPromo = price && price.promoActive;
          return (
            <div
              key={key}
              className={`relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
                isCurrent ? "border-orange ring-1 ring-orange" : "border-black/5"
              }`}
            >
              {showPromo && (
                <span className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-orange to-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                  <Sparkles size={11} />
                  {data?.subscriptionPromoLabel ?? "Launch offer"} — {price.percentOff}% OFF
                </span>
              )}

              <h3 className="mt-1 font-semibold text-navy">{details.label}</h3>
              <p className="mt-1 text-sm text-navy/60">{blurb}</p>

              <div className="mt-3">
                {price && price.originalPrice > 0 ? (
                  <>
                    {showPromo && (
                      <span className="mr-2 text-base font-medium text-navy/40 line-through">
                        KSh {price.originalPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-orange">
                      KSh {price.effectivePrice.toLocaleString()}
                    </span>
                    <span className="text-sm font-normal text-navy/50">/mo</span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-navy">Free</span>
                )}
              </div>

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
        Paid plans are charged once from your WIRA Coins wallet when you switch, and start a fresh
        30-day billing period. Only permanently confirmed bookings consume credits.
      </p>
    </div>
  );
}
