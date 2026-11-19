import Link from "next/link";
import { Plus } from "lucide-react";
import { HiringRequestsList } from "@/components/dashboard/HiringRequestsList";

export default function HiringRequestsPage() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">My Hiring Requests</h1>
        <Link
          href="/dashboard/customer/hire"
          className="flex items-center gap-1.5 rounded-full wira-gradient-cta px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:opacity-90"
        >
          <Plus size={16} />
          New Hiring Request
        </Link>
      </div>
      <HiringRequestsList />
    </div>
  );
}
