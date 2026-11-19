import { NearbyRequestsList } from "@/components/dashboard/NearbyRequestsList";

export default function ProfessionalRequestsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">Nearby Requests</h1>
      <NearbyRequestsList />
    </div>
  );
}
