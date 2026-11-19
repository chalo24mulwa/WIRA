"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, X } from "lucide-react";
import { KENYAN_COUNTIES } from "@/lib/constants";
import { FundingPrompt } from "@/components/dashboard/FundingPrompt";
import { HIRE_SELECTION_KEY } from "@/components/dashboard/HireBrowser";

type SelectedPro = { id: string; name: string; categories: string[] };
type EmploymentType = "CONTRACT" | "PERMANENT";

function readSelectedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(HIRE_SELECTION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function HiringRequestForm() {
  const router = useRouter();
  const [ids] = useState<string[]>(readSelectedIds);
  const [loadingSelection, setLoadingSelection] = useState(ids.length > 0);
  const [selected, setSelected] = useState<SelectedPro[]>([]);

  const [employmentType, setEmploymentType] = useState<EmploymentType>("CONTRACT");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [numberRequired, setNumberRequired] = useState(1);
  const [workLocationCounty, setWorkLocationCounty] = useState("");
  const [workLocationTown, setWorkLocationTown] = useState("");
  const [salaryOrPayment, setSalaryOrPayment] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [startDate, setStartDate] = useState("");
  const [contractDurationDays, setContractDurationDays] = useState("");
  const [requiredQualifications, setRequiredQualifications] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");

  const [reviewing, setReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [funding, setFunding] = useState<{ pendingRequestId: string; required: number; available: number } | null>(
    null
  );

  useEffect(() => {
    if (ids.length === 0) return;
    fetch(`/api/professionals?ids=${ids.join(",")}`)
      .then((res) => res.json())
      .then((data) => {
        setSelected(
          (data.professionals ?? []).map((p: { id: string; name: string; categories: string[] }) => ({
            id: p.id,
            name: p.name,
            categories: p.categories,
          }))
        );
      })
      .finally(() => setLoadingSelection(false));
  }, [ids]);

  function removeSelected(id: string) {
    setSelected((prev) => {
      const next = prev.filter((p) => p.id !== id);
      sessionStorage.setItem(HIRE_SELECTION_KEY, JSON.stringify(next.map((p) => p.id)));
      return next;
    });
  }

  function buildPayload() {
    return {
      employmentType,
      jobTitle,
      jobDescription,
      numberRequired,
      workLocationCounty,
      workLocationTown,
      salaryOrPayment,
      workingHours,
      startDate: startDate || undefined,
      contractDurationDays: contractDurationDays ? Number(contractDurationDays) : undefined,
      requiredQualifications,
      additionalInstructions,
      professionalIds: selected.map((p) => p.id),
    };
  }

  function handleReview(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (selected.length === 0) {
      setError("Select at least one professional before continuing.");
      return;
    }
    if (!jobTitle || !jobDescription || !workLocationCounty || !salaryOrPayment) {
      setError("Please fill in all required fields.");
      return;
    }
    setReviewing(true);
  }

  async function handleSend() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/hiring-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send hiring request.");

      if (data.requiresFunding) {
        setFunding({
          pendingRequestId: data.hiringRequest.id,
          required: data.feeAmount,
          available: data.walletBalance,
        });
        setSubmitting(false);
        return;
      }

      sessionStorage.removeItem(HIRE_SELECTION_KEY);
      router.push(`/dashboard/customer/hiring-requests/${data.hiringRequest.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send hiring request.");
      setSubmitting(false);
    }
  }

  async function handleResumeAfterFunding() {
    if (!funding) return;
    const res = await fetch(`/api/hiring-requests/${funding.pendingRequestId}/resume`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not send the hiring request after funding.");
      return;
    }
    sessionStorage.removeItem(HIRE_SELECTION_KEY);
    router.push(`/dashboard/customer/hiring-requests/${funding.pendingRequestId}`);
  }

  if (loadingSelection) {
    return <p className="text-sm text-navy/50">Loading…</p>;
  }

  if (selected.length === 0 && !funding) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
        <Briefcase className="mx-auto mb-3 text-navy/30" size={32} />
        <p className="text-navy/60">No professionals selected yet.</p>
        <Link
          href="/dashboard/customer/hire"
          className="mt-4 inline-block rounded-full wira-gradient-cta px-5 py-2.5 text-sm font-semibold text-navy hover:opacity-90"
        >
          Browse professionals
        </Link>
      </div>
    );
  }

  if (funding) {
    return (
      <FundingPrompt
        label="send this hiring request"
        requiredAmount={funding.required}
        availableAmount={funding.available}
        onFunded={handleResumeAfterFunding}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-navy">
          Selected professionals ({selected.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {selected.map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1.5 rounded-full bg-navy/5 px-3 py-1.5 text-sm font-medium text-navy"
            >
              {p.name}
              {!reviewing && (
                <button onClick={() => removeSelected(p.id)} aria-label="Remove">
                  <X size={13} />
                </button>
              )}
            </span>
          ))}
        </div>
      </div>

      {!reviewing ? (
        <form onSubmit={handleReview} className="space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEmploymentType("CONTRACT")}
              className={`rounded-xl border-2 p-3 text-sm font-semibold transition-colors ${
                employmentType === "CONTRACT"
                  ? "border-orange bg-orange/5 text-orange"
                  : "border-black/10 text-navy/60"
              }`}
            >
              Contract Hiring
            </button>
            <button
              type="button"
              onClick={() => setEmploymentType("PERMANENT")}
              className={`rounded-xl border-2 p-3 text-sm font-semibold transition-colors ${
                employmentType === "PERMANENT"
                  ? "border-orange bg-orange/5 text-orange"
                  : "border-black/10 text-navy/60"
              }`}
            >
              Permanent Hiring
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-navy">Job title</label>
            <input
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
              placeholder="e.g. Site Electrician"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-navy">Job description</label>
            <textarea
              required
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Number required</label>
              <input
                type="number"
                min={1}
                value={numberRequired}
                onChange={(e) => setNumberRequired(Number(e.target.value))}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">
                {employmentType === "CONTRACT" ? "Agreed payment (KSh)" : "Monthly salary (KSh)"}
              </label>
              <input
                required
                value={salaryOrPayment}
                onChange={(e) => setSalaryOrPayment(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
                placeholder="e.g. 30,000 - 45,000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Work location — county</label>
              <select
                required
                value={workLocationCounty}
                onChange={(e) => setWorkLocationCounty(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
              >
                <option value="">Select county</option>
                {KENYAN_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Town / Area</label>
              <input
                value={workLocationTown}
                onChange={(e) => setWorkLocationTown(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Working hours</label>
              <input
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
                placeholder="e.g. Mon–Sat, 8am–5pm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
              />
            </div>
          </div>

          {employmentType === "CONTRACT" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Contract duration (days)</label>
              <input
                type="number"
                min={1}
                value={contractDurationDays}
                onChange={(e) => setContractDurationDays(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-navy">Required qualifications</label>
            <textarea
              rows={2}
              value={requiredQualifications}
              onChange={(e) => setRequiredQualifications(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-navy">
              {employmentType === "PERMANENT" ? "Additional benefits & instructions" : "Additional instructions"}
            </label>
            <textarea
              rows={2}
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="rounded-xl wira-gradient-cta px-6 py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90"
          >
            Review Offer
          </button>
        </form>
      ) : (
        <div className="space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-navy">Review your hiring request</h2>
          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-navy/50">Employment type</dt>
              <dd className="font-medium text-navy">{employmentType === "CONTRACT" ? "Contract" : "Permanent"}</dd>
            </div>
            <div>
              <dt className="text-navy/50">Job title</dt>
              <dd className="font-medium text-navy">{jobTitle}</dd>
            </div>
            <div>
              <dt className="text-navy/50">Number required</dt>
              <dd className="font-medium text-navy">{numberRequired}</dd>
            </div>
            <div>
              <dt className="text-navy/50">Payment</dt>
              <dd className="font-medium text-navy">KSh {salaryOrPayment}</dd>
            </div>
            <div>
              <dt className="text-navy/50">Location</dt>
              <dd className="font-medium text-navy">
                {workLocationTown ? `${workLocationTown}, ` : ""}
                {workLocationCounty}
              </dd>
            </div>
            {startDate && (
              <div>
                <dt className="text-navy/50">Start date</dt>
                <dd className="font-medium text-navy">{startDate}</dd>
              </div>
            )}
          </dl>
          <div>
            <dt className="text-navy/50 text-sm">Description</dt>
            <dd className="text-sm text-navy">{jobDescription}</dd>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={handleSend}
              disabled={submitting}
              className="rounded-xl wira-gradient-cta px-6 py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Confirm & Send Hiring Request"}
            </button>
            <button
              onClick={() => setReviewing(false)}
              disabled={submitting}
              className="rounded-xl border border-black/10 px-6 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
            >
              Back to edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
