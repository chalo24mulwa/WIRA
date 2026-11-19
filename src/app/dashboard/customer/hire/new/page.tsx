import { HiringRequestForm } from "@/components/dashboard/HiringRequestForm";

export default function NewHiringRequestPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold text-navy">New Hiring Request</h1>
      <p className="mb-6 text-sm text-navy/60">
        Send one consolidated offer to all selected professionals.
      </p>
      <HiringRequestForm />
    </div>
  );
}
