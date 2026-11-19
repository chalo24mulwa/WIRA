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

  const isProfessionalArea = pathname.startsWith("/dashboard/professional");
  const isCustomerArea = pathname.startsWith("/dashboard/customer");

  if (isProfessionalArea && session.role !== "PROFESSIONAL") {
    return NextResponse.redirect(new URL("/dashboard/customer", request.url));
  }
  if (isCustomerArea && session.role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/dashboard/professional", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
