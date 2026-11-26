import { createRemoteJWKSet, jwtVerify } from "jose";

export const GOOGLE_STATE_COOKIE = "wira_google_oauth_state";
const GOOGLE_STATE_MAX_AGE = 600; // 10 minutes

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export function isGoogleAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function googleRedirectUri(origin: string) {
  return `${origin}/api/auth/google/callback`;
}

export type GoogleOAuthState = {
  nonce: string;
  mode: "login" | "register";
  role: "CUSTOMER" | "PROFESSIONAL";
};

export function buildGoogleAuthorizeUrl(redirectUri: string, nonce: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", nonce);
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("access_type", "online");
  return url.toString();
}

export async function exchangeGoogleCode(code: string, redirectUri: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${await res.text()}`);
  }
  return res.json() as Promise<{ id_token: string; access_token: string }>;
}

export type GoogleIdentity = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
};

/**
 * Verifies the ID token's signature against Google's own published keys
 * (fetched live, cached by jose) and checks issuer/audience — this is what
 * actually proves the token came from Google and names this app, rather
 * than trusting the payload at face value.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const email = typeof payload.email === "string" ? payload.email : "";
  if (!email) throw new Error("Google did not return an email address.");

  return {
    sub: String(payload.sub),
    email,
    emailVerified: payload.email_verified === true,
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : email.split("@")[0],
  };
}

export { GOOGLE_STATE_MAX_AGE };
