import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <StaticPage
      title="About WIRA"
      subtitle="Kenya's professional services marketplace."
    >
      <p>
        WIRA connects everyday Kenyans with verified, skilled professionals —
        plumbers, electricians, carpenters, mechanics, masons, painters and
        more — across Nairobi, Mombasa, Kisumu, Nakuru, Kiambu and every other
        county.
      </p>
      <p>
        Our mission is simple: make it fast, safe and transparent to find
        trusted help nearby, while giving skilled professionals a steady
        stream of real work opportunities close to home.
      </p>
      <h2>How we vet professionals</h2>
      <p>
        Professionals on WIRA register with their service categories,
        specializations and credentials, which customers can review before
        choosing who to hire. Ratings and reviews from completed jobs help
        keep quality high across the marketplace.
      </p>
    </StaticPage>
  );
}
