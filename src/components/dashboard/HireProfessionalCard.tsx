"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Bookmark, Check, Lock, Mail, MapPin, Phone, Unlock } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { FundingPrompt } from "@/components/dashboard/FundingPrompt";
import type { ProfessionalCardData } from "@/components/ProfessionalCard";

type ContactState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "locked"; fee: number }
  | { status: "unlocked"; phone: string | null; email: string | null }
  | { status: "insufficient"; required: number; available: number };

export function HireProfessionalCard({
  pro,
  selected,
  onToggleSelect,
  savedInitial = false,
}: {
  pro: ProfessionalCardData;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  savedInitial?: boolean;
}) {
  const [saved, setSaved] = useState(savedInitial);
  const [contact, setContact] = useState<ContactState>({ status: "idle" });

  async function toggleSave() {
    setSaved((prev) => !prev);
    await fetch(`/api/saved-professionals/${pro.id}`, { method: saved ? "DELETE" : "POST" });
  }

  async function checkContact() {
    setContact({ status: "loading" });
    const res = await fetch(`/api/professionals/${pro.id}/contact`);
    const data = await res.json();
    if (data.unlocked) {
      setContact({ status: "unlocked", phone: data.phone, email: data.email });
    } else {
      setContact({ status: "locked", fee: data.unlockFee ?? 20 });
    }
  }

  async function purchaseUnlock() {
    setContact({ status: "loading" });
    const res = await fetch(`/api/professionals/${pro.id}/contact/unlock`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setContact({ status: "unlocked", phone: data.phone, email: data.email });
    } else if (res.status === 402) {
      setContact({ status: "insufficient", required: data.required, available: data.available });
    } else {
      setContact({ status: "idle" });
    }
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm transition-all ${
        selected ? "border-orange ring-1 ring-orange" : "border-black/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onToggleSelect(pro.id)}
          className="flex items-center gap-3 text-left"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
              selected ? "border-orange bg-orange text-white" : "border-black/20"
            }`}
          >
            {selected && <Check size={13} />}
          </span>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy/10 text-base font-bold text-navy">
            {pro.name.charAt(0).toUpperCase()}
          </span>
          <span>
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-navy">{pro.name}</span>
              {pro.verified && <BadgeCheck size={15} className="text-orange" />}
            </span>
            <span className="flex items-center gap-1 text-xs text-navy/50">
              <MapPin size={12} />
              {pro.town ? `${pro.town}, ` : ""}
              {pro.county}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={toggleSave}
          aria-label="Save professional"
          className={`shrink-0 ${saved ? "text-orange" : "text-navy/30 hover:text-navy/60"}`}
        >
          <Bookmark size={18} className={saved ? "fill-orange" : ""} />
        </button>
      </div>

      {pro.bio && <p className="line-clamp-2 text-sm text-navy/60">{pro.bio}</p>}

      <div className="flex flex-wrap gap-1.5">
        {pro.categories.slice(0, 3).map((c) => (
          <span key={c} className="rounded-full bg-navy/5 px-2.5 py-1 text-xs font-medium text-navy/70">
            {c}
          </span>
        ))}
      </div>

      <StarRating rating={pro.ratingAvg} count={pro.ratingCount} />

      <div className="flex items-center gap-2 border-t border-black/5 pt-3">
        <Link
          href={`/professionals/${pro.id}`}
          className="flex-1 rounded-lg border border-black/10 py-2 text-center text-sm font-semibold text-navy hover:bg-navy/5"
        >
          View Profile
        </Link>
        {contact.status === "idle" && (
          <button
            onClick={checkContact}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-black/10 py-2 text-sm font-semibold text-navy hover:bg-navy/5"
          >
            <Lock size={14} />
            Contact
          </button>
        )}
      </div>

      {contact.status === "loading" && (
        <p className="text-center text-xs text-navy/40">Checking…</p>
      )}

      {contact.status === "locked" && (
        <button
          onClick={purchaseUnlock}
          className="flex items-center justify-center gap-1.5 rounded-lg wira-gradient-cta py-2 text-sm font-semibold text-navy hover:opacity-90"
        >
          <Unlock size={14} />
          Unlock Contact — KSh {contact.fee}
        </button>
      )}

      {contact.status === "unlocked" && (
        <div className="space-y-1 rounded-lg bg-green-50 p-3 text-sm text-green-800">
          {contact.phone && (
            <p className="flex items-center gap-1.5">
              <Phone size={13} /> {contact.phone}
            </p>
          )}
          {contact.email && (
            <p className="flex items-center gap-1.5">
              <Mail size={13} /> {contact.email}
            </p>
          )}
        </div>
      )}

      {contact.status === "insufficient" && (
        <FundingPrompt
          label="unlock this contact"
          requiredAmount={contact.required}
          availableAmount={contact.available}
          onFunded={purchaseUnlock}
          onCancel={() => setContact({ status: "idle" })}
        />
      )}
    </div>
  );
}
