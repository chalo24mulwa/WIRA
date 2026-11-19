"use client";

import { useState } from "react";
import useSWR from "swr";
import { Send } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Message = { id: string; senderId: string; body: string; createdAt: string };

export function MessageThread({ recipientId, selfUserId }: { recipientId: string; selfUserId: string }) {
  const { data, mutate, isLoading } = useSWR(
    `/api/hiring-requests/recipients/${recipientId}/messages`,
    fetcher,
    { refreshInterval: 8000 }
  );
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    setSending(true);
    try {
      const res = await fetch(`/api/hiring-requests/recipients/${recipientId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Could not send message.");
      setText("");
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send message.");
    } finally {
      setSending(false);
    }
  }

  if (isLoading) return <p className="text-sm text-navy/50">Loading…</p>;

  const messages: Message[] = data?.messages ?? [];

  return (
    <div className="flex h-[32rem] flex-col rounded-2xl border border-black/5 bg-white shadow-sm">
      <div className="border-b border-black/5 px-5 py-3">
        <p className="font-semibold text-navy">{data?.jobTitle}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.length === 0 && (
          <p className="text-center text-sm text-navy/40">
            No messages yet. Say hello and ask any questions about the role.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === selfUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine ? "wira-gradient-cta text-navy" : "bg-navy/5 text-navy"
                }`}
              >
                <p>{m.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? "text-navy/60" : "text-navy/40"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-black/5 p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl wira-gradient-cta text-navy hover:opacity-90 disabled:opacity-60"
        >
          <Send size={16} />
        </button>
      </form>
      {error && <p className="px-5 pb-3 text-xs text-red-600">{error}</p>}
    </div>
  );
}
