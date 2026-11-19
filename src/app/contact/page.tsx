import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { StaticPage } from "@/components/StaticPage";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  return (
    <StaticPage title="Contact Us" subtitle="We'd love to hear from you.">
      <div className="space-y-3 text-navy/80">
        <p className="flex items-center gap-2">
          <Mail size={16} className="text-orange" /> support@wira.co.ke
        </p>
        <p className="flex items-center gap-2">
          <Phone size={16} className="text-orange" /> +254 700 000 000
        </p>
        <p className="flex items-center gap-2">
          <MapPin size={16} className="text-orange" /> Nairobi, Kenya
        </p>
      </div>
      <p>
        For support with an active booking, please use the in-app
        notifications and dashboard tools first — our team monitors the
        platform and will step in for any disputes.
      </p>
    </StaticPage>
  );
}
