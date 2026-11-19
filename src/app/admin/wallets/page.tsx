import { AdminWalletsTable } from "@/components/admin/AdminWalletsTable";

export default function AdminWalletsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">Wallets</h1>
      <AdminWalletsTable />
    </div>
  );
}
