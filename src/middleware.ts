import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard") && !pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (session.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/customer", request.url));
    }
    return NextResponse.next();
  }

  const areaRole: Record<string, string> = {
    "/dashboard/professional": "PROFESSIONAL",
    "/dashboard/customer": "CUSTOMER",
    "/dashboard/affiliate": "AFFILIATE",
  };
  const roleHome: Record<string, string> = {
    PROFESSIONAL: "/dashboard/professional",
    CUSTOMER: "/dashboard/customer",
    AFFILIATE: "/dashboard/affiliate",
  };

  for (const [prefix, requiredRole] of Object.entries(areaRole)) {
    if (pathname.startsWith(prefix) && session.role !== requiredRole) {
      return NextResponse.redirect(new URL(roleHome[session.role] ?? "/dashboard/customer", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
