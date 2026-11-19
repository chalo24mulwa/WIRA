import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerifyAccountForm } from "@/components/auth/VerifyAccountForm";

export const metadata: Metadata = {
  title: "Verify your account",
  description: "Confirm your email and phone number to activate your WIRA account.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyPage({ searchParams }: PageProps<"/verify">) {
  const params = await searchParams;
  const userId = first(params.userId);
  if (!userId) redirect("/register");

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <VerifyAccountForm userId={userId} email={first(params.email)} phone={first(params.phone)} />
    </div>
  );
}
