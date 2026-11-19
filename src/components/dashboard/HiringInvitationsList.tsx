"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Briefcase, Building2, Check, MapPin, MessageCircle, User, X } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-navy/5 text-navy/50",
  VIEWED: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
};

type Invitation = {
  id: string;
  status: string;
  hiringRequest: {
    id: string;
    jobTitle: string;
    jobDescription: string;
    employmentType: string;
    salaryOrPayment: string;
    workLocationCounty: string;
    workLocationTown: string | null;
    workingHours: string | null;
    contractDurationDays: number | null;
    requiredQualifications: string | null;
    status: string;
    employer: { name: string; accountKind: string; companyProfile: { companyName: string } | null };
  };
};

export function HiringInvitationsList() {
  const { data, mutate, isLoading } = useSWR<{ invitations: Invitation[] }>(
    "/api/hiring-requests/invitations",
    fetcher
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  if (isLoading) return <p className="text-sm text-navy/50">Loading…</p>;

  const invitations = data?.invitations ?? [];

  if (invitations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
        <Briefcase className="mx-auto mb-3 text-navy/30" size={32} />
        <p className="text-navy/60">No hiring invitations yet.</p>
      </div>
    );
  }

  async function respond(recipientId: string, action: "ACCEPT" | "DECLINE") {
    setBusyId(recipientId);
    await fetch(`/api/hiring-requests/recipients/${recipientId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await mutate();
    setBusyId(null);
  }

  return (
    <div className="space-y-3">
      {invitations.map((inv) => {
        const req = inv.hiringRequest;
        const employerLabel = req.employer.companyProfile?.companyName ?? req.employer.name;
        const canRespond = inv.status === "PENDING" || inv.status === "VIEWED";
        const requestOpen = req.status === "SENT";
        return (
          <div key={inv.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-orange">
                  {req.employer.accountKind === "COMPANY" ? <Building2 size={13} /> : <User size={13} />}
                  {employerLabel}
                </p>
                <p className="mt-0.5 font-semibold text-navy">{req.jobTitle}</p>
                <p className="flex items-center gap-1 text-xs text-navy/50">
                  <MapPin size={12} />
                  {req.workLocationTown ? `${req.workLocationTown}, ` : ""}
                  {req.workLocationCounty} · {req.employmentType === "CONTRACT" ? "Contract" : "Permanent"}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[inv.status]}`}>
                {inv.status}
              </span>
            </div>

            <p className="mt-3 text-sm text-navy/70">{req.jobDescription}</p>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-navy/60 sm:grid-cols-3">
              <div>
                <dt className="text-navy/40">Payment</dt>
                <dd className="font-medium text-navy">KSh {req.salaryOrPayment}</dd>
              </div>
              {req.workingHours && (
                <div>
                  <dt className="text-navy/40">Hours</dt>
                  <dd className="font-medium text-navy">{req.workingHours}</dd>
                </div>
              )}
              {req.contractDurationDays && (
                <div>
                  <dt className="text-navy/40">Duration</dt>
                  <dd className="font-medium text-navy">{req.contractDurationDays} days</dd>
                </div>
              )}
            </dl>

            {canRespond && requestOpen && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => respond(inv.id, "ACCEPT")}
                  disabled={busyId === inv.id}
                  className="flex items-center gap-1.5 rounded-lg wira-gradient-cta px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
                >
                  <Check size={15} />
                  Accept
                </button>
                <button
                  onClick={() => respond(inv.id, "DECLINE")}
                  disabled={busyId === inv.id}
                  className="flex items-center gap-1.5 rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-navy/70 hover:bg-navy/5 disabled:opacity-60"
                >
                  <X size={15} />
                  Decline
                </button>
              </div>
            )}

            <Link
              href={`/dashboard/professional/messages/${inv.id}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-orange hover:underline"
            >
              <MessageCircle size={14} />
              Ask a question
            </Link>
          </div>
        );
      })}
    </div>
  );
}
