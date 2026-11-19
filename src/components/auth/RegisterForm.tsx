"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Briefcase, Building2, User, Users } from "lucide-react";
import { KENYAN_COUNTIES } from "@/lib/constants";

type Role = "CUSTOMER" | "PROFESSIONAL";
type AccountKind = "INDIVIDUAL" | "COMPANY";

const ACCOUNT_KIND_COPY: Record<Role, Record<AccountKind, { icon: typeof User; title: string; desc: string }>> = {
  CUSTOMER: {
    INDIVIDUAL: {
      icon: User,
      title: "Individual",
      desc: "Personal, household or private projects",
    },
    COMPANY: {
      icon: Building2,
      title: "Company",
      desc: "Business, organization or institution",
    },
  },
  PROFESSIONAL: {
    INDIVIDUAL: {
      icon: Briefcase,
      title: "Individual Professional",
      desc: "Independent fundi, technician or artisan",
    },
    COMPANY: {
      icon: Users,
      title: "Company / Agency",
      desc: "Registered company offering multiple workers",
    },
  },
};

export function RegisterForm({ defaultRole }: { defaultRole: Role }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(defaultRole);
  const [accountKind, setAccountKind] = useState<AccountKind>("INDIVIDUAL");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [county, setCounty] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleRoleChange(next: Role) {
    setRole(next);
    setAccountKind("INDIVIDUAL");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role,
          accountKind,
          companyName: accountKind === "COMPANY" ? companyName : undefined,
          county,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      try {
        sessionStorage.setItem(
          `wira_dev_codes_${data.userId}`,
          JSON.stringify({ devEmailCode: data.devEmailCode, devPhoneCode: data.devPhoneCode })
        );
      } catch {
        // sessionStorage unavailable — the verify page just won't show a dev-mode hint
      }
      router.push(
        `/verify?userId=${encodeURIComponent(data.userId)}&email=${encodeURIComponent(data.email)}&phone=${encodeURIComponent(data.phone ?? "")}`
      );
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-2xl font-bold text-navy">Create your WIRA account</h1>
      <p className="mt-1 text-sm text-navy/60">
        Join Kenya&apos;s trusted professional services marketplace.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleRoleChange("CUSTOMER")}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition-colors ${
            role === "CUSTOMER"
              ? "border-orange bg-orange/5 text-orange"
              : "border-black/10 text-navy/60 hover:border-navy/20"
          }`}
        >
          <User size={22} />
          I need a service
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange("PROFESSIONAL")}
          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-sm font-semibold transition-colors ${
            role === "PROFESSIONAL"
              ? "border-orange bg-orange/5 text-orange"
              : "border-black/10 text-navy/60 hover:border-navy/20"
          }`}
        >
          <Briefcase size={22} />
          I offer services
        </button>
      </div>

      <div className="mt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy/40">
          Account type
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(["INDIVIDUAL", "COMPANY"] as const).map((kind) => {
            const copy = ACCOUNT_KIND_COPY[role][kind];
            const Icon = copy.icon;
            const selected = accountKind === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setAccountKind(kind)}
                className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-3.5 text-left transition-colors ${
                  selected
                    ? "border-orange bg-orange/5"
                    : "border-black/10 hover:border-navy/20"
                }`}
              >
                <Icon size={18} className={selected ? "text-orange" : "text-navy/50"} />
                <span className={`text-sm font-semibold ${selected ? "text-orange" : "text-navy"}`}>
                  {copy.title}
                </span>
                <span className="text-xs text-navy/50">{copy.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">
            {accountKind === "COMPANY" ? "Contact person's name" : "Full name"}
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            placeholder="Jane Wanjiku"
          />
        </div>

        {accountKind === "COMPANY" && (
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">
              {role === "PROFESSIONAL" ? "Company / Agency name" : "Company name"}
            </label>
            <input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
              placeholder="e.g. Jenga Build Co. Ltd"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-navy">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">Phone number</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            placeholder="07xx xxx xxx"
          />
          <p className="mt-1 text-xs text-navy/40">
            We&apos;ll text you a verification code — one phone number per account.
          </p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">County</label>
          <select
            required
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
          >
            <option value="">Select your county</option>
            {KENYAN_COUNTIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">Password</label>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            placeholder="At least 6 characters"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl wira-gradient-cta py-3 text-sm font-semibold text-navy shadow-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy/60">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-orange hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
