import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "FAQs" };

const FAQS = [
  {
    q: "How do I find a professional near me?",
    a: "Use the search bar on the homepage or tap \"Find Professionals Near Me\" to use your GPS location, then filter by service category and county.",
  },
  {
    q: "Is it free to submit a service request?",
    a: "Yes, customers can submit service requests and compare quotations at no cost.",
  },
  {
    q: "How are professionals charged?",
    a: "Professionals subscribe to a plan (Free, Standard, Professional or Business). Only permanently confirmed bookings consume a credit from their plan.",
  },
  {
    q: "How do I know a professional is trustworthy?",
    a: "Check their profile for verification badges, uploaded credentials, ratings and reviews from previous customers before confirming a booking.",
  },
  {
    q: "What happens after I confirm a professional?",
    a: "You'll be able to track the booking's progress from confirmed, to in progress, to completed, and leave a review once the job is done.",
  },
];

export default function FaqsPage() {
  return (
    <StaticPage title="Frequently Asked Questions">
      <div className="space-y-6">
        {FAQS.map((item) => (
          <div key={item.q}>
            <h2 className="mb-1 text-base font-semibold text-navy">{item.q}</h2>
            <p className="text-navy/70">{item.a}</p>
          </div>
        ))}
      </div>
    </StaticPage>
  );
}
