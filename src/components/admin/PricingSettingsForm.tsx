"use client";

import { useEffect, useState } from "react";

type Settings = {
  individualHiringFee: number;
  companyHiringFee: number;
  contactUnlockFee: number;
  contactAccessDays: number;
};

export function PricingSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Settings>({
    individualHiringFee: 100,
    companyHiringFee: 150,
    contactUnlockFee: 20,
    contactAccessDays: 5,
  });
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
    <form onSubmit={handleSave} className="max-w-xl space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
