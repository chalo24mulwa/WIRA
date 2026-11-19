"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data, mutate } = useSWR<{ notifications: NotificationItem[]; unread: number }>(
    "/api/notifications",
    fetcher,
    { refreshInterval: 15000 }
  );

  const notifications = data?.notifications ?? [];
  const unread = data?.unread ?? 0;

  useEffect(() => {
    if (!open || unread === 0) return;
    fetch("/api/notifications", { method: "POST" }).then(() => mutate());
  }, [open, unread, mutate]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-navy hover:bg-navy/5 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-black/5 bg-white py-1 shadow-lg">
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-navy/50">
              Notifications
            </div>
            {notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-navy/50">
                You&apos;re all caught up.
              </p>
            )}
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link ?? "#"}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 text-sm hover:bg-navy/5 ${
                  n.read ? "" : "bg-orange/5"
                }`}
              >
                <p className="font-semibold text-navy">{n.title}</p>
                <p className="text-navy/60">{n.body}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
