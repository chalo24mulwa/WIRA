import { Star } from "lucide-react";

export function StarRating({
  rating,
  count,
  size = 14,
}: {
  rating: number;
  count?: number;
  size?: number;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex items-center">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={
              i < Math.round(rating)
                ? "fill-gold text-gold"
                : "fill-navy/10 text-navy/10"
            }
          />
        ))}
      </span>
      <span className="text-xs font-medium text-navy/60">
        {rating.toFixed(1)}
        {typeof count === "number" ? ` (${count})` : ""}
      </span>
    </span>
  );
}
