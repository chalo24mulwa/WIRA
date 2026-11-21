"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import { Check, Copy, Download } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function readOrigin() {
  return typeof window === "undefined" ? "" : window.location.origin;
}

type Campaign = { id: string; name: string; slug: string; description: string | null };

const BRAND_COLORS = [
  { name: "Navy", hex: "#0B1E3F" },
  { name: "Orange", hex: "#F7941D" },
  { name: "Gold", hex: "#F2C94C" },
];

function captionTemplates(link: string) {
  return [
    {
      platform: "WhatsApp",
      text: `Need a trusted fundi, electrician, plumber or cleaner near you? 🇰🇪 I use WIRA to find verified professionals in minutes. Try it here: ${link}`,
    },
    {
      platform: "Facebook",
      text: `Looking for a reliable professional for your next job? WIRA connects you with verified, rated professionals across Kenya — plumbing, electrical, cleaning, carpentry and more. Sign up here: ${link}`,
    },
    {
      platform: "Instagram",
      text: `Trusted professionals, one tap away 🛠️ Join WIRA and get matched with verified fundis near you. Link in bio or tap here: ${link}`,
    },
    {
      platform: "TikTok",
      text: `POV: you needed a plumber at 9pm and WIRA found you a verified one in minutes 😅 Try it yourself: ${link}`,
    },
  ];
}

export function AffiliateResources() {
  const { data } = useSWR<{ affiliate: { referralCode: string | null } }>("/api/affiliates/me", fetcher);
  const { data: campaignData } = useSWR<{ campaigns: Campaign[] }>("/api/affiliates/me/campaigns", fetcher);
  const [origin] = useState(readOrigin);
  const [campaignSlug, setCampaignSlug] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const code = data?.affiliate.referralCode;
  const link = useMemo(() => {
    if (!code || !origin) return "";
    return campaignSlug ? `${origin}/r/${code}?c=${campaignSlug}` : `${origin}/r/${code}`;
  }, [origin, code, campaignSlug]);

  function copy(text: string, index: number) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  }

  const campaigns = campaignData?.campaigns ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-navy">Generate a campaign link</h3>
        <p className="mt-1 text-xs text-navy/50">
          Tag your link to a campaign so its performance shows up separately on your dashboard.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <select
            value={campaignSlug}
            onChange={(e) => setCampaignSlug(e.target.value)}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
          >
            <option value="">No campaign — general link</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            readOnly
            value={link}
            className="min-w-[220px] flex-1 rounded-lg border border-black/10 bg-navy/[0.03] px-3 py-2 text-sm text-navy outline-none"
          />
          <button
            onClick={() => copy(link, -1)}
            className="flex items-center gap-1.5 rounded-lg wira-gradient-cta px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:opacity-90"
          >
            {copiedIndex === -1 ? <Check size={15} /> : <Copy size={15} />}
            {copiedIndex === -1 ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-navy">Ready-to-post captions</h3>
        <p className="mt-1 text-xs text-navy/50">Your link is already inserted — copy and post.</p>
        <div className="mt-3 space-y-3">
          {captionTemplates(link || "your-link").map((t, i) => (
            <div key={t.platform} className="rounded-xl bg-navy/[0.03] p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-orange">{t.platform}</span>
                <button
                  onClick={() => copy(t.text, i)}
                  className="flex items-center gap-1 text-xs font-semibold text-navy/60 hover:text-navy"
                >
                  {copiedIndex === i ? <Check size={13} /> : <Copy size={13} />}
                  {copiedIndex === i ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="mt-1.5 text-sm text-navy/80">{t.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-navy">Brand assets</h3>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-black/10 p-3">
            <Image src="/wira-logo.png" alt="WIRA logo" width={120} height={32} className="h-8 w-auto" />
            <a
              href="/wira-logo.png"
              download
              className="flex items-center gap-1 text-xs font-semibold text-orange hover:underline"
            >
              <Download size={13} /> Download logo
            </a>
          </div>
          {BRAND_COLORS.map((c) => (
            <div key={c.hex} className="flex items-center gap-2 text-xs text-navy/60">
              <span className="h-6 w-6 rounded-full border border-black/10" style={{ backgroundColor: c.hex }} />
              {c.name} · {c.hex}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
