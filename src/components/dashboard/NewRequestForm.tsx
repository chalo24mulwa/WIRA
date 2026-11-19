"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { KENYAN_COUNTIES } from "@/lib/constants";
import { FileUploader } from "@/components/FileUploader";

type Category = { id: string; name: string };

export function NewRequestForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetMethod, setBudgetMethod] = useState<"PER_HOUR" | "PER_JOB">("PER_JOB");
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleLocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          description,
          county,
          town,
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
          photoUrls,
          budgetAmount: budgetAmount ? Number(budgetAmount) : undefined,
          budgetMethod: budgetAmount ? budgetMethod : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit request.");
      router.push(`/dashboard/customer/requests/${data.request.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit request.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Service category</label>
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy">
          Describe what you need done
        </label>
        <textarea
          required
          minLength={10}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          placeholder="e.g. My kitchen sink is leaking and needs a new pipe fitted…"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">County</label>
          <select
            required
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          >
            <option value="">Select county</option>
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
            placeholder="e.g. Kilimani"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleLocate}
        disabled={locating}
        className="flex items-center gap-2 rounded-xl border border-navy/15 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5 disabled:opacity-60"
      >
        <LocateFixed size={16} />
        {locating ? "Locating…" : latitude ? "Location attached" : "Attach my GPS location"}
      </button>

      <div>
        <label className="mb-2 block text-sm font-medium text-navy">Photos (optional)</label>
        <FileUploader urls={photoUrls} onChange={setPhotoUrls} max={6} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-navy">
          How much are you willing to pay? (optional)
        </label>
        <p className="mb-2 text-xs text-navy/50">
          This is just a guide for professionals — it doesn&apos;t restrict or auto-accept any
          quotation.
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            placeholder="KSh amount"
            className="w-36 rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          />
          <select
            value={budgetMethod}
            onChange={(e) => setBudgetMethod(e.target.value as "PER_HOUR" | "PER_JOB")}
            disabled={!budgetAmount}
            className="rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-orange disabled:opacity-50"
          >
            <option value="PER_JOB">Total budget for the job</option>
            <option value="PER_HOUR">Per hour</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl wira-gradient-cta px-6 py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit request"}
      </button>
    </form>
  );
}
