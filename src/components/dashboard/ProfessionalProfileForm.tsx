"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LocateFixed, Trash2 } from "lucide-react";
import { KENYAN_COUNTIES } from "@/lib/constants";
import { FileUploader } from "@/components/FileUploader";

type Category = { id: string; name: string; specializations: { id: string; name: string }[] };

type Profile = {
  id: string;
  bio: string | null;
  county: string;
  town: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
  isOnline: boolean;
  categories: { category: { id: string; name: string } }[];
  specializations: { specialization: { id: string; name: string; categoryId: string } }[];
  credentials: { id: string; title: string; fileUrl: string }[];
  portfolioPhotos: { id: string; url: string; caption: string | null }[];
};

export function ProfessionalProfileForm({
  categories,
  profile,
}: {
  categories: Category[];
  profile: Profile;
}) {
  const router = useRouter();
  const [bio, setBio] = useState(profile.bio ?? "");
  const [county, setCounty] = useState(profile.county);
  const [town, setTown] = useState(profile.town ?? "");
  const [latitude, setLatitude] = useState<number | null>(profile.latitude);
  const [longitude, setLongitude] = useState<number | null>(profile.longitude);
  const [serviceRadiusKm, setServiceRadiusKm] = useState(profile.serviceRadiusKm);
  const [categoryIds, setCategoryIds] = useState<string[]>(
    profile.categories.map((c) => c.category.id)
  );
  const [specializationIds, setSpecializationIds] = useState<string[]>(
    profile.specializations.map((s) => s.specialization.id)
  );
  const [isOnline, setIsOnline] = useState(profile.isOnline);
  const [credentials, setCredentials] = useState(profile.credentials);
  const [photos, setPhotos] = useState(profile.portfolioPhotos.map((p) => p.url));
  const [credentialTitle, setCredentialTitle] = useState("");
  const [credentialFile, setCredentialFile] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);

  const availableSpecializations = useMemo(
    () =>
      categories
        .filter((c) => categoryIds.includes(c.id))
        .flatMap((c) => c.specializations),
    [categories, categoryIds]
  );

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function toggleSpecialization(id: string) {
    setSpecializationIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleLocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function toggleOnline() {
    const next = !isOnline;
    setIsOnline(next);
    await fetch("/api/professionals/me/online", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnline: next }),
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (categoryIds.length === 0) {
      setError("Select at least one service category.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/professionals/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio,
          county,
          town,
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
          serviceRadiusKm,
          categoryIds,
          specializationIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save profile.");
      setMessage("Profile saved.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function addCredential() {
    if (!credentialTitle || credentialFile.length === 0) return;
    const res = await fetch("/api/professionals/me/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: credentialTitle, fileUrl: credentialFile[0] }),
    });
    const data = await res.json();
    if (res.ok) {
      setCredentials((prev) => [data.credential, ...prev]);
      setCredentialTitle("");
      setCredentialFile([]);
    }
  }

  async function removeCredential(id: string) {
    setCredentials((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/professionals/me/credentials/${id}`, { method: "DELETE" });
  }

  async function syncPhotos(next: string[]) {
    const added = next.filter((u) => !photos.includes(u));
    const removed = photos.filter((u) => !next.includes(u));
    setPhotos(next);
    for (const url of added) {
      await fetch("/api/professionals/me/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    }
    for (const url of removed) {
      const photo = profile.portfolioPhotos.find((p) => p.url === url);
      if (photo) await fetch(`/api/professionals/me/photos/${photo.id}`, { method: "DELETE" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-semibold text-navy">Availability</h2>
          <p className="text-sm text-navy/60">
            Go online to start receiving nearby service requests.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleOnline}
          className={`relative h-8 w-14 rounded-full transition-colors ${
            isOnline ? "bg-green-500" : "bg-navy/20"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              isOnline ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-navy">About / Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            placeholder="Tell customers about your experience and expertise…"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">County</label>
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
            >
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
              value={town}
              onChange={(e) => setTown(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm outline-none focus:border-orange"
              placeholder="e.g. Westlands"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-navy">
            Service radius: {serviceRadiusKm} km
          </label>
          <input
            type="range"
            min={1}
            max={100}
            value={serviceRadiusKm}
            onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
            className="w-full accent-orange"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={handleLocate}
            disabled={locating}
            className="flex items-center gap-2 rounded-xl border border-navy/15 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5 disabled:opacity-60"
          >
            <LocateFixed size={16} />
            {locating
              ? "Locating…"
              : latitude
              ? "Location set — update my location"
              : "Set my GPS location"}
          </button>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-navy">Service categories</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  categoryIds.includes(c.id)
                    ? "border-orange bg-orange/10 text-orange"
                    : "border-black/10 text-navy/70 hover:border-navy/30"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {availableSpecializations.length > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium text-navy">Specializations</label>
            <div className="flex flex-wrap gap-2">
              {availableSpecializations.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => toggleSpecialization(s.id)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    specializationIds.includes(s.id)
                      ? "border-orange bg-orange/10 text-orange"
                      : "border-black/10 text-navy/70 hover:border-navy/30"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-600">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl wira-gradient-cta px-6 py-2.5 text-sm font-semibold text-navy shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-navy">Qualifications & Certificates</h2>
        <p className="text-sm text-navy/60">
          Upload documents that help customers trust your expertise.
        </p>

        <div className="mt-4 space-y-2">
          {credentials.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm"
            >
              <a href={c.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-navy hover:underline">
                {c.title}
              </a>
              <button
                type="button"
                onClick={() => removeCredential(c.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-navy/70">Title</label>
            <input
              value={credentialTitle}
              onChange={(e) => setCredentialTitle(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-orange"
              placeholder="e.g. NITA Certificate"
            />
          </div>
          <FileUploader
            urls={credentialFile}
            onChange={setCredentialFile}
            max={1}
            accept="image/*,application/pdf"
            label="Upload"
          />
          <button
            type="button"
            onClick={addCredential}
            disabled={!credentialTitle || credentialFile.length === 0}
            className="rounded-lg border border-navy/15 px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-navy">Portfolio Photos</h2>
        <p className="mb-3 text-sm text-navy/60">Show off examples of your past work.</p>
        <FileUploader urls={photos} onChange={syncPhotos} max={12} />
      </div>
    </div>
  );
}
