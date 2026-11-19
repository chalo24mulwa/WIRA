"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KENYAN_COUNTIES } from "@/lib/constants";

type Category = { id: string; name: string };

export function AddWorkerForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("");
  const [town, setTown] = useState("");
  const [bio, setBio] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.categories ?? []));
  }, []);

  function toggleCategory(id: string) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (categoryIds.length === 0) {
      setError("Select at least one service category.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/agency/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, county, town, bio, categoryIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not register worker.");
      router.push("/dashboard/professional/workers");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not register worker.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Worker&apos;s full name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Email</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Phone number</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          placeholder="07xx xxx xxx"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
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
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-navy">Bio</label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
        />
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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl wira-gradient-cta px-6 py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Registering…" : "Register worker"}
      </button>
    </form>
  );
}
