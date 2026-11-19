"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-navy/5 text-navy/50",
  PENDING_FUNDING: "bg-amber-100 text-amber-700",
  SENT: "bg-blue-100 text-blue-700",
  CLOSED: "bg-navy/10 text-navy/50",
  CANCELLED: "bg-red-100 text-red-700",
  EXPIRED: "bg-navy/10 text-navy/40",
};

export function AdminHiringTable() {
  const { data, isLoading } = useSWR("/api/admin/hiring-requests", fetcher);

  if (isLoading) return <p className="text-sm text-navy/50">Loading…</p>;

  const requests = data?.hiringRequests ?? [];

  if (requests.length === 0) {
    return <p className="text-sm text-navy/50">No hiring requests yet.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-navy/40">
            <th className="px-4 py-3">Job title</th>
            <th className="px-4 py-3">Employer</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Recipients</th>
            <th className="px-4 py-3">Fee</th>
            <th className="px-4 py-3">Charged</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(
            (r: {
              id: string;
              jobTitle: string;
              status: string;
              feeAmount: number;
              chargeProcessed: boolean;
              employer: { name: string; accountKind: string; companyProfile: { companyName: string } | null };
              recipients: { status: string }[];
            }) => {
              const accepted = r.recipients.filter((rec) => rec.status === "ACCEPTED").length;
              return (
                <tr key={r.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-navy">{r.jobTitle}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {r.employer.companyProfile?.companyName ?? r.employer.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-navy/70">
                    {accepted}/{r.recipients.length} accepted
                  </td>
                  <td className="px-4 py-3 text-navy/70">KSh {r.feeAmount}</td>
                  <td className="px-4 py-3 text-navy/70">{r.chargeProcessed ? "Yes" : "No"}</td>
                </tr>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
}
