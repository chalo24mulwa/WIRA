import { HiringRequestDetail } from "@/components/dashboard/HiringRequestDetail";

export default async function HiringRequestDetailPage({
  params,
}: PageProps<"/dashboard/customer/hiring-requests/[id]">) {
  const { id } = await params;
  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-navy">Hiring Request</h1>
      <HiringRequestDetail id={id} />
    </div>
  );
}
