import { RequestDetail } from "@/components/dashboard/RequestDetail";

export default async function RequestDetailPage({
  params,
}: PageProps<"/dashboard/customer/requests/[id]">) {
  const { id } = await params;
  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-navy">Service Request</h1>
      <RequestDetail requestId={id} />
    </div>
  );
}
