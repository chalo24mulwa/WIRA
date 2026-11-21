import { AffiliatePayoutsList } from "@/components/affiliate/AffiliatePayoutsList";

export default function AffiliatePayoutsPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-navy">Payouts</h1>
      <p className="mb-6 text-sm text-navy/60">Your commission payout history.</p>
      <AffiliatePayoutsList />
    </div>
  );
}
