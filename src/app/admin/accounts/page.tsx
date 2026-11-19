import { AccountsTable } from "@/components/admin/AccountsTable";

export default function AdminAccountsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">Accounts</h1>
      <AccountsTable />
    </div>
  );
}
