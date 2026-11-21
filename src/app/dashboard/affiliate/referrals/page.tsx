import { AffiliateReferralsList } from "@/components/affiliate/AffiliateReferralsList";

export default function AffiliateReferralsPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-navy">My Referrals</h1>
      <p className="mb-6 text-sm text-navy/60">
        Every member who registered through your link, and whether they&apos;ve verified their
        account yet.
      </p>
      <AffiliateReferralsList />
    </div>
  );
}
