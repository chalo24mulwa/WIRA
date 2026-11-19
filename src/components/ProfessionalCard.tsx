import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { StarRating } from "@/components/StarRating";

export type ProfessionalCardData = {
  id: string;
  name: string;
  bio: string | null;
  county: string;
  town: string | null;
  isOnline: boolean;
  verified: boolean;
  ratingAvg: number;
  ratingCount: number;
  categories: string[];
  distanceKm?: number | null;
};

export function ProfessionalCard({ pro }: { pro: ProfessionalCardData }) {
  return (
    <Link
      href={`/professionals/${pro.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy/10 text-lg font-bold text-navy">
            {pro.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-navy">{pro.name}</h3>
              {pro.verified && (
                <BadgeCheck size={16} className="text-orange" aria-label="Verified" />
              )}
            </div>
            <p className="flex items-center gap-1 text-xs text-navy/50">
              <MapPin size={12} />
              {pro.town ? `${pro.town}, ` : ""}
              {pro.county}
              {typeof pro.distanceKm === "number" && (
                <span> · {pro.distanceKm.toFixed(1)} km away</span>
              )}
            </p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            pro.isOnline
              ? "bg-green-100 text-green-700"
              : "bg-navy/5 text-navy/40"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              pro.isOnline ? "bg-green-500" : "bg-navy/30"
            }`}
          />
          {pro.isOnline ? "Online" : "Offline"}
        </span>
      </div>

      {pro.bio && <p className="line-clamp-2 text-sm text-navy/60">{pro.bio}</p>}

      <div className="flex flex-wrap gap-1.5">
        {pro.categories.slice(0, 3).map((c) => (
          <span
            key={c}
            className="rounded-full bg-navy/5 px-2.5 py-1 text-xs font-medium text-navy/70"
          >
            {c}
          </span>
        ))}
      </div>

      <StarRating rating={pro.ratingAvg} count={pro.ratingCount} />
    </Link>
  );
}
