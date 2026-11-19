import Link from "next/link";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { NavUserMenu } from "@/components/NavUserMenu";
import { MobileNav } from "@/components/MobileNav";

export async function Navbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <MobileNav />
          <Logo />
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-navy/80 md:flex">
          <Link href="/search" className="hover:text-orange transition-colors">
            Find a Professional
          </Link>
          <Link href="/#how-it-works" className="hover:text-orange transition-colors">
            How It Works
          </Link>
          <Link href="/#categories" className="hover:text-orange transition-colors">
            Services
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {session ? (
            <NavUserMenu name={session.name} role={session.role} />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="wira-gradient-cta rounded-full px-4 py-2 text-sm font-semibold text-navy shadow-sm hover:opacity-90 transition-opacity"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
