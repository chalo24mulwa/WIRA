import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LayoutDashboard, Settings, ShieldCheck, Users, Wallet } from "lucide-react";

const ADMIN_LINKS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/accounts", label: "Accounts", icon: Users },
  { href: "/admin/hiring", label: "Hiring Requests", icon: ShieldCheck },
  { href: "/admin/wallets", label: "Wallets", icon: Wallet },
  { href: "/admin/settings", label: "Pricing Settings", icon: Settings },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
      <aside className="shrink-0 lg:w-64">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 px-2 pb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-white">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">{session.name}</p>
              <p className="text-xs text-navy/50">WIRA Admin</p>
            </div>
          </div>
          <nav className="flex flex-row gap-1 overflow-x-auto pt-2 lg:flex-col lg:overflow-visible">
            {ADMIN_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-navy/70 hover:bg-navy/5 hover:text-navy transition-colors"
              >
                <link.icon size={16} />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
