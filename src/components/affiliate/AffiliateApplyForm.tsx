"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Building2, User } from "lucide-react";
import { KENYAN_COUNTIES } from "@/lib/constants";
import { PasswordInput } from "@/components/PasswordInput";

type AccountKind = "INDIVIDUAL" | "COMPANY";

export function AffiliateApplyForm() {
  const router = useRouter();
  const [accountKind, setAccountKind] = useState<AccountKind>("INDIVIDUAL");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [payoutPhone, setPayoutPhone] = useState("");
  const [samePhone, setSamePhone] = useState(true);
  const [county, setCounty] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/affiliates/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          businessName: accountKind === "COMPANY" ? businessName : undefined,
          accountKind,
          email,
          phone,
          payoutPhone: samePhone ? phone : payoutPhone,
          county,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      try {
        sessionStorage.setItem(
          `wira_dev_codes_${data.userId}`,
          JSON.stringify({ devEmailCode: data.devEmailCode, devPhoneCode: data.devPhoneCode })
        );
      } catch {
        // sessionStorage unavailable — the verify page just won't show a dev-mode hint
      }
      router.push(
        `/verify?userId=${encodeURIComponent(data.userId)}&email=${encodeURIComponent(data.email)}&phone=${encodeURIComponent(data.phone ?? "")}`
      );
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-bold text-navy">Apply to become a WIRA Affiliate</h1>
      <p className="mt-1 text-sm text-navy/60">
        Earn a commission for every genuine new member you bring to WIRA.
      </p>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy/40">
          Applying as
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setAccountKind("INDIVIDUAL")}
            className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-3.5 text-left transition-colors ${
              accountKind === "INDIVIDUAL" ? "border-orange bg-orange/5" : "border-black/10 hover:border-navy/20"
            }`}
          >
            <User size={18} className={accountKind === "INDIVIDUAL" ? "text-orange" : "text-navy/50"} />
            <span className={`text-sm font-semibold ${accountKind === "INDIVIDUAL" ? "text-orange" : "text-navy"}`}>
              Individual
            </span>
            <span className="text-xs text-navy/50">Promoting WIRA on your own</span>
          </button>
          <button
            type="button"
            onClick={() => setAccountKind("COMPANY")}
            className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-3.5 text-left transition-colors ${
              accountKind === "COMPANY" ? "border-orange bg-orange/5" : "border-black/10 hover:border-navy/20"
            }`}
          >
            <Building2 size={18} className={accountKind === "COMPANY" ? "text-orange" : "text-navy/50"} />
            <span className={`text-sm font-semibold ${accountKind === "COMPANY" ? "text-orange" : "text-navy"}`}>
              Marketing agency
            </span>
            <span className="text-xs text-navy/50">A registered business or agency</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">
            {accountKind === "COMPANY" ? "Contact person's name" : "Full name"}
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            placeholder="Jane Wanjiku"
          />
        </div>

        {accountKind === "COMPANY" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">Business / agency name</label>
            <input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
              placeholder="e.g. Nova Digital Marketing"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-navy">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-navy">Phone number</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            placeholder="07xx xxx xxx"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-navy">
            <input
              type="checkbox"
              checked={samePhone}
              onChange={(e) => setSamePhone(e.target.checked)}
              className="h-4 w-4 accent-orange"
            />
            Use the same number for M-Pesa commission payouts
          </label>
          {!samePhone && (
            <input
              required
              value={payoutPhone}
              onChange={(e) => setPayoutPhone(e.target.value)}
              className="mt-2 w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
              placeholder="M-Pesa number to receive payouts"
            />
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-navy">County</label>
          <select
            required
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          >
            <option value="">Select your county</option>
            {KENYAN_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-navy">Password</label>
          <PasswordInput
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl wira-gradient-cta py-3 text-sm font-semibold text-navy shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? "Submitting application…" : "Submit application"}
        </button>
        <p className="text-center text-xs text-navy/40">
          Applications are reviewed by the WIRA team before your affiliate dashboard is activated.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-navy/60">
        Already an affiliate?{" "}
        <Link href="/login" className="font-semibold text-orange hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
