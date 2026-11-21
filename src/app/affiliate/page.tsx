import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, LineChart, Link2, Wallet } from "lucide-react";
import { getPlatformSettings } from "@/lib/platform-settings";

export const metadata: Metadata = {
  title: "Affiliate Program",
  description: "Earn commissions promoting WIRA to new customers and professionals.",
};

const STEPS = [
  {
    icon: BadgeCheck,
    title: "Apply & get approved",
    desc: "Tell us about yourself or your agency. Once the WIRA team approves your application, your affiliate dashboard activates.",
  },
  {
    icon: Link2,
    title: "Share your referral link",
    desc: "You get a unique link for WhatsApp, Facebook, Instagram, TikTok — anywhere your audience is.",
  },
  {
    icon: LineChart,
    title: "Track every referral",
    desc: "Watch new members move from pending to verified in real time on your dashboard.",
  },
  {
    icon: Wallet,
    title: "Get paid",
    desc: "Earn a fixed commission for every genuine, verified new member — paid out via M-Pesa.",
  },
];

export default async function AffiliateProgramPage() {
  const settings = await getPlatformSettings();

  return (
    <div>
      <section className="bg-navy">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <span className="inline-block rounded-full bg-gradient-to-r from-orange to-gold px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
            WIRA Affiliate Program
          </span>
          <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-bold text-white sm:text-4xl">
            Earn KSh {settings.affiliateDefaultCommission.toLocaleString()} for every genuine new
            member you bring to WIRA
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Join our team of digital marketing partners. Share your link, grow Kenya&apos;s
            trusted professional services marketplace, and get paid for real, verified members —
            no caps on how many you refer.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/affiliate/apply"
              className="wira-gradient-cta rounded-full px-6 py-3 text-sm font-semibold text-navy shadow-sm hover:opacity-90 transition-opacity"
            >
              Apply to become an affiliate
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              I&apos;m already an affiliate — Log in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-navy">How it works</h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange/10 text-orange">
                <step.icon size={20} />
              </span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-navy/40">
                Step {i + 1}
              </p>
              <h3 className="mt-1 font-semibold text-navy">{step.title}</h3>
              <p className="mt-1 text-sm text-navy/60">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy/[0.03]">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-navy">Commission structure</h2>
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-orange/20 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-navy/60">Per genuine, verified new member</p>
            <p className="mt-2 text-4xl font-bold text-orange">
              KSh {settings.affiliateDefaultCommission.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-navy/60">
              A referral counts once the new member finishes email and phone verification —
              self-referrals, duplicate accounts and unverified signups are never paid.
            </p>
            <p className="mt-4 text-xs text-navy/40">
              Minimum payout: KSh {settings.affiliateMinPayoutThreshold.toLocaleString()} ·
              Commission rates are set by WIRA and may vary by campaign.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-navy">Ready to start earning?</h2>
        <p className="mt-2 text-navy/60">
          Applications are reviewed by the WIRA team — approval usually takes a short while.
        </p>
        <Link
          href="/affiliate/apply"
          className="mt-6 inline-block wira-gradient-cta rounded-full px-6 py-3 text-sm font-semibold text-navy shadow-sm hover:opacity-90 transition-opacity"
        >
          Apply now
        </Link>
      </section>
    </div>
  );
}
