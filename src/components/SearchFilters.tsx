"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import { KENYAN_COUNTIES } from "@/lib/constants";

type Specialization = { id: string; name: string };
type Category = { id: string; name: string; specializations: Specialization[] };

export function SearchFilters({
  categories,
  initial,
  basePath = "/search",
}: {
  categories: Category[];
  initial: { categoryId?: string; county?: string; q?: string; specializationId?: string };
  basePath?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categoryId, setCategoryId] = useState(initial.categoryId ?? "");
  const [specializationId, setSpecializationId] = useState(initial.specializationId ?? "");
  const [county, setCounty] = useState(initial.county ?? "");
  const [q, setQ] = useState(initial.q ?? "");
  const [locating, setLocating] = useState(false);

  const specializations = useMemo(
    () => categories.find((c) => c.id === categoryId)?.specializations ?? [],
    [categories, categoryId]
  );

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    setSpecializationId("");
  }

  function applyFilters(extra?: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    const set = (key: string, value: string | undefined) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };
    set("categoryId", categoryId);
    set("specializationId", specializationId);
    set("county", county);
    set("q", q);
    if (extra) {
      for (const [key, value] of Object.entries(extra)) set(key, value);
    }
    router.push(`${basePath}?${params.toString()}`);
  }

  function handleLocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        applyFilters({
          lat: String(position.coords.latitude),
          lng: String(position.coords.longitude),
        });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder="Search by name or skill…"
          className="flex-1 rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
        />
        <select
          value={categoryId}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
        >
          <option value="">Any category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
        >
          <option value="">Any location</option>
          {KENYAN_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          onClick={() => applyFilters()}
          className="flex items-center justify-center gap-2 rounded-xl wira-gradient-cta px-5 py-2.5 text-sm font-semibold text-navy hover:opacity-90"
        >
          <Search size={16} />
          Search
        </button>
        <button
          onClick={handleLocate}
          disabled={locating}
          className="flex items-center justify-center gap-2 rounded-xl border border-navy/15 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5 disabled:opacity-60"
        >
          <LocateFixed size={16} />
          {locating ? "Locating…" : "Near me"}
        </button>
      </div>

      {categoryId && specializations.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-navy/40">
            Specialization
          </span>
          <button
            onClick={() => {
              setSpecializationId("");
              applyFilters({ specializationId: undefined });
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              !specializationId
                ? "border-orange bg-orange/10 text-orange"
                : "border-black/10 text-navy/60 hover:border-navy/30"
            }`}
          >
            Any
          </button>
          {specializations.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSpecializationId(s.id);
                applyFilters({ specializationId: s.id });
              }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                specializationId === s.id
                  ? "border-orange bg-orange/10 text-orange"
                  : "border-black/10 text-navy/60 hover:border-navy/30"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
