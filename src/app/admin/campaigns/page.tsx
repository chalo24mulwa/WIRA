import { AdminCampaignsTable } from "@/components/admin/AdminCampaignsTable";

export default function AdminCampaignsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">Campaigns</h1>
      <AdminCampaignsTable />
    </div>
  );
}
