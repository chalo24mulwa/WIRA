import { prisma } from "@/lib/prisma";
import { NewRequestForm } from "@/components/dashboard/NewRequestForm";

export default async function NewRequestPage() {
  const categories = await prisma.serviceCategory.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-navy">New Service Request</h1>
      <p className="mb-6 text-sm text-navy/60">
        Tell us what you need and we&apos;ll notify nearby professionals.
      </p>
      <NewRequestForm categories={categories} />
    </div>
  );
}
