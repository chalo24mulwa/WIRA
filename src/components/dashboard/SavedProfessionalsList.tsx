"use client";

import useSWR from "swr";
import { Bookmark } from "lucide-react";
import { ProfessionalCard, type ProfessionalCardData } from "@/components/ProfessionalCard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SavedProfessionalsList() {
  const { data, isLoading } = useSWR("/api/saved-professionals", fetcher);

  if (isLoading) return <p className="text-sm text-navy/50">Loading…</p>;

  const saved = data?.saved ?? [];

  if (saved.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
        <Bookmark className="mx-auto mb-3 text-navy/30" size={32} />
        <p className="text-navy/60">You haven&apos;t saved any professionals yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {saved.map(
        (s: {
          professionalId: string;
          professional: {
            id: string;
            bio: string | null;
            county: string;
            town: string | null;
            isOnline: boolean;
            verified: boolean;
            ratingAvg: number;
            ratingCount: number;
            user: { name: string };
            categories: { category: { name: string } }[];
          };
        }) => {
          const p = s.professional;
          const pro: ProfessionalCardData = {
            id: p.id,
            name: p.user.name,
            bio: p.bio,
            county: p.county,
            town: p.town,
            isOnline: p.isOnline,
            verified: p.verified,
            ratingAvg: p.ratingAvg,
            ratingCount: p.ratingCount,
            categories: p.categories.map((c) => c.category.name),
          };
          return <ProfessionalCard key={s.professionalId} pro={pro} />;
        }
      )}
    </div>
  );
}
