"use client";

import { useState } from "react";
import useSWR from "swr";
import { Circle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * A quick online/offline switch for professionals, available from every
 * page's header (next to the notification bell) so they don't have to go
 * into their profile just to start or stop receiving nearby requests. The
 * full "Availability" toggle on the profile page (with its explanatory
 * copy) stays there too — this is a shortcut, not a replacement.
 */
export function GoOnlineToggle() {
  const { data, mutate } = useSWR<{ isOnline: boolean }>("/api/professionals/me/online", fetcher, {
    refreshInterval: 20000,
  });
  const [busy, setBusy] = useState(false);

  if (!data) return null;
  const isOnline = data.isOnline;

  async function toggle() {
    setBusy(true);
    const next = !isOnline;
    await mutate(
      fetch("/api/professionals/me/online", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnline: next }),
      }).then((res) => res.json()),
      { optimisticData: { isOnline: next }, revalidate: false }
    );
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      title={isOnline ? "You're online — tap to go offline" : "Tap to start receiving nearby requests"}
      className={`flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border p-2 text-xs font-semibold transition-colors disabled:opacity-60 sm:px-3 sm:py-1.5 ${
        isOnline
          ? "border-green-500 bg-green-500 text-white hover:bg-green-600"
          : "border-green-500/40 text-green-700 hover:bg-green-50"
      }`}
    >
      <Circle size={8} className={isOnline ? "fill-white" : "fill-green-500"} />
      <span className="hidden sm:inline">{isOnline ? "Online" : "Go Online"}</span>
    </button>
  );
}
