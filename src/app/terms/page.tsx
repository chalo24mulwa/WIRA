import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Service" subtitle="Last updated: 2026">
      <p>
        By using WIRA, you agree to these terms. WIRA is a marketplace that
        connects customers with independent professional service providers.
        WIRA is not the employer of any professional listed on the platform.
      </p>
      <h2>Accounts</h2>
      <p>
        You are responsible for the accuracy of the information you provide
        and for keeping your account credentials secure.
      </p>
      <h2>Bookings & Payments</h2>
      <p>
        Pricing for jobs is agreed directly between the customer and the
        professional through quotations. Professional subscription plans and
        credits govern how many confirmed bookings a professional can accept
        within a billing period.
      </p>
      <h2>Conduct</h2>
      <p>
        Users must provide accurate information and treat one another with
        respect. WIRA may suspend accounts that violate these terms or engage
        in fraudulent activity.
      </p>
    </StaticPage>
  );
}
