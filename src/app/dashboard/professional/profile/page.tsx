import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfessionalProfileForm } from "@/components/dashboard/ProfessionalProfileForm";

export default async function ProfessionalProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [categories, profile] = await Promise.all([
    prisma.serviceCategory.findMany({
      orderBy: { name: "asc" },
      include: { specializations: { orderBy: { name: "asc" } } },
    }),
    prisma.professionalProfile.findUnique({
      where: { userId: session.userId },
      include: {
        categories: { include: { category: true } },
        specializations: { include: { specialization: true } },
        credentials: { orderBy: { createdAt: "desc" } },
        portfolioPhotos: { orderBy: { createdAt: "desc" } },
      },
    }),
  ]);

  if (!profile) redirect("/dashboard/professional");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">My Profile</h1>
      <ProfessionalProfileForm categories={categories} profile={profile} />
    </div>
  );
}
