"use client";

import { useState } from "react";
import useSWR from "swr";
import { BadgeCheck, Mail, Phone } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Account = {
  name: string;
  email: string;
  phone: string | null;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  pendingEmail: string | null;
  pendingPhone: string | null;
};

function ChangeField({
  kind,
  pending,
  onRequested,
}: {
  kind: "email" | "phone";
  pending: string | null;
  onRequested: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [code, setCode] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(Boolean(pending));
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const purpose = kind === "email" ? "EMAIL_CHANGE" : "PHONE_CHANGE";

  async function requestChange() {
    setError("");
    setMessage("");
    if (!value.trim()) {
      setError(`Enter a new ${kind}.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/account/contact/request-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [kind]: value.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Could not update ${kind}.`);
      setDevCode(kind === "email" ? data.emailDevCode : data.phoneDevCode);
      setAwaitingCode(true);
      setMessage(`A verification code was sent to your new ${kind}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Could not update ${kind}.`);
    } finally {
      setBusy(false);
    }
  }

  async function confirmChange() {
    setError("");
    if (!code.trim()) {
      setError("Enter the verification code.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/account/contact/confirm-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose, code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not confirm the code.");
      setEditing(false);
      setAwaitingCode(false);
      setValue("");
      setCode("");
      setDevCode(null);
      onRequested();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm the code.");
    } finally {
      setBusy(false);
    }
  }

  if (!editing && !pending) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-semibold text-orange hover:underline"
      >
        Change {kind}
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-xl bg-navy/[0.03] p-3">
      {pending && (
        <p className="text-xs text-amber-700">
          Pending change to <strong>{pending}</strong> — enter the code sent to confirm.
        </p>
      )}
      {!awaitingCode ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={kind === "email" ? "new@example.com" : "07xx xxx xxx"}
            className="min-w-[180px] flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
          />
          <button
            type="button"
            onClick={requestChange}
            disabled={busy}
            className="rounded-lg wira-gradient-cta px-3 py-2 text-xs font-semibold text-navy hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send code"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs font-semibold text-navy/50 hover:text-navy"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-28 rounded-lg border border-black/10 px-3 py-2 text-center text-sm tracking-widest outline-none focus:border-orange"
          />
          <button
            type="button"
            onClick={confirmChange}
            disabled={busy}
            className="rounded-lg wira-gradient-cta px-3 py-2 text-xs font-semibold text-navy hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Confirming…" : "Confirm"}
          </button>
        </div>
      )}
      {devCode && (
        <p className="text-xs text-amber-700">
          Development mode (no {kind === "email" ? "email" : "SMS"} provider configured) — your
          code is <strong>{devCode}</strong>.
        </p>
      )}
      {message && <p className="text-xs text-green-600">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function AccountSecurityPanel() {
  const { data, mutate, isLoading } = useSWR<{ account: Account }>("/api/account", fetcher);

  if (isLoading || !data?.account) return <p className="text-sm text-navy/50">Loading…</p>;
  const account = data.account;

  return (
    <div className="space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h3 className="font-semibold text-navy">Account security</h3>
      <p className="text-xs text-navy/50">
        One email and one phone number per WIRA account. Changing either requires confirming a
        code sent to the new value.
      </p>

      <div>
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-navy/40" />
          <span className="text-sm text-navy">{account.email}</span>
          {account.emailVerifiedAt && <BadgeCheck size={14} className="text-green-600" />}
        </div>
        <ChangeField kind="email" pending={account.pendingEmail} onRequested={() => mutate()} />
      </div>

      <div>
        <div className="flex items-center gap-2">
          <Phone size={16} className="text-navy/40" />
          <span className="text-sm text-navy">{account.phone ?? "Not set"}</span>
          {account.phoneVerifiedAt && <BadgeCheck size={14} className="text-green-600" />}
        </div>
        <ChangeField kind="phone" pending={account.pendingPhone} onRequested={() => mutate()} />
      </div>
    </div>
  );
}
