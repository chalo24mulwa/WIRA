"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Users } from "lucide-react";
import { HireProfessionalCard } from "@/components/dashboard/HireProfessionalCard";
import type { ProfessionalCardData } from "@/components/ProfessionalCard";

export const HIRE_SELECTION_KEY = "wira_hire_selection";

export function HireBrowser({
  professionals,
  savedIds,
}: {
  professionals: ProfessionalCardData[];
  savedIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function proceed() {
    sessionStorage.setItem(HIRE_SELECTION_KEY, JSON.stringify(Array.from(selected)));
    router.push("/dashboard/customer/hire/new");
  }

  return (
    <div className="pb-20">
      {professionals.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center text-navy/60">
          No professionals match your search yet.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {professionals.map((pro) => (
            <HireProfessionalCard
              key={pro.id}
              pro={pro}
              selected={selected.has(pro.id)}
              onToggleSelect={toggle}
              savedInitial={savedIds.includes(pro.id)}
            />
          ))}
        </div>
      )}

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <p className="flex items-center gap-2 text-sm font-medium text-navy">
              <Users size={16} className="text-orange" />
              {selected.size} professional{selected.size === 1 ? "" : "s"} selected
            </p>
            <button
              onClick={proceed}
              className="rounded-full wira-gradient-cta px-6 py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90"
            >
              Proceed to Hire →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
