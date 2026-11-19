"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Smartphone, Wallet, XCircle } from "lucide-react";
import { PLAN_DETAILS } from "@/lib/constants";

type Plan = "STANDARD" | "PROFESSIONAL" | "BUSINESS";

type PlanPricing = {
  originalPrice: number;
  effectivePrice: number;
  promoActive: boolean;
  percentOff: number;
};

const STK_WAIT_MS = 3800;

export function MpesaCheckoutForm({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pricing, setPricing] = useState<PlanPricing | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [promoLabel, setPromoLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<"idle" | "awaiting-pin" | "charging" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ receiptNumber: string; amount: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientReferenceRef = useRef<string>("");

  useEffect(() => {
    Promise.all([fetch("/api/subscription").then((r) => r.json()), fetch("/api/account").then((r) => r.json())])
      .then(([subData, accountData]) => {
        setPricing(subData.pricing?.[plan] ?? null);
        setWalletBalance(subData.walletBalance ?? 0);
        setPromoLabel(subData.subscriptionPromoLabel ?? "");
        if (accountData.account?.phone) setPhone(accountData.account.phone);
      })
      .finally(() => setLoading(false));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [plan]);

  function sendStkPush() {
    setError("");
    if (!phone.trim()) {
      setError("Enter the M-Pesa number that should receive the payment prompt.");
      return;
    }
    clientReferenceRef.current = crypto.randomUUID();
    setStage("awaiting-pin");
    timerRef.current = setTimeout(async () => {
      setStage("charging");
      try {
        const res = await fetch("/api/subscription/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, phone, clientReference: clientReferenceRef.current }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Payment could not be completed.");
        setReceipt({ receiptNumber: data.receiptNumber, amount: data.amount });
        setStage("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Payment could not be completed.");
        setStage("error");
      }
    }, STK_WAIT_MS);
  }

  function cancelPush() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setStage("idle");
  }

  async function payFromWallet() {
    setError("");
    setStage("charging");
    try {
      const res = await fetch("/api/subscription/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not switch plans.");
      setReceipt(null);
      setStage("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not switch plans.");
      setStage("error");
    }
  }

  if (loading) return <p className="text-sm text-navy/50">Loading…</p>;

  const planLabel = PLAN_DETAILS[plan].label;
  const amount = pricing?.effectivePrice ?? 0;

  if (stage === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <CheckCircle2 size={40} className="mx-auto text-green-600" />
        <h2 className="mt-3 text-lg font-bold text-navy">Payment successful!</h2>
        <p className="mt-1 text-sm text-navy/70">
          You&apos;re now on the <strong>{planLabel}</strong> plan.
        </p>
        {receipt && (
          <div className="mt-4 rounded-xl bg-white p-4 text-left text-sm shadow-sm">
            <div className="flex justify-between">
              <span className="text-navy/50">M-Pesa receipt</span>
              <span className="font-mono font-semibold text-navy">{receipt.receiptNumber}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-navy/50">Amount paid</span>
              <span className="font-semibold text-navy">KSh {receipt.amount.toLocaleString()}</span>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            router.push("/dashboard/professional/subscription");
            router.refresh();
          }}
          className="mt-5 w-full rounded-xl wira-gradient-cta py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90"
        >
          Back to subscription
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-navy/40">Order summary</p>
            <p className="text-lg font-bold text-navy">{planLabel} plan</p>
          </div>
          <div className="text-right">
            {pricing?.promoActive && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange">
                  {promoLabel || "Launch offer"} — {pricing.percentOff}% off
                </p>
                <p className="text-sm text-navy/40 line-through">
                  KSh {pricing.originalPrice.toLocaleString()}
                </p>
              </>
            )}
            <p className="text-2xl font-bold text-navy">KSh {amount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {stage === "awaiting-pin" || stage === "charging" ? (
        <div className="rounded-2xl border-2 border-orange/30 bg-orange/5 p-6 text-center">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-orange/20" />
            <Smartphone size={30} className="relative text-orange" />
          </div>
          <p className="mt-4 font-semibold text-navy">
            {stage === "awaiting-pin" ? "STK push sent" : "Confirming payment…"}
          </p>
          <p className="mt-1 text-sm text-navy/60">
            {stage === "awaiting-pin"
              ? `Enter your M-Pesa PIN on ${phone} to complete the KSh ${amount.toLocaleString()} payment.`
              : "Almost done — applying your new plan."}
          </p>
          {stage === "awaiting-pin" && (
            <button
              onClick={cancelPush}
              className="mt-4 flex items-center gap-1.5 mx-auto text-xs font-semibold text-navy/50 hover:text-navy"
            >
              <XCircle size={14} />
              Didn&apos;t get it? Cancel
            </button>
          )}
          {stage === "charging" && (
            <Loader2 size={16} className="mx-auto mt-3 animate-spin text-orange" />
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <label className="mb-1 block text-sm font-medium text-navy">
            M-Pesa number to receive the push
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07xx xxx xxx"
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            onClick={sendStkPush}
            className="mt-4 w-full rounded-xl wira-gradient-cta py-3 text-sm font-semibold text-navy shadow-sm hover:opacity-90"
          >
            Send M-Pesa Prompt — KSh {amount.toLocaleString()}
          </button>
        </div>
      )}

      {stage === "idle" && walletBalance >= amount && amount > 0 && (
        <button
          onClick={payFromWallet}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
        >
          <Wallet size={16} />
          Pay from WIRA Coins balance (KSh {walletBalance.toLocaleString()} available)
        </button>
      )}

      {stage === "idle" && (
        <Link
          href="/dashboard/professional/subscription"
          className="block text-center text-sm font-semibold text-navy/50 hover:text-navy"
        >
          Cancel and go back
        </Link>
      )}
    </div>
  );
}
