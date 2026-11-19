"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import { KENYAN_COUNTIES } from "@/lib/constants";

type Category = { id: string; name: string };

export function HomeSearchBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("");
  const [county, setCounty] = useState("");
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  function goToSearch(extraParams?: Record<string, string>) {
    const params = new URLSearchParams();
    if (categoryId) params.set("categoryId", categoryId);
    if (county) params.set("county", county);
    if (extraParams) {
      for (const [key, value] of Object.entries(extraParams)) {
        params.set(key, value);
      }
    }
    router.push(`/search?${params.toString()}`);
  }

  function handleFindNearMe() {
    setLocateError("");
    if (!navigator.geolocation) {
      setLocateError("Geolocation is not supported on this device.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        goToSearch({
          lat: String(position.coords.latitude),
          lng: String(position.coords.longitude),
        });
      },
      () => {
        setLocating(false);
        setLocateError("Could not get your location. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="w-full rounded-2xl bg-white p-3 shadow-xl sm:p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToSearch();
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-orange"
        >
          <option value="">Any service category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-orange"
        >
          <option value="">Any location</option>
          {KENYAN_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="flex items-center justify-center gap-2 rounded-xl wira-gradient-cta px-6 py-3 text-sm font-semibold text-navy shadow-sm hover:opacity-90 transition-opacity"
        >
          <Search size={16} />
          Search
        </button>
      </form>

      <button
        onClick={handleFindNearMe}
        disabled={locating}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-navy/15 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors disabled:opacity-60 sm:w-auto sm:px-5"
      >
        <LocateFixed size={16} />
        {locating ? "Locating…" : "Find Professionals Near Me"}
      </button>
      {locateError && (
        <p className="mt-2 text-xs text-red-600">{locateError}</p>
      )}
    </div>
  );
}
