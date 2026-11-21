import { AffiliateResources } from "@/components/affiliate/AffiliateResources";

export default function AffiliateResourcesPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-navy">Marketing Resources</h1>
      <p className="mb-6 text-sm text-navy/60">
        Campaign links, ready-to-post captions and brand assets for promoting WIRA.
      </p>
      <AffiliateResources />
    </div>
  );
}
