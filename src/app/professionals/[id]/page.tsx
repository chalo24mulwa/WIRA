import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, Radius } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StarRating } from "@/components/StarRating";

async function getProfile(id: string) {
  return prisma.professionalProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      categories: { include: { category: true } },
      specializations: { include: { specialization: true } },
      credentials: { orderBy: { createdAt: "desc" } },
      portfolioPhotos: { orderBy: { createdAt: "desc" } },
      reviewsReceived: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { customer: { select: { name: true } } },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps<"/professionals/[id]">): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) return { title: "Professional not found" };
  return {
    title: profile.user.name,
    description: profile.bio ?? `${profile.user.name} — ${profile.county}, Kenya`,
  };
}

export default async function ProfessionalPublicPage({
  params,
}: PageProps<"/professionals/[id]">) {
  const { id } = await params;
  const profile = await getProfile(id);
  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy/10 text-2xl font-bold text-navy">
            {profile.user.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold text-navy">{profile.user.name}</h1>
              {profile.verified && <BadgeCheck size={18} className="text-orange" />}
            </div>
            <p className="flex items-center gap-1 text-sm text-navy/50">
              <MapPin size={13} />
              {profile.town ? `${profile.town}, ` : ""}
              {profile.county}
            </p>
            <div className="mt-1">
              <StarRating rating={profile.ratingAvg} count={profile.ratingCount} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              profile.isOnline ? "bg-green-100 text-green-700" : "bg-navy/5 text-navy/40"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${profile.isOnline ? "bg-green-500" : "bg-navy/30"}`} />
            {profile.isOnline ? "Online now" : "Offline"}
          </span>
          <Link
            href="/dashboard/customer/requests/new"
            className="rounded-full wira-gradient-cta px-5 py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90"
          >
            Request a Service
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {profile.bio && (
            <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h2 className="mb-2 font-semibold text-navy">About</h2>
              <p className="text-sm text-navy/70">{profile.bio}</p>
            </section>
          )}

          <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-navy">Services & Specializations</h2>
            <div className="flex flex-wrap gap-2">
              {profile.categories.map((c) => (
                <span
                  key={c.categoryId}
                  className="rounded-full bg-navy/5 px-3 py-1 text-sm font-medium text-navy/70"
                >
                  {c.category.name}
                </span>
              ))}
            </div>
            {profile.specializations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.specializations.map((s) => (
                  <span
                    key={s.specializationId}
                    className="rounded-full border border-orange/30 bg-orange/5 px-3 py-1 text-xs font-medium text-orange"
                  >
                    {s.specialization.name}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-navy/50">
              <Radius size={13} />
              Serves within {profile.serviceRadiusKm} km of {profile.town || profile.county}
            </p>
          </section>

          {profile.portfolioPhotos.length > 0 && (
            <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-navy">Portfolio</h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {profile.portfolioPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square overflow-hidden rounded-lg border border-black/5"
                  >
                    <Image src={photo.url} alt={photo.caption ?? ""} fill className="object-cover" sizes="150px" />
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-navy">
              Reviews ({profile.reviewsReceived.length})
            </h2>
            {profile.reviewsReceived.length === 0 ? (
              <p className="text-sm text-navy/50">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {profile.reviewsReceived.map((r) => (
                  <div key={r.id} className="border-b border-black/5 pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-navy">{r.customer.name}</p>
                      <StarRating rating={r.rating} size={12} />
                    </div>
                    {r.comment && <p className="mt-1 text-sm text-navy/60">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-navy">Credentials</h2>
            {profile.credentials.length === 0 ? (
              <p className="text-sm text-navy/50">No credentials uploaded yet.</p>
            ) : (
              <ul className="space-y-2">
                {profile.credentials.map((c) => (
                  <li key={c.id}>
                    <a
                      href={c.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-orange hover:underline"
                    >
                      {c.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
