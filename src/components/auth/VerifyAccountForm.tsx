"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MailCheck, MessageSquareText } from "lucide-react";

function readStashedDevCodes(userId: string): { devEmailCode: string | null; devPhoneCode: string | null } {
  if (typeof window === "undefined") return { devEmailCode: null, devPhoneCode: null };
  try {
    const raw = sessionStorage.getItem(`wira_dev_codes_${userId}`);
    if (!raw) return { devEmailCode: null, devPhoneCode: null };
    sessionStorage.removeItem(`wira_dev_codes_${userId}`);
    const parsed = JSON.parse(raw);
    return { devEmailCode: parsed.devEmailCode ?? null, devPhoneCode: parsed.devPhoneCode ?? null };
  } catch {
    return { devEmailCode: null, devPhoneCode: null };
  }
}

export function VerifyAccountForm({ userId, email, phone }: { userId: string; email?: string; phone?: string }) {
  const router = useRouter();
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [stashedCodes, setStashedCodes] = useState(() => readStashedDevCodes(userId));
  const devEmailCode = stashedCodes.devEmailCode;
  const devPhoneCode = stashedCodes.devPhoneCode;
  const setDevEmailCode = (value: string | null) => setStashedCodes((prev) => ({ ...prev, devEmailCode: value }));
  const setDevPhoneCode = (value: string | null) => setStashedCodes((prev) => ({ ...prev, devPhoneCode: value }));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState<"EMAIL_VERIFY" | "PHONE_VERIFY" | null>(null);
  const [resendMessage, setResendMessage] = useState("");

  async function handleResend(purpose: "EMAIL_VERIFY" | "PHONE_VERIFY") {
    setResendMessage("");
    setError("");
    setResending(purpose);
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, purpose }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not resend code.");
      if (purpose === "EMAIL_VERIFY") setDevEmailCode(data.devCode ?? null);
      else setDevPhoneCode(data.devCode ?? null);
      setResendMessage("A new code has been sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend code.");
    } finally {
      setResending(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, emailCode, phoneCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not verify your account.");
      const dest =
        data.user.role === "ADMIN"
          ? "/admin"
          : data.user.role === "PROFESSIONAL"
          ? "/dashboard/professional"
          : data.user.role === "AFFILIATE"
          ? "/dashboard/affiliate"
          : "/dashboard/customer";
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify your account.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-bold text-navy">Verify your account</h1>
      <p className="mt-1 text-sm text-navy/60">
        Enter the 6-digit codes we sent to your email{email ? ` (${email})` : ""} and phone
        {phone ? ` (${phone})` : ""} to activate your account.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-navy">
            <MailCheck size={15} /> Email code
          </label>
          <input
            required
            inputMode="numeric"
            maxLength={6}
            value={emailCode}
            onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-center text-lg tracking-[0.3em] outline-none focus:border-orange"
            placeholder="123456"
          />
          {devEmailCode && (
            <p className="mt-1 text-xs text-amber-700">
              Development mode (no email provider configured) — your code is{" "}
              <strong>{devEmailCode}</strong>.
            </p>
          )}
          <button
            type="button"
            onClick={() => handleResend("EMAIL_VERIFY")}
            disabled={resending === "EMAIL_VERIFY"}
            className="mt-1 text-xs font-semibold text-orange hover:underline disabled:opacity-60"
          >
            {resending === "EMAIL_VERIFY" ? "Sending…" : "Resend email code"}
          </button>
        </div>

        <div>
          <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-navy">
            <MessageSquareText size={15} /> Phone (SMS) code
          </label>
          <input
            required
            inputMode="numeric"
            maxLength={6}
            value={phoneCode}
            onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-center text-lg tracking-[0.3em] outline-none focus:border-orange"
            placeholder="123456"
          />
          {devPhoneCode && (
            <p className="mt-1 text-xs text-amber-700">
              Development mode (no SMS provider configured) — your code is{" "}
              <strong>{devPhoneCode}</strong>.
            </p>
          )}
          <button
            type="button"
            onClick={() => handleResend("PHONE_VERIFY")}
            disabled={resending === "PHONE_VERIFY"}
            className="mt-1 text-xs font-semibold text-orange hover:underline disabled:opacity-60"
          >
            {resending === "PHONE_VERIFY" ? "Sending…" : "Resend SMS code"}
          </button>
        </div>

        {resendMessage && <p className="text-sm text-green-600">{resendMessage}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl wira-gradient-cta py-3 text-sm font-semibold text-navy shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? "Verifying…" : "Verify & activate account"}
        </button>
      </form>
    </div>
  );
}
