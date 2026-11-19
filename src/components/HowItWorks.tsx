import { ClipboardList, Handshake, Search, Star } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardList,
    title: "Post Your Job",
    description: "Describe what you need done and add photos of the job.",
  },
  {
    icon: Search,
    title: "Get Quotations",
    description: "Verified professionals near you send their quotes.",
  },
  {
    icon: Handshake,
    title: "Hire With Confidence",
    description: "Compare profiles, ratings and prices, then confirm your pick.",
  },
  {
    icon: Star,
    title: "Rate The Job",
    description: "Leave a review once the work is done to help others choose.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-navy/[0.03] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">How WIRA Works</h2>
          <p className="mt-2 text-navy/60">
            Getting trusted help is simple and straightforward.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <div
              key={step.title}
              className="relative rounded-2xl bg-white p-6 shadow-sm"
            >
              <span className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full wira-gradient-cta text-xs font-bold text-navy">
                {index + 1}
              </span>
              <step.icon className="text-orange" size={28} />
              <h3 className="mt-4 font-semibold text-navy">{step.title}</h3>
              <p className="mt-1 text-sm text-navy/60">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
