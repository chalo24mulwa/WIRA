"use client";

import { useState } from "react";
import useSWR from "swr";
import { Mail, Phone, Star } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

function ReviewForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${bookingId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit review.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl bg-navy/[0.03] p-3">
      <p className="mb-1.5 text-xs font-semibold text-navy/70">Rate this job</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)}>
            <Star
              size={20}
              className={n <= rating ? "fill-gold text-gold" : "fill-navy/10 text-navy/10"}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Optional comment…"
        className="mt-2 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={submitting}
        className="mt-2 rounded-lg wira-gradient-cta px-4 py-1.5 text-xs font-semibold text-navy hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </div>
  );
}

export function CustomerBookingsList() {
  const { data, mutate, isLoading } = useSWR("/api/bookings", fetcher);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  if (isLoading || !data) return <p className="text-sm text-navy/50">Loading…</p>;

  const bookings = data.bookings ?? [];

  if (bookings.length === 0) {
    return <p className="text-sm text-navy/50">No bookings yet.</p>;
  }

  return (
    <div className="space-y-3">
      {bookings.map(
        (b: {
          id: string;
          status: string;
          request: { category: { name: string } };
          professional: { user: { name: string; phone: string | null; email: string | null } };
          review: { rating: number } | null;
        }) => (
          <div key={b.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy">{b.request.category.name}</p>
                <p className="text-sm text-navy/60">with {b.professional.user.name}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[b.status]}`}
              >
                {b.status.replace("_", " ")}
              </span>
            </div>

            {(b.professional.user.phone || b.professional.user.email) && (
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-navy/60">
                {b.professional.user.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={11} /> {b.professional.user.phone}
                  </span>
                )}
                {b.professional.user.email && (
                  <span className="inline-flex items-center gap-1">
                    <Mail size={11} /> {b.professional.user.email}
                  </span>
                )}
              </div>
            )}

            {b.status === "COMPLETED" && !b.review && (
              <>
                {reviewingId === b.id ? (
                  <ReviewForm
                    bookingId={b.id}
                    onDone={() => {
                      setReviewingId(null);
                      mutate();
                    }}
                  />
                ) : (
                  <button
                    onClick={() => setReviewingId(b.id)}
                    className="mt-2 text-sm font-semibold text-orange hover:underline"
                  >
                    Leave a review
                  </button>
                )}
              </>
            )}

            {b.review && (
              <p className="mt-2 text-xs text-navy/50">
                You rated this job {b.review.rating}★
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
}
