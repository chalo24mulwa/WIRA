import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  Bookmark,
  Briefcase,
  Building2,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  Mail,
  MessageCircle,
  Search,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { IncomingRequestAlert } from "@/components/dashboard/IncomingRequestAlert";
import { QuotationPopupAlert } from "@/components/dashboard/QuotationPopupAlert";

function customerLinks(accountKind: "INDIVIDUAL" | "COMPANY") {
  return [
    { href: "/dashboard/customer", label: "Overview", icon: LayoutDashboard },
    { href: "/search", label: "Find Professionals", icon: Search },
    { href: "/dashboard/customer/hire", label: accountKind === "COMPANY" ? "Hire Workers" : "Hire", icon: Briefcase },
    { href: "/dashboard/customer/hiring-requests", label: "My Hiring Requests", icon: ClipboardList },
    { href: "/dashboard/customer/requests/new", label: "New Service Request", icon: ClipboardList },
    { href: "/dashboard/customer/bookings", label: "My Bookings", icon: ListChecks },
    { href: "/dashboard/customer/saved", label: "Saved Professionals", icon: Bookmark },
    { href: "/dashboard/customer/wallet", label: "WIRA Coins Wallet", icon: Wallet },
    { href: "/dashboard/customer/messages", label: "Messages", icon: MessageCircle },
    ...(accountKind === "COMPANY"
      ? [{ href: "/dashboard/customer/company-profile", label: "Company Profile", icon: Building2 }]
      : []),
  ];
}

function professionalLinks(accountKind: "INDIVIDUAL" | "COMPANY") {
  return [
    { href: "/dashboard/professional", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/professional/requests", label: "Nearby Requests", icon: ClipboardList },
    { href: "/dashboard/professional/hiring-invitations", label: "Hiring Invitations", icon: Mail },
    { href: "/dashboard/professional/bookings", label: "My Bookings", icon: ListChecks },
    { href: "/dashboard/professional/messages", label: "Messages", icon: MessageCircle },
    { href: "/dashboard/professional/profile", label: "My Profile", icon: User },
    { href: "/dashboard/professional/subscription", label: "Subscription", icon: Wallet },
    ...(accountKind === "COMPANY"
      ? [
          { href: "/dashboard/professional/workers", label: "Worker Management", icon: Users },
          { href: "/dashboard/professional/company-profile", label: "Agency Profile", icon: Building2 },
        ]
      : []),
  ];
}

const ROLE_LABEL: Record<string, Record<string, string>> = {
  CUSTOMER: { INDIVIDUAL: "Individual Customer", COMPANY: "Company Customer" },
  PROFESSIONAL: { INDIVIDUAL: "Individual Professional", COMPANY: "Company / Agency" },
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await getSession();
  if (!session) redirect("/login");

  const links =
    session.role === "PROFESSIONAL"
      ? professionalLinks(session.accountKind)
      : customerLinks(session.accountKind);

  const HeaderIcon = session.accountKind === "COMPANY" ? Users : session.role === "PROFESSIONAL" ? Briefcase : User;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:px-8">
      <aside className="shrink-0 lg:w-64">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 px-2 pb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/5 text-navy">
              <HeaderIcon size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">{session.name}</p>
              <p className="text-xs text-navy/50">{ROLE_LABEL[session.role]?.[session.accountKind]}</p>
            </div>
          </div>
          <nav className="flex flex-row gap-1 overflow-x-auto pt-2 lg:flex-col lg:overflow-visible">
            {links.map((link) => (
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

      {session.role === "PROFESSIONAL" && <IncomingRequestAlert />}
      {session.role === "CUSTOMER" && <QuotationPopupAlert />}
    </div>
  );
}
