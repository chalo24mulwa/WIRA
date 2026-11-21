"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { GoOnlineToggle } from "@/components/GoOnlineToggle";

export function NavUserMenu({
  name,
  role,
}: {
  name: string;
  role: "CUSTOMER" | "PROFESSIONAL" | "ADMIN" | "AFFILIATE";
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const dashboardHref =
    role === "ADMIN"
      ? "/admin"
      : role === "PROFESSIONAL"
      ? "/dashboard/professional"
      : role === "AFFILIATE"
      ? "/dashboard/affiliate"
      : "/dashboard/customer";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {role === "PROFESSIONAL" && <GoOnlineToggle />}
      <NotificationBell />
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-full border border-navy/10 px-3 py-1.5 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors"
        >
          {name.split(" ")[0]}
          <ChevronDown size={15} />
        </button>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-black/5 bg-white py-1 shadow-lg">
              <Link
                href={dashboardHref}
                className="flex items-center gap-2 px-4 py-2 text-sm text-navy hover:bg-navy/5"
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
