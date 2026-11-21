import { AdminAffiliateDetail } from "@/components/admin/AdminAffiliateDetail";

export default async function AdminAffiliateDetailPage({
  params,
}: PageProps<"/admin/affiliates/[id]">) {
  const { id } = await params;
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">Affiliate Detail</h1>
      <AdminAffiliateDetail id={id} />
    </div>
  );
}
