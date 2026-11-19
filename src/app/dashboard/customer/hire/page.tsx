import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchProfessionals } from "@/lib/search-professionals";
import { SearchFilters } from "@/components/SearchFilters";
import { HireBrowser } from "@/components/dashboard/HireBrowser";

export default async function HirePage({ searchParams }: PageProps<"/dashboard/customer/hire">) {
  const session = await getSession();
  const params = await searchParams;
  const get = (key: string) => {
    const v = params[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const categoryId = get("categoryId");
  const county = get("county");
  const specializationId = get("specializationId");
  const q = get("q");

  const [categories, professionals, saved] = await Promise.all([
    prisma.serviceCategory.findMany({
      orderBy: { name: "asc" },
      include: { specializations: { orderBy: { name: "asc" } } },
    }),
    searchProfessionals({ categoryId, county, specializationId, q }),
    prisma.savedProfessional.findMany({
      where: { customerId: session!.userId },
      select: { professionalId: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy sm:text-3xl">Hire Professionals</h1>
      <p className="mt-1 text-navy/60">
        Discover registered professionals, select one or many, and send a hiring offer.
      </p>

      <div className="mt-6">
        <SearchFilters
          categories={categories.map((c) => ({ id: c.id, name: c.name, specializations: c.specializations }))}
          initial={{ categoryId, county, q, specializationId }}
          basePath="/dashboard/customer/hire"
        />
      </div>

      <HireBrowser
        professionals={professionals}
        savedIds={saved.map((s) => s.professionalId)}
      />
    </div>
  );
}
