import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompleteSignupForm } from "@/components/auth/CompleteSignupForm";

export const metadata: Metadata = {
  title: "Complete your signup",
  description: "Add a phone number to finish setting up your WIRA account.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CompleteSignupPage({ searchParams }: PageProps<"/complete-signup">) {
  const params = await searchParams;
  const userId = first(params.userId);
  const email = first(params.email);
  if (!userId || !email) redirect("/register");

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <CompleteSignupForm userId={userId} email={email} />
    </div>
  );
}
