import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-dark text-white/80">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="space-y-3">
          <Logo dark />
          <p className="text-sm text-white/60">
            Kenya&apos;s trusted marketplace connecting customers with verified
            professionals, near you.
          </p>
          <div className="space-y-1.5 pt-2 text-sm text-white/60">
            <p className="flex items-center gap-2">
              <Mail size={15} className="text-gold" /> support@wira.co.ke
            </p>
            <p className="flex items-center gap-2">
              <Phone size={15} className="text-gold" /> +254 700 000 000
            </p>
            <p className="flex items-center gap-2">
              <MapPin size={15} className="text-gold" /> Nairobi, Kenya
            </p>
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Company</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li><Link href="/about" className="hover:text-gold transition-colors">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-gold transition-colors">Contact</Link></li>
            <li><Link href="/faqs" className="hover:text-gold transition-colors">FAQs</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">For Professionals</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li><Link href="/register?role=PROFESSIONAL" className="hover:text-gold transition-colors">Join as a Professional</Link></li>
            <li><Link href="/#how-it-works" className="hover:text-gold transition-colors">How It Works</Link></li>
            <li><Link href="/dashboard/professional/subscription" className="hover:text-gold transition-colors">Subscription Plans</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold text-white">Legal</h4>
          <ul className="space-y-2 text-sm text-white/60">
            <li><Link href="/terms" className="hover:text-gold transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
        © WIRA Professional Services Marketplace. All rights reserved.
      </div>
    </footer>
  );
}
