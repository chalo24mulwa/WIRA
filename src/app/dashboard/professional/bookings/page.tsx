import { ProfessionalBookingsList } from "@/components/dashboard/ProfessionalBookingsList";

export default function ProfessionalBookingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">My Bookings</h1>
      <ProfessionalBookingsList />
    </div>
  );
}
