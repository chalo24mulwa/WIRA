"use client";

import { useEffect, useMemo, useState } from "react";
import { KENYAN_COUNTIES } from "@/lib/constants";

type Category = { id: string; name: string; specializations: { id: string; name: string }[] };
type Worker = {
  id: string;
  bio: string | null;
  county: string;
  town: string | null;
  serviceRadiusKm: number;
  isOnline: boolean;
  user: { name: string; email: string; phone: string | null };
  categories: { category: { id: string; name: string } }[];
  specializations: { specialization: { id: string; name: string; categoryId: string } }[];
};

export function WorkerEditForm({ workerId }: { workerId: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [bio, setBio] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [specializationIds, setSpecializationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((res) => res.json()),
      fetch(`/api/agency/workers/${workerId}`).then((res) => res.json()),
    ]).then(([catData, workerData]) => {
      setCategories(catData.categories ?? []);
      const w: Worker = workerData.worker;
      setWorker(w);
      setBio(w.bio ?? "");
      setCounty(w.county);
      setTown(w.town ?? "");
      setIsOnline(w.isOnline);
      setCategoryIds(w.categories.map((c) => c.category.id));
      setSpecializationIds(w.specializations.map((s) => s.specialization.id));
      setLoading(false);
    });
  }, [workerId]);

  const availableSpecializations = useMemo(
    () => categories.filter((c) => categoryIds.includes(c.id)).flatMap((c) => c.specializations),
    [categories, categoryIds]
  );

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function toggleSpecialization(id: string) {
    setSpecializationIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function toggleOnline() {
    const next = !isOnline;
    setIsOnline(next);
    await fetch(`/api/agency/workers/${workerId}/online`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnline: next }),
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (categoryIds.length === 0) {
      setError("Select at least one service category.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/agency/workers/${workerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio, county, town, categoryIds, specializationIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save worker.");
      setMessage("Worker profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save worker.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !worker) return <p className="text-sm text-navy/50">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-semibold text-navy">{worker.user.name}</h2>
          <p className="text-sm text-navy/60">{worker.user.email}</p>
        </div>
        <button
          type="button"
          onClick={toggleOnline}
          className={`relative h-8 w-14 rounded-full transition-colors ${isOnline ? "bg-green-500" : "bg-navy/20"}`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              isOnline ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">Bio</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">County</label>
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            >
              {KENYAN_COUNTIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">Town / Area</label>
            <input
              value={town}
              onChange={(e) => setTown(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-navy">Service categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  categoryIds.includes(c.id)
                    ? "border-orange bg-orange/10 text-orange"
                    : "border-black/10 text-navy/70 hover:border-navy/30"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {availableSpecializations.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-navy">Specializations</label>
            <div className="flex flex-wrap gap-2">
              {availableSpecializations.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleSpecialization(s.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    specializationIds.includes(s.id)
                      ? "border-orange bg-orange/10 text-orange"
                      : "border-black/10 text-navy/70 hover:border-navy/30"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl wira-gradient-cta px-6 py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save worker profile"}
        </button>
      </form>
    </div>
  );
}
