import Link from "next/link";
import { ShieldCheck, Users, Zap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { KENYAN_COUNTIES } from "@/lib/constants";
import { HomeSearchBar } from "@/components/HomeSearchBar";
import { CategoryExplorer } from "@/components/CategoryExplorer";
import { LocationCard } from "@/components/LocationCard";
import { HowItWorks } from "@/components/HowItWorks";

export default async function HomePage() {
  const categories = await prisma.serviceCategory.findMany({
    orderBy: { name: "asc" },
    include: { specializations: { orderBy: { name: "asc" } } },
  });

  const popularSkills = categories
    .flatMap((c) => c.specializations.slice(0, 2))
    .slice(0, 14);

  return (
    <div>
      {/* Hero */}
      <section className="wira-gradient relative overflow-hidden text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gold">
              Kenya&apos;s Professional Services Marketplace
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Find Trusted Professionals{" "}
              <span className="wira-text-gradient">Near You.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/80 sm:text-lg">
              Connect with verified plumbers, electricians, carpenters,
              mechanics, masons, painters and other skilled professionals near
              you.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full wira-gradient-cta px-6 py-3 text-sm font-semibold text-navy shadow-lg hover:opacity-90 transition-opacity"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>

          <div className="mt-10 max-w-3xl">
            <HomeSearchBar
              categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            />
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-orange" />
            <p className="text-sm font-medium text-navy/70">
              Verified, credentialed professionals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="text-orange" />
            <p className="text-sm font-medium text-navy/70">
              GPS-powered nearby discovery
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Users className="text-orange" />
            <p className="text-sm font-medium text-navy/70">
              Compare quotes before you hire
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-navy sm:text-3xl">
              Popular Service Categories
            </h2>
            <p className="mt-1 text-navy/60">
              Browse the services our professionals specialize in.
            </p>
          </div>
          <Link
            href="/search"
            className="hidden text-sm font-semibold text-orange hover:underline sm:block"
          >
            View all →
          </Link>
        </div>
        <CategoryExplorer categories={categories} />
      </section>

      {/* Popular skills */}
      <section className="bg-navy/[0.03] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">
            Popular Skills & Specializations
          </h2>
          <p className="mt-1 text-navy/60">
            Find professionals with these in-demand skills.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {popularSkills.map((skill) => (
              <Link
                key={skill.id}
                href={`/search?specializationId=${skill.id}`}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-navy hover:border-orange hover:text-orange transition-colors"
              >
                {skill.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Locations */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-navy sm:text-3xl">
          Browse Professionals By Location
        </h2>
        <p className="mt-1 text-navy/60">
          Find professionals wherever you are in Kenya.
        </p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {KENYAN_COUNTIES.map((county) => (
            <LocationCard key={county} county={county} />
          ))}
        </div>
      </section>

      <HowItWorks />

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="wira-gradient relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready to get started with WIRA?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Whether you need a job done or you&apos;re a skilled professional
            looking for work, WIRA connects you fast.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/register?role=CUSTOMER"
              className="rounded-full wira-gradient-cta px-6 py-3 text-sm font-semibold text-navy shadow-lg hover:opacity-90 transition-opacity"
            >
              I need a professional
            </Link>
            <Link
              href="/register?role=PROFESSIONAL"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              I am a professional
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
