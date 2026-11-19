"use client";

import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";

export function CompanyProfileForm() {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [industry, setIndustry] = useState("");
  const [verified, setVerified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/company-profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setCompanyName(data.profile.companyName);
          setRegistrationNumber(data.profile.registrationNumber ?? "");
          setIndustry(data.profile.industry ?? "");
          setVerified(data.profile.verified);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const res = await fetch("/api/company-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, registrationNumber, industry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save company profile.");
      setMessage("Company profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save company profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-navy/50">Loading…</p>;

  return (
    <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      {verified && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          <BadgeCheck size={16} />
          This company is verified
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Company name</label>
        <input
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Registration number</label>
        <input
          value={registrationNumber}
          onChange={(e) => setRegistrationNumber(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          placeholder="Business registration / certificate number"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Industry</label>
        <input
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          placeholder="e.g. Construction, Facilities Management"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl wira-gradient-cta px-6 py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save company profile"}
      </button>
    </form>
  );
}
