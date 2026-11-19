import { AddWorkerForm } from "@/components/dashboard/AddWorkerForm";

export default function AddWorkerPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-navy">Register a Worker</h1>
      <p className="mb-6 text-sm text-navy/60">
        Add a professional to your agency&apos;s roster. They&apos;ll appear in search and hiring
        results immediately.
      </p>
      <AddWorkerForm />
    </div>
  );
}
