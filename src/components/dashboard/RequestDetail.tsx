"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { BadgeCheck, MapPin, User as UserIcon } from "lucide-react";
import { StarRating } from "@/components/StarRating";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function priceLabel(amount: number, method: string) {
  return `KSh ${amount.toLocaleString()} / ${method === "PER_HOUR" ? "Hour" : "Job"}`;
}

export function RequestDetail({ requestId }: { requestId: string }) {
  const { data, mutate, isLoading } = useSWR(`/api/requests/${requestId}`, fetcher);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleAccept(quotationId: string) {
    setError("");
    setAcceptingId(quotationId);
    try {
      const res = await fetch(`/api/quotations/${quotationId}/accept`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Could not confirm professional.");
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm professional.");
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleDecline(quotationId: string) {
    setError("");
    setDecliningId(quotationId);
    try {
      const res = await fetch(`/api/quotations/${quotationId}/decline`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Could not decline quotation.");
      mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not decline quotation.");
    } finally {
      setDecliningId(null);
    }
  }

  if (isLoading || !data) {
    return <p className="text-sm text-navy/50">Loading…</p>;
  }

  if (data.error) {
    return <p className="text-sm text-red-600">{data.error}</p>;
  }

  const request = data.request;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-navy">{request.category.name}</h2>
          <span className="rounded-full bg-navy/5 px-3 py-1 text-xs font-semibold text-navy/70">
            {request.status.replace("_", " ")}
          </span>
        </div>
        <p className="mt-2 text-sm text-navy/70">{request.description}</p>
        <p className="mt-2 flex items-center gap-1 text-xs text-navy/50">
          <MapPin size={12} />
          {request.town ? `${request.town}, ` : ""}
          {request.county}
        </p>
        {request.budgetAmount && (
          <p className="mt-2 inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-navy/70">
            Your proposed budget: KSh {request.budgetAmount.toLocaleString()}
            {request.budgetMethod === "PER_HOUR" ? " / hour" : " total (estimate)"}
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-navy">
          Quotations ({request.quotations.length})
        </h3>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        {request.quotations.length === 0 && (
          <p className="text-sm text-navy/50">
            No quotations yet. Professionals nearby have been notified.
          </p>
        )}

        {request.status === "CONFIRMED" && (
          <p className="mb-3 text-sm text-navy/60">
            You&apos;ve confirmed a professional for this job.{" "}
            <Link href="/dashboard/customer/bookings" className="font-semibold text-orange hover:underline">
              View the booking
            </Link>{" "}
            to see their contact details.
          </p>
        )}

        <div className="space-y-3">
          {request.quotations.map(
            (q: {
              id: string;
              amount: number;
              pricingMethod: string;
              estimatedCompletion: string | null;
              message: string | null;
              status: string;
              professional: {
                id: string;
                ratingAvg: number;
                ratingCount: number;
                verified: boolean;
                user: { name: string };
                portfolioPhotos: { url: string }[];
              };
            }) => {
              const photo = q.professional.portfolioPhotos[0]?.url;
              return (
                <div
                  key={q.id}
                  className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex gap-3">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={q.professional.user.name}
                        width={48}
                        height={48}
                        className="h-12 w-12 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy/5 text-navy/40">
                        <UserIcon size={20} />
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/professionals/${q.professional.id}`}
                          className="font-semibold text-navy hover:underline"
                        >
                          {q.professional.user.name}
                        </Link>
                        {q.professional.verified && (
                          <BadgeCheck size={15} className="text-orange" />
                        )}
                      </div>
                      <StarRating
                        rating={q.professional.ratingAvg}
                        count={q.professional.ratingCount}
                      />
                      {q.estimatedCompletion && (
                        <p className="mt-1 text-xs text-navy/50">
                          Estimated completion: {q.estimatedCompletion}
                        </p>
                      )}
                      {q.message && <p className="mt-1 text-sm text-navy/60">{q.message}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="text-lg font-bold text-navy">
                      {priceLabel(q.amount, q.pricingMethod)}
                    </span>
                    {q.status === "PENDING" && request.status !== "CONFIRMED" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(q.id)}
                          disabled={acceptingId === q.id || decliningId === q.id}
                          className="rounded-full wira-gradient-cta px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
                        >
                          {acceptingId === q.id ? "Confirming…" : "Accept"}
                        </button>
                        <button
                          onClick={() => handleDecline(q.id)}
                          disabled={acceptingId === q.id || decliningId === q.id}
                          className="rounded-full border border-black/10 px-4 py-2 text-sm font-semibold text-navy/60 hover:bg-navy/5 disabled:opacity-60"
                        >
                          {decliningId === q.id ? "Declining…" : "Decline"}
                        </button>
                      </div>
                    )}
                    {q.status === "ACCEPTED" && (
                      <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                        Confirmed
                      </span>
                    )}
                    {q.status === "DECLINED" && (
                      <span className="rounded-full bg-navy/5 px-3 py-1.5 text-xs font-semibold text-navy/40">
                        Not selected
                      </span>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
