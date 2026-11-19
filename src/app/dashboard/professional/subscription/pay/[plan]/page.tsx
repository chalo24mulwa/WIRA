import { notFound } from "next/navigation";
import { MpesaCheckoutForm } from "@/components/dashboard/MpesaCheckoutForm";

const PAID_PLANS = ["STANDARD", "PROFESSIONAL", "BUSINESS"] as const;
type PaidPlan = (typeof PAID_PLANS)[number];

function isPaidPlan(value: string): value is PaidPlan {
  return (PAID_PLANS as readonly string[]).includes(value);
}

export default async function SubscriptionPayPage({
  params,
}: PageProps<"/dashboard/professional/subscription/pay/[plan]">) {
  const { plan } = await params;
  const planUpper = plan.toUpperCase();
  if (!isPaidPlan(planUpper)) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold text-navy">Pay with M-Pesa</h1>
      <p className="mb-6 text-sm text-navy/60">
        Confirm your subscription upgrade with an M-Pesa STK push.
      </p>
      <MpesaCheckoutForm plan={planUpper} />
    </div>
  );
}
