import { PricingSettingsForm } from "@/components/admin/PricingSettingsForm";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-navy">Pricing Settings</h1>
      <p className="mb-6 text-sm text-navy/60">
        Changes apply immediately — no code change or redeploy required.
      </p>
      <PricingSettingsForm />
    </div>
  );
}
