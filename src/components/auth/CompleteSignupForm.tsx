"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone } from "lucide-react";

export function CompleteSignupForm({ userId, email }: { userId: string; email: string }) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google/set-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save your phone number.");

      try {
        sessionStorage.setItem(`wira_dev_codes_${userId}`, JSON.stringify({ devPhoneCode: data.devPhoneCode }));
      } catch {
        // sessionStorage unavailable — the verify page just won't show a dev-mode hint
      }

      router.push(
        `/verify?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&needsEmailCode=0`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your phone number.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-bold text-navy">One more step</h1>
      <p className="mt-1 text-sm text-navy/60">
        You signed up with Google as <strong>{email}</strong>. WIRA requires one phone number per
        account — add yours and we&apos;ll text you a code to confirm it.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-navy">
            <Phone size={15} /> Phone number
          </label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07xx xxx xxx"
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          />
          <p className="mt-1 text-xs text-navy/40">One phone number per account — no duplicates.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl wira-gradient-cta py-3 text-sm font-semibold text-navy shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? "Sending code…" : "Send verification code"}
        </button>
      </form>
    </div>
  );
}
