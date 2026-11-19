"use client";

import Link from "next/link";
import useSWR from "swr";
import { Briefcase, MapPin } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-navy/5 text-navy/50",
  PENDING_FUNDING: "bg-amber-100 text-amber-700",
  SENT: "bg-blue-100 text-blue-700",
  CLOSED: "bg-navy/10 text-navy/50",
  CANCELLED: "bg-red-100 text-red-700",
  EXPIRED: "bg-navy/10 text-navy/40",
};

type Recipient = { id: string; status: string };
type HiringRequest = {
  id: string;
  jobTitle: string;
  employmentType: string;
  status: string;
  workLocationCounty: string;
  workLocationTown: string | null;
  numberRequired: number;
  feeAmount: number;
  chargeProcessed: boolean;
  createdAt: string;
  recipients: Recipient[];
};

export function HiringRequestsList() {
  const { data, isLoading } = useSWR<{ hiringRequests: HiringRequest[] }>(
    "/api/hiring-requests",
    fetcher
  );

  if (isLoading) return <p className="text-sm text-navy/50">Loading…</p>;

  const requests = data?.hiringRequests ?? [];

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
        <Briefcase className="mx-auto mb-3 text-navy/30" size={32} />
        <p className="text-navy/60">You haven&apos;t sent any hiring requests yet.</p>
        <Link
          href="/dashboard/customer/hire"
          className="mt-4 inline-block rounded-full wira-gradient-cta px-5 py-2.5 text-sm font-semibold text-navy hover:opacity-90"
        >
          Browse professionals
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((r) => {
        const accepted = r.recipients.filter((rec) => rec.status === "ACCEPTED").length;
        const declined = r.recipients.filter((rec) => rec.status === "DECLINED").length;
        const pending = r.recipients.length - accepted - declined;
        return (
          <Link
            key={r.id}
            href={`/dashboard/customer/hiring-requests/${r.id}`}
            className="block rounded-2xl border border-black/5 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-navy">{r.jobTitle}</p>
                <p className="flex items-center gap-1 text-xs text-navy/50">
                  <MapPin size={12} />
                  {r.workLocationTown ? `${r.workLocationTown}, ` : ""}
                  {r.workLocationCounty} · {r.employmentType === "CONTRACT" ? "Contract" : "Permanent"}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
                {r.status.replace("_", " ")}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-navy/60">
              <span>{r.recipients.length} invited</span>
              <span className="text-green-700">{accepted} accepted</span>
              <span className="text-red-600">{declined} declined</span>
              <span>{pending} pending</span>
              {r.chargeProcessed && (
                <span className="font-medium text-orange">KSh {r.feeAmount} charged</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
