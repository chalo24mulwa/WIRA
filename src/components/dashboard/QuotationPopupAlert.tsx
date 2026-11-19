"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Bell, Volume2, VolumeX, X } from "lucide-react";
import {
  playNotificationChime,
  readSoundEnabled,
  writeSoundEnabled,
} from "@/lib/use-notification-sound";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type PopupQuotation = {
  id: string;
  amount: number;
  pricingMethod: "PER_HOUR" | "PER_JOB";
  request: { id: string; category: { name: string } };
  professional: { user: { name: string } };
};

export function QuotationPopupAlert() {
  const [queue, setQueue] = useState<PopupQuotation[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(readSoundEnabled);

  useSWR<{ quotations: PopupQuotation[] }>("/api/quotations/pending-popups", fetcher, {
    refreshInterval: 5000,
    onSuccess: (data) => {
      if (!data.quotations.length) return;
      setQueue((prev) => {
        const existingIds = new Set(prev.map((q) => q.id));
        const incoming = data.quotations.filter((q) => !existingIds.has(q.id));
        return incoming.length ? [...prev, ...incoming].slice(-5) : prev;
      });
      if (readSoundEnabled()) playNotificationChime();
    },
  });

  function dismiss(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    writeSoundEnabled(next);
  }

  if (queue.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col gap-3">
      {queue.slice(0, 3).map((q) => (
        <div
          key={q.id}
          className="rounded-2xl border-2 border-gold bg-white p-4 shadow-2xl"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/10 text-navy">
                <Bell size={18} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gold">
                  New quotation received!
                </p>
                <p className="font-semibold text-navy">
                  {q.professional.user.name} &middot; {q.request.category.name}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={toggleSound}
                className="text-navy/40 hover:text-navy"
                aria-label="Toggle notification sound"
                title={soundEnabled ? "Mute notification sounds" : "Unmute notification sounds"}
              >
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
              <button
                type="button"
                onClick={() => dismiss(q.id)}
                className="text-navy/40 hover:text-navy"
                aria-label="Dismiss"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <p className="mt-3 text-sm text-navy/70">
            {q.professional.user.name} submitted a quotation for your {q.request.category.name}{" "}
            request.
          </p>
          <p className="mt-1.5 text-lg font-bold text-navy">
            KSh {q.amount.toLocaleString()} / {q.pricingMethod === "PER_HOUR" ? "Hour" : "Job"}
          </p>

          <Link
            href={`/dashboard/customer/requests/${q.request.id}`}
            onClick={() => dismiss(q.id)}
            className="mt-3 flex w-full items-center justify-center rounded-lg wira-gradient-cta py-2 text-sm font-semibold text-navy shadow-sm hover:opacity-90"
          >
            View Quotation
          </Link>
        </div>
      ))}
    </div>
  );
}
