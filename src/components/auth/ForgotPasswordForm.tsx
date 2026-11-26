"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, MailCheck } from "lucide-react";
import { PasswordInput } from "@/components/PasswordInput";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always proceeds to the code-entry step, whether or not that email
      // is registered — the response never reveals which.
      setMessage("If that email has a WIRA account, we've sent a 6-digit reset code to it.");
      setStep("reset");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not reset your password.");
      router.push(`/login?reset=success&email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset your password.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-bold text-navy">Reset your password</h1>
      <p className="mt-1 text-sm text-navy/60">
        {step === "request"
          ? "Enter the email on your account and we'll send you a reset code."
          : "Enter the code we sent and choose a new password."}
      </p>

      {step === "request" ? (
        <form onSubmit={handleRequest} className="mt-6 space-y-4">
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl wira-gradient-cta py-3 text-sm font-semibold text-navy shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send reset code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="mt-6 space-y-4">
          {message && (
            <p className="flex items-start gap-2 rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-700">
              <MailCheck size={16} className="mt-0.5 shrink-0" /> {message}
            </p>
          )}
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-navy">
              <KeyRound size={15} /> 6-digit code
            </label>
            <input
              required
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-center text-lg tracking-[0.3em] outline-none focus:border-orange"
              placeholder="123456"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">New password</label>
            <PasswordInput
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">Confirm new password</label>
            <PasswordInput
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl wira-gradient-cta py-3 text-sm font-semibold text-navy shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Resetting…" : "Reset password"}
          </button>
          <button
            type="button"
            onClick={() => setStep("request")}
            className="w-full text-center text-xs font-semibold text-navy/50 hover:text-navy"
          >
            Use a different email
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-navy/60">
        Remembered your password?{" "}
        <Link href="/login" className="font-semibold text-orange hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
