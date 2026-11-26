"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";
import { GoogleButton } from "@/components/auth/GoogleButton";

const GOOGLE_ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Google sign-in isn't set up on this site yet. Please log in with your email instead.",
  state_mismatch: "That Google sign-in attempt expired. Please try again.",
  unverified_email: "Your Google account's email isn't verified, so we can't use it to sign in.",
  suspended: "This account has been suspended. Contact WIRA support.",
  failed: "Google sign-in didn't work. Please try again or log in with your email.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const googleError = searchParams.get("googleError");
  const resetDone = searchParams.get("reset") === "success";
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification && data.userId) {
          router.push(`/verify?userId=${encodeURIComponent(data.userId)}&email=${encodeURIComponent(email)}`);
          return;
        }
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
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
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-bold text-navy">Welcome back</h1>
      <p className="mt-1 text-sm text-navy/60">Log in to your WIRA account.</p>

      {resetDone && (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-2.5 text-sm text-green-700">
          Your password has been reset. Log in with your new password.
        </p>
      )}
      {googleError && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          {GOOGLE_ERROR_MESSAGES[googleError] ?? GOOGLE_ERROR_MESSAGES.failed}
        </p>
      )}

      <div className="mt-6">
        <GoogleButton mode="login" />
      </div>
      <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-navy/30">
        <span className="h-px flex-1 bg-black/10" />
        or
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-navy">Password</label>
            <Link href="/forgot-password" className="text-xs font-semibold text-orange hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl wira-gradient-cta py-3 text-sm font-semibold text-navy shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy/60">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-orange hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
