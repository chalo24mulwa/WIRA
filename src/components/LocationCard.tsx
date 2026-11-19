import Link from "next/link";
import { MapPin } from "lucide-react";

export function LocationCard({ county }: { county: string }) {
  return (
    <Link
      href={`/search?county=${encodeURIComponent(county)}`}
      className="group flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-navy transition-colors hover:border-orange hover:text-orange"
    >
      <MapPin size={15} className="text-orange" />
      {county}
    </Link>
  );
}
