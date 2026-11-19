"use client";

import Link from "next/link";
import useSWR from "swr";
import { Plus, Users } from "lucide-react";
import { StarRating } from "@/components/StarRating";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Worker = {
  id: string;
  county: string;
  town: string | null;
  isOnline: boolean;
  ratingAvg: number;
  ratingCount: number;
  user: { name: string; email: string };
  categories: { category: { name: string } }[];
};

export function WorkersList() {
  const { data, mutate, isLoading } = useSWR<{ workers: Worker[] }>("/api/agency/workers", fetcher);

  async function toggleOnline(id: string, current: boolean) {
    await fetch(`/api/agency/workers/${id}/online`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnline: !current }),
    });
    await mutate();
  }

  const workers = data?.workers ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Worker Management</h1>
        <Link
          href="/dashboard/professional/workers/new"
          className="flex items-center gap-1.5 rounded-full wira-gradient-cta px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:opacity-90"
        >
          <Plus size={16} />
          Add Worker
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-navy/50">Loading…</p>
      ) : workers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
          <Users className="mx-auto mb-3 text-navy/30" size={32} />
          <p className="text-navy/60">No workers registered yet.</p>
          <Link
            href="/dashboard/professional/workers/new"
            className="mt-4 inline-block rounded-full wira-gradient-cta px-5 py-2.5 text-sm font-semibold text-navy hover:opacity-90"
          >
            Register your first worker
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((w) => (
            <div key={w.id} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-navy">{w.user.name}</p>
                  <p className="text-xs text-navy/50">
                    {w.town ? `${w.town}, ` : ""}
                    {w.county}
                  </p>
                </div>
                <button
                  onClick={() => toggleOnline(w.id, w.isOnline)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    w.isOnline ? "bg-green-100 text-green-700" : "bg-navy/5 text-navy/40"
                  }`}
                >
                  {w.isOnline ? "Online" : "Offline"}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {w.categories.slice(0, 3).map((c) => (
                  <span key={c.category.name} className="rounded-full bg-navy/5 px-2 py-0.5 text-xs text-navy/60">
                    {c.category.name}
                  </span>
                ))}
              </div>
              <div className="mt-2">
                <StarRating rating={w.ratingAvg} count={w.ratingCount} />
              </div>
              <Link
                href={`/dashboard/professional/workers/${w.id}`}
                className="mt-3 inline-block text-sm font-semibold text-orange hover:underline"
              >
                Edit profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
