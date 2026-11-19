"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { BadgeCheck, Mail, MessageCircle, Phone } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-navy/5 text-navy/50",
  VIEWED: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
};

function RecipientContact({ professionalId, status }: { professionalId: string; status: string }) {
  const [contact, setContact] = useState<{ phone: string | null; email: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  if (status !== "ACCEPTED") return null;

  async function reveal() {
    setLoading(true);
    const res = await fetch(`/api/professionals/${professionalId}/contact`);
    const data = await res.json();
    if (data.unlocked) setContact({ phone: data.phone, email: data.email });
    setLoading(false);
  }

  if (contact) {
    return (
      <div className="mt-2 space-y-1 rounded-lg bg-green-50 p-2.5 text-sm text-green-800">
        {contact.phone && (
          <p className="flex items-center gap-1.5">
            <Phone size={13} /> {contact.phone}
          </p>
        )}
        {contact.email && (
          <p className="flex items-center gap-1.5">
            <Mail size={13} /> {contact.email}
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={reveal}
      disabled={loading}
      className="mt-2 text-xs font-semibold text-orange hover:underline disabled:opacity-60"
    >
      {loading ? "Loading…" : "View contact details"}
    </button>
  );
}

export function HiringRequestDetail({ id }: { id: string }) {
  const { data, mutate, isLoading } = useSWR(`/api/hiring-requests/${id}`, fetcher);
  const [busy, setBusy] = useState(false);

  if (isLoading || !data) return <p className="text-sm text-navy/50">Loading…</p>;
  if (data.error) return <p className="text-sm text-red-600">{data.error}</p>;

  const r = data.hiringRequest;

  async function act(action: "close" | "cancel") {
    setBusy(true);
    await fetch(`/api/hiring-requests/${id}/${action}`, { method: "POST" });
    await mutate();
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-navy">{r.jobTitle}</h2>
            <p className="text-sm text-navy/60">
              {r.employmentType === "CONTRACT" ? "Contract" : "Permanent"} ·{" "}
              {r.workLocationTown ? `${r.workLocationTown}, ` : ""}
              {r.workLocationCounty}
            </p>
          </div>
          <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-navy/70">
            {r.status.replace("_", " ")}
          </span>
        </div>
        <p className="mt-3 text-sm text-navy/70">{r.jobDescription}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-navy/50">Payment</dt>
            <dd className="font-medium text-navy">KSh {r.salaryOrPayment}</dd>
          </div>
          <div>
            <dt className="text-navy/50">Number required</dt>
            <dd className="font-medium text-navy">{r.numberRequired}</dd>
          </div>
          <div>
            <dt className="text-navy/50">Hiring fee</dt>
            <dd className="font-medium text-navy">
              KSh {r.feeAmount} {r.chargeProcessed ? "(charged)" : "(not yet charged)"}
            </dd>
          </div>
        </dl>

        {(r.status === "SENT" || r.status === "PENDING_FUNDING") && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => act("close")}
              disabled={busy}
              className="rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5 disabled:opacity-60"
            >
              Close request
            </button>
            <button
              onClick={() => act("cancel")}
              disabled={busy}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              Cancel request
            </button>
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-navy">
          Selected professionals ({r.recipients.length})
        </h3>
        <div className="space-y-3">
          {r.recipients.map(
            (rec: {
              id: string;
              status: string;
              professionalId: string;
              professional: { verified: boolean; user: { name: string } };
            }) => (
              <div key={rec.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-navy">
                    {rec.professional.user.name}
                    {rec.professional.verified && <BadgeCheck size={14} className="text-orange" />}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[rec.status]}`}>
                    {rec.status}
                  </span>
                </div>
                <RecipientContact professionalId={rec.professionalId} status={rec.status} />
                <Link
                  href={`/dashboard/customer/messages/${rec.id}`}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-orange hover:underline"
                >
                  <MessageCircle size={14} />
                  Message
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
