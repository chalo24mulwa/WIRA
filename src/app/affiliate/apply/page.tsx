import type { Metadata } from "next";
import { AffiliateApplyForm } from "@/components/affiliate/AffiliateApplyForm";

export const metadata: Metadata = {
  title: "Apply — Affiliate Program",
  description: "Apply to become a WIRA affiliate and start earning referral commissions.",
};

export default function AffiliateApplyPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <AffiliateApplyForm />
    </div>
  );
}
