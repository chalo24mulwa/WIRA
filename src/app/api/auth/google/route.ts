import { NextResponse } from "next/server";
import {
  GOOGLE_STATE_COOKIE,
  GOOGLE_STATE_MAX_AGE,
  buildGoogleAuthorizeUrl,
  googleRedirectUri,
  isGoogleAuthConfigured,
  type GoogleOAuthState,
} from "@/lib/google-auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(new URL("/login?googleError=not_configured", origin));
  }

  const mode = searchParams.get("mode") === "register" ? "register" : "login";
  const role = searchParams.get("role") === "PROFESSIONAL" ? "PROFESSIONAL" : "CUSTOMER";
  const nonce = crypto.randomUUID();

  const state: GoogleOAuthState = { nonce, mode, role };
  const authorizeUrl = buildGoogleAuthorizeUrl(googleRedirectUri(origin), nonce);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(GOOGLE_STATE_COOKIE, JSON.stringify(state), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: GOOGLE_STATE_MAX_AGE,
  });
  return response;
}
