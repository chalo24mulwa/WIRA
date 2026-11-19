import { CompanyProfileForm } from "@/components/dashboard/CompanyProfileForm";

export default function CompanyProfilePage() {
  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-2xl font-bold text-navy">Company Profile</h1>
      <CompanyProfileForm />
    </div>
  );
}
