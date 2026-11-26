import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, hashPassword } from "@/lib/auth";
import { PLAN_DETAILS } from "@/lib/constants";
import { issueVerificationCode } from "@/lib/verification";
import { attributeReferralIfPresent } from "@/lib/affiliate";
import {
  GOOGLE_STATE_COOKIE,
  exchangeGoogleCode,
  googleRedirectUri,
  verifyGoogleIdToken,
  type GoogleOAuthState,
} from "@/lib/google-auth";

function loginError(origin: string, code: string) {
  return NextResponse.redirect(new URL(`/login?googleError=${code}`, origin));
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const returnedState = searchParams.get("state");

  const cookieStore = await cookies();
  const rawState = cookieStore.get(GOOGLE_STATE_COOKIE)?.value;

  const clearStateCookie = (response: NextResponse) => {
    response.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  };

  if (!code || !returnedState || !rawState) {
    return clearStateCookie(loginError(origin, "failed"));
  }

  let state: GoogleOAuthState;
  try {
    state = JSON.parse(rawState);
  } catch {
    return clearStateCookie(loginError(origin, "state_mismatch"));
  }
  if (state.nonce !== returnedState) {
    return clearStateCookie(loginError(origin, "state_mismatch"));
  }

  let identity;
  try {
    const tokens = await exchangeGoogleCode(code, googleRedirectUri(origin));
    identity = await verifyGoogleIdToken(tokens.id_token);
  } catch (error) {
    console.error("Google sign-in failed:", error);
    return clearStateCookie(loginError(origin, "failed"));
  }

  if (!identity.emailVerified) {
    return clearStateCookie(loginError(origin, "unverified_email"));
  }

  const existing = await prisma.user.findUnique({ where: { email: identity.email } });

  if (existing) {
    if (existing.isSuspended) {
      return clearStateCookie(loginError(origin, "suspended"));
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        googleId: existing.googleId ?? identity.sub,
        emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
      },
    });

    if (!updated.phoneVerifiedAt) {
      if (!updated.phone) {
        return clearStateCookie(
          NextResponse.redirect(
            new URL(`/complete-signup?userId=${updated.id}&email=${encodeURIComponent(updated.email)}`, origin)
          )
        );
      }
      const { devCode } = await issueVerificationCode(updated.id, "PHONE_VERIFY", updated.phoneNormalized!).catch(
        () => ({ devCode: undefined })
      );
      const verifyUrl = new URL("/verify", origin);
      verifyUrl.searchParams.set("userId", updated.id);
      verifyUrl.searchParams.set("email", updated.email);
      verifyUrl.searchParams.set("phone", updated.phone);
      verifyUrl.searchParams.set("needsEmailCode", "0");
      if (devCode) verifyUrl.searchParams.set("devPhoneCode", devCode);
      return clearStateCookie(NextResponse.redirect(verifyUrl));
    }

    await setSessionCookie({
      userId: updated.id,
      role: updated.role,
      accountKind: updated.accountKind,
      name: updated.name,
      email: updated.email,
    });

    const dest =
      updated.role === "ADMIN"
        ? "/admin"
        : updated.role === "PROFESSIONAL"
        ? "/dashboard/professional"
        : updated.role === "AFFILIATE"
        ? "/dashboard/affiliate"
        : "/dashboard/customer";
    return clearStateCookie(NextResponse.redirect(new URL(dest, origin)));
  }

  // Brand-new account. Google only vouches for the email, so phone — the
  // same one-per-account anti-fraud check every other signup goes through —
  // still has to be collected and verified before this account can log in.
  const user = await prisma.user.create({
    data: {
      name: identity.name,
      email: identity.email,
      passwordHash: await hashPassword(crypto.randomUUID()),
      googleId: identity.sub,
      role: state.role,
      accountKind: "INDIVIDUAL",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.walletAccount.create({ data: { userId: user.id, balance: 0 } });

  await attributeReferralIfPresent({
    newUserId: user.id,
    newUserEmail: user.email,
    newUserPhoneNormalized: null,
  });

  if (state.role === "PROFESSIONAL") {
    const professional = await prisma.professionalProfile.create({
      data: { userId: user.id, county: "Nairobi" },
    });
    await prisma.subscription.create({
      data: {
        professionalId: professional.id,
        plan: "FREE",
        creditsTotal: PLAN_DETAILS.FREE.credits,
        periodEnd: new Date(Date.now() + 30 * 86_400_000),
      },
    });
  }

  return clearStateCookie(
    NextResponse.redirect(new URL(`/complete-signup?userId=${user.id}&email=${encodeURIComponent(user.email)}`, origin))
  );
}
