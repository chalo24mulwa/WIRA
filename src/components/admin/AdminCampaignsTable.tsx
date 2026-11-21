"use client";

import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Campaign = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  commissionOverride: number | null;
  referralCount: number;
};

export function AdminCampaignsTable() {
  const { data, mutate, isLoading } = useSWR<{ campaigns: Campaign[] }>("/api/admin/campaigns", fetcher);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [commissionOverride, setCommissionOverride] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          commissionOverride: commissionOverride ? Number(commissionOverride) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create campaign.");
      setName("");
      setSlug("");
      setDescription("");
      setCommissionOverride("");
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create campaign.");
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(id: string, current: boolean) {
    setBusyId(id);
    await fetch(`/api/admin/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    await mutate();
    setBusyId(null);
  }

  const campaigns = data?.campaigns ?? [];

  return (
    <div className="space-y-6">
      <form onSubmit={createCampaign} className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-navy/70">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
            placeholder="e.g. December Launch"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy/70">Slug</label>
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
            placeholder="december-launch"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-navy/70">Commission override (KSh)</label>
          <input
            type="number"
            min={0}
            value={commissionOverride}
            onChange={(e) => setCommissionOverride(e.target.value)}
            className="w-40 rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
            placeholder="Default rate"
          />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-medium text-navy/70">Description (optional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg wira-gradient-cta px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          {creating ? "Creating…" : "Create campaign"}
        </button>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </form>

      {isLoading ? (
        <p className="text-sm text-navy/50">Loading…</p>
      ) : campaigns.length === 0 ? (
        <p className="text-sm text-navy/50">No campaigns yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-navy/40">
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Commission override</th>
                <th className="px-4 py-3">Referrals</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-navy">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy/60">{c.slug}</td>
                  <td className="px-4 py-3 text-navy/70">
                    {c.commissionOverride != null ? `KSh ${c.commissionOverride.toLocaleString()}` : "Default rate"}
                  </td>
                  <td className="px-4 py-3 text-navy/70">{c.referralCount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        c.isActive ? "bg-green-100 text-green-700" : "bg-navy/10 text-navy/50"
                      }`}
                    >
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(c.id, c.isActive)}
                      disabled={busyId === c.id}
                      className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5 disabled:opacity-60"
                    >
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
