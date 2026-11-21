import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AFF_REF_COOKIE, AFF_CAMPAIGN_COOKIE, AFF_COOKIE_MAX_AGE } from "@/lib/affiliate";

/**
 * An affiliate's shareable link: /r/THEIRCODE (optionally ?c=campaign-slug).
 * Sets a 30-day attribution cookie and sends the visitor to the homepage —
 * registering at any point within that window, from any page, attributes
 * the referral. Always redirects, even for an unknown code, so a mistyped
 * or expired link just quietly lands on the homepage instead of erroring.
 */
export async function GET(
  request: Request,
  { params }: RouteContext<"/r/[code]">
) {
  const { code } = await params;
  const { searchParams, origin } = new URL(request.url);
  const campaignSlug = searchParams.get("c");

  const response = NextResponse.redirect(new URL("/", origin));

  const affiliate = await prisma.affiliate.findUnique({ where: { referralCode: code.toUpperCase() } });
  if (affiliate && affiliate.status === "APPROVED") {
    response.cookies.set(AFF_REF_COOKIE, affiliate.referralCode!, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: AFF_COOKIE_MAX_AGE,
    });

    if (campaignSlug) {
      const campaign = await prisma.campaign.findUnique({ where: { slug: campaignSlug } });
      if (campaign?.isActive) {
        response.cookies.set(AFF_CAMPAIGN_COOKIE, campaign.slug, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: AFF_COOKIE_MAX_AGE,
        });
      }
    }
  }

  return response;
}
