import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const AFF_REF_COOKIE = "wira_aff_ref";
export const AFF_CAMPAIGN_COOKIE = "wira_aff_campaign";
export const AFF_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L — avoids misreads when shared verbally

export function generateReferralCodeCandidate() {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export async function generateUniqueReferralCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateReferralCodeCandidate();
    const existing = await prisma.affiliate.findUnique({ where: { referralCode: candidate } });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique referral code. Try again.");
}

/** First name plus the first letter of the last name, e.g. "Sarah C." — enough for an affiliate to recognize their own referral history without exposing a member's full identity. */
export function maskMemberName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

/**
 * Reads the referral attribution cookies set by /r/[code], validates the
 * affiliate is approved, and — unless this looks like a self-referral —
 * creates a PENDING Referral row linking the new user to that affiliate.
 * Called once, right after a brand-new User is created at registration;
 * never retroactively, so existing members can never be "referred".
 */
export async function attributeReferralIfPresent(params: {
  newUserId: string;
  newUserEmail: string;
  newUserPhoneNormalized: string | null;
}) {
  const cookieStore = await cookies();
  const code = cookieStore.get(AFF_REF_COOKIE)?.value;
  if (!code) return;

  const campaignSlug = cookieStore.get(AFF_CAMPAIGN_COOKIE)?.value;

  const affiliate = await prisma.affiliate.findUnique({
    where: { referralCode: code },
    include: { user: true },
  });

  // Always clear the cookies after one attempt — attribution is one-shot,
  // win or lose, so a stale or invalid code never lingers across sessions.
  cookieStore.delete(AFF_REF_COOKIE);
  cookieStore.delete(AFF_CAMPAIGN_COOKIE);

  if (!affiliate || affiliate.status !== "APPROVED") return;

  // Self-referral guard: the affiliate's own email or phone appearing as the
  // "new member" is the one case we can reliably detect without the member
  // completing the same email/phone-uniqueness gate that already prevents
  // simple duplicate-account abuse.
  const isSelf =
    affiliate.user.email === params.newUserEmail ||
    (params.newUserPhoneNormalized && affiliate.user.phoneNormalized === params.newUserPhoneNormalized);
  if (isSelf) return;

  const campaign =
    campaignSlug && campaignSlug.length > 0
      ? await prisma.campaign.findUnique({ where: { slug: campaignSlug } })
      : null;

  await prisma.referral.create({
    data: {
      affiliateId: affiliate.id,
      referredUserId: params.newUserId,
      referralCode: code,
      campaignId: campaign && campaign.isActive ? campaign.id : null,
    },
  });
}

/**
 * Called when a referred member finishes email+phone verification —
 * promotes their Referral from PENDING to ELIGIBLE and creates the
 * commission for it, using whichever rate was configured at that moment
 * (snapshotted onto the Commission row so a later rate change never
 * rewrites history). A unique constraint on Referral.referredUserId and on
 * Commission.referralId makes this safe to call even if it somehow ran
 * twice — the second attempt creating a commission would collide and fail.
 */
export async function markReferralEligible(referredUserId: string) {
  const referral = await prisma.referral.findUnique({
    where: { referredUserId },
    include: { campaign: true },
  });
  if (!referral || referral.status !== "PENDING") return;

  const settings = await prisma.platformSettings.findUnique({ where: { id: "singleton" } });
  const amount = referral.campaign?.commissionOverride ?? settings?.affiliateDefaultCommission ?? 500;

  await prisma.$transaction([
    prisma.referral.update({
      where: { id: referral.id },
      data: { status: "ELIGIBLE", eligibleAt: new Date() },
    }),
    prisma.commission.create({
      data: {
        affiliateId: referral.affiliateId,
        referralId: referral.id,
        amount,
      },
    }),
  ]);
}
