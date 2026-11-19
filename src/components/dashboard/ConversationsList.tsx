"use client";

import Link from "next/link";
import useSWR from "swr";
import { MessageCircle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ConversationsList({ basePath }: { basePath: string }) {
  const { data, isLoading } = useSWR("/api/messages", fetcher, { refreshInterval: 15000 });

  if (isLoading) return <p className="text-sm text-navy/50">Loading…</p>;

  const threads = data?.threads ?? [];

  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
        <MessageCircle className="mx-auto mb-3 text-navy/30" size={32} />
        <p className="text-navy/60">No conversations yet.</p>
        <p className="mt-1 text-xs text-navy/40">
          Start one from a hiring request or invitation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {threads.map(
        (t: {
          recipientId: string;
          jobTitle: string;
          otherParty: string;
          lastMessage: string | null;
          unread: number;
        }) => (
          <Link
            key={t.recipientId}
            href={`${basePath}/${t.recipientId}`}
            className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="min-w-0">
              <p className="font-semibold text-navy">{t.otherParty}</p>
              <p className="text-xs text-navy/50">{t.jobTitle}</p>
              {t.lastMessage && (
                <p className="mt-1 truncate text-sm text-navy/60">{t.lastMessage}</p>
              )}
            </div>
            {t.unread > 0 && (
              <span className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-orange px-1.5 text-xs font-bold text-white">
                {t.unread}
              </span>
            )}
          </Link>
        )
      )}
    </div>
  );
}
