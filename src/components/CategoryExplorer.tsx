"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";

type Specialization = { id: string; name: string };
type Category = {
  id: string;
  name: string;
  icon: string | null;
  specializations: Specialization[];
};

export function CategoryExplorer({ categories }: { categories: Category[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = categories.find((c) => c.id === selectedId) ?? null;

  function toggle(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {categories.map((c) => {
          const isSelected = c.id === selectedId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              aria-expanded={isSelected}
              className={`group flex flex-col items-center gap-3 rounded-2xl border bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${
                isSelected ? "border-orange ring-1 ring-orange" : "border-black/5"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                  isSelected
                    ? "bg-orange/10 text-orange"
                    : "bg-navy/5 text-navy group-hover:bg-orange/10 group-hover:text-orange"
                }`}
              >
                <CategoryIcon iconName={c.icon} size={24} />
              </span>
              <span className="text-sm font-semibold text-navy">{c.name}</span>
              {c.specializations.length > 0 && (
                <ChevronDown
                  size={14}
                  className={`-mt-1.5 text-navy/30 transition-transform ${
                    isSelected ? "rotate-180 text-orange" : ""
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-5 rounded-2xl border border-orange/20 bg-orange/[0.04] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-navy">
              {selected.name} — specializations
            </h3>
            <Link
              href={`/search?categoryId=${selected.id}`}
              className="flex items-center gap-1 text-sm font-semibold text-orange hover:underline"
            >
              Browse all {selected.name} professionals
              <ArrowRight size={14} />
            </Link>
          </div>

          {selected.specializations.length === 0 ? (
            <p className="mt-3 text-sm text-navy/50">
              No specializations listed yet for this category.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.specializations.map((s) => (
                <Link
                  key={s.id}
                  href={`/search?categoryId=${selected.id}&specializationId=${s.id}`}
                  className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-sm font-medium text-navy hover:border-orange hover:text-orange transition-colors"
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
