"use client";

import { useEffect, useState } from "react";

type Settings = {
  individualHiringFee: number;
  companyHiringFee: number;
  contactUnlockFee: number;
  contactAccessDays: number;
  subscriptionPromoActive: boolean;
  subscriptionPromoLabel: string;
  standardPrice: number;
  standardPromoPrice: number;
  professionalPrice: number;
  professionalPromoPrice: number;
  businessPrice: number;
  businessPromoPrice: number;
  affiliateDefaultCommission: number;
  affiliateMinPayoutThreshold: number;
};

const DEFAULTS: Settings = {
  individualHiringFee: 100,
  companyHiringFee: 150,
  contactUnlockFee: 20,
  contactAccessDays: 5,
  subscriptionPromoActive: true,
  subscriptionPromoLabel: "SPECIAL LAUNCH OFFER",
  standardPrice: 1500,
  standardPromoPrice: 300,
  professionalPrice: 3000,
  professionalPromoPrice: 600,
  businessPrice: 6000,
  businessPromoPrice: 1200,
  affiliateDefaultCommission: 500,
  affiliateMinPayoutThreshold: 1000,
};

function percentOff(original: number, promo: number) {
  if (!original || promo >= original) return 0;
  return Math.round(((original - promo) / original) * 100);
}

export function PricingSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Settings>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setValues(data.settings);
      })
      .finally(() => setLoading(false));
  }, []);

  function setField(field: keyof Settings, value: string) {
    setValues((prev) => ({ ...prev, [field]: Number(value) }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save settings.");
      setValues(data.settings);
      setMessage("Pricing settings saved. Takes effect immediately for new actions.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-navy/50">Loading…</p>;

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      <div className="space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-navy">Subscription promo</h3>
          <label className="flex items-center gap-2 text-sm font-medium text-navy">
            <input
              type="checkbox"
              checked={values.subscriptionPromoActive}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, subscriptionPromoActive: e.target.checked }))
              }
              className="h-4 w-4 accent-orange"
            />
            Promo active
          </label>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-navy">Promo badge label</label>
          <input
            value={values.subscriptionPromoLabel}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, subscriptionPromoLabel: e.target.value }))
            }
            maxLength={80}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          />
        </div>

        {(
          [
            { label: "Standard", original: "standardPrice", promo: "standardPromoPrice" },
            { label: "Professional", original: "professionalPrice", promo: "professionalPromoPrice" },
            { label: "Business", original: "businessPrice", promo: "businessPromoPrice" },
          ] as const
        ).map(({ label, original, promo }) => (
          <div key={label} className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">
                {label} — original price (KSh)
              </label>
              <input
                type="number"
                min={0}
                value={values[original]}
                onChange={(e) => setField(original, e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">
                {label} — promo price (KSh)
              </label>
              <input
                type="number"
                min={0}
                value={values[promo]}
                onChange={(e) => setField(promo, e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
              />
            </div>
            <p className="pb-2.5 text-sm font-semibold text-orange">
              {percentOff(values[original], values[promo])}% off
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:grid-cols-2">
        <h3 className="col-span-full font-semibold text-navy">Affiliate program</h3>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">
            Default commission per eligible referral (KSh)
          </label>
          <input
            type="number"
            min={0}
            value={values.affiliateDefaultCommission}
            onChange={(e) => setField("affiliateDefaultCommission", e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">
            Minimum payout threshold (KSh)
          </label>
          <input
            type="number"
            min={0}
            value={values.affiliateMinPayoutThreshold}
            onChange={(e) => setField("affiliateMinPayoutThreshold", e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:grid-cols-2">
        <h3 className="col-span-full font-semibold text-navy">Hiring marketplace &amp; contact fees</h3>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">
            Individual hiring fee (KSh)
          </label>
          <input
            type="number"
            min={0}
            value={values.individualHiringFee}
            onChange={(e) => setField("individualHiringFee", e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">
            Company hiring fee (KSh)
          </label>
          <input
            type="number"
            min={0}
            value={values.companyHiringFee}
            onChange={(e) => setField("companyHiringFee", e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">
            Contact unlock fee (KSh)
          </label>
          <input
            type="number"
            min={0}
            value={values.contactUnlockFee}
            onChange={(e) => setField("contactUnlockFee", e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">
            Contact access duration (days)
          </label>
          <input
            type="number"
            min={1}
            value={values.contactAccessDays}
            onChange={(e) => setField("contactAccessDays", e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl wira-gradient-cta px-6 py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save pricing settings"}
      </button>
    </form>
  );
}
