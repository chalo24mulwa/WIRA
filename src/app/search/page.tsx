import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { searchProfessionals } from "@/lib/search-professionals";
import { ProfessionalCard } from "@/components/ProfessionalCard";
import { SearchFilters } from "@/components/SearchFilters";

export const metadata: Metadata = {
  title: "Find Professionals",
  description: "Search verified professionals near you in Kenya.",
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const get = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const categoryId = get("categoryId");
  const county = get("county");
  const specializationId = get("specializationId");
  const q = get("q");
  const lat = get("lat");
  const lng = get("lng");

  const [categories, professionals] = await Promise.all([
    prisma.serviceCategory.findMany({
      orderBy: { name: "asc" },
      include: { specializations: { orderBy: { name: "asc" } } },
    }),
    searchProfessionals({
      categoryId,
      county,
      specializationId,
      q,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">Find a Professional</h1>
      <p className="mt-1 text-navy/60">
        {professionals.length} professional{professionals.length === 1 ? "" : "s"} found
      </p>

      <div className="mt-6">
        <SearchFilters
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            specializations: c.specializations,
          }))}
          initial={{ categoryId, county, q, specializationId }}
        />
      </div>

      {professionals.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center text-navy/60">
          No professionals match your search yet. Try a different category or location.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {professionals.map((pro) => (
            <ProfessionalCard key={pro.id} pro={pro} />
          ))}
        </div>
      )}
    </div>
  );
}
