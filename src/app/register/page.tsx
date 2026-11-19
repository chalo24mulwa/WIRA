import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Register",
  description: "Create your WIRA account as a customer or a professional.",
};

export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  const params = await searchParams;
  const roleParam = Array.isArray(params.role) ? params.role[0] : params.role;
  const defaultRole = roleParam === "PROFESSIONAL" ? "PROFESSIONAL" : "CUSTOMER";

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <RegisterForm defaultRole={defaultRole} />
    </div>
  );
}
