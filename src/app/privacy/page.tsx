import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" subtitle="Last updated: 2026">
      <p>
        We collect the information you provide when registering, such as your
        name, email, phone number and location, along with service requests,
        quotations and bookings you create, so that the marketplace can
        connect customers and professionals effectively.
      </p>
      <h2>Location data</h2>
      <p>
        With your permission, we use your device&apos;s GPS location to show
        you nearby professionals and to help professionals discover nearby
        requests. You can decline location access and search manually by
        county instead.
      </p>
      <h2>Data sharing</h2>
      <p>
        Profile details relevant to a booking (such as name and phone number)
        are shared between the customer and the professional involved in that
        booking. We do not sell your personal data to third parties.
      </p>
    </StaticPage>
  );
}
