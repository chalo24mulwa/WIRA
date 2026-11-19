import { CustomerBookingsList } from "@/components/dashboard/CustomerBookingsList";

export default function CustomerBookingsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-navy">My Bookings</h1>
      <CustomerBookingsList />
    </div>
  );
}
