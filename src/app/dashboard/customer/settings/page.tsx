import { AccountSecurityPanel } from "@/components/dashboard/AccountSecurityPanel";

export default function CustomerSettingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">Account Settings</h1>
      <AccountSecurityPanel />
    </div>
  );
}
