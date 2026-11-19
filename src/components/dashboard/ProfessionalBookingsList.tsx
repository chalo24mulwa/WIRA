"use client";

import { useState } from "react";
import useSWR from "swr";
import { Mail, Phone } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const NEXT_ACTION: Record<string, { label: string; next: string } | undefined> = {
  CONFIRMED: { label: "Start job", next: "IN_PROGRESS" },
  IN_PROGRESS: { label: "Mark completed", next: "COMPLETED" },
};

export function ProfessionalBookingsList() {
  const { data, mutate, isLoading } = useSWR("/api/bookings", fetcher);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (isLoading || !data) return <p className="text-sm text-navy/50">Loading…</p>;

  const bookings = data.bookings ?? [];

  if (bookings.length === 0) {
    return <p className="text-sm text-navy/50">No bookings yet.</p>;
  }

  async function updateStatus(id: string, next: string) {
    setUpdatingId(id);
    await fetch(`/api/bookings/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    await mutate();
    setUpdatingId(null);
  }

  return (
    <div className="space-y-3">
      {bookings.map(
        (b: {
          id: string;
          status: string;
          request: {
            category: { name: string };
            description: string;
            customer: { name: string; phone: string | null; email: string | null };
          };
          quotation: { amount: number; pricingMethod: string };
        }) => {
          const action = NEXT_ACTION[b.status];
          return (
            <div key={b.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy">{b.request.category.name}</p>
                  <p className="text-sm text-navy/60">{b.request.description}</p>
                  <p className="mt-1 text-xs text-navy/50">Customer: {b.request.customer.name}</p>
                  {(b.request.customer.phone || b.request.customer.email) && (
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-navy/50">
                      {b.request.customer.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={11} /> {b.request.customer.phone}
                        </span>
                      )}
                      {b.request.customer.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail size={11} /> {b.request.customer.email}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[b.status]}`}
                  >
                    {b.status.replace("_", " ")}
                  </span>
                  <p className="mt-1 text-sm font-bold text-navy">
                    KSh {b.quotation.amount.toLocaleString()}
                    {b.quotation.pricingMethod === "PER_HOUR" ? " / hr" : ""}
                  </p>
                </div>
              </div>
              {action && (
                <button
                  onClick={() => updateStatus(b.id, action.next)}
                  disabled={updatingId === b.id}
                  className="mt-3 rounded-full border border-orange px-4 py-1.5 text-sm font-semibold text-orange hover:bg-orange/5 disabled:opacity-60"
                >
                  {updatingId === b.id ? "Updating…" : action.label}
                </button>
              )}
            </div>
          );
        }
      )}
    </div>
  );
}
