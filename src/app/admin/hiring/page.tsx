import { AdminHiringTable } from "@/components/admin/AdminHiringTable";

export default function AdminHiringPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">Hiring Requests</h1>
      <AdminHiringTable />
    </div>
  );
}
