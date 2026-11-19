import { NextResponse } from "next/server";
import { searchProfessionals } from "@/lib/search-professionals";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const ids = searchParams.get("ids");

  const professionals = await searchProfessionals({
    categoryId: searchParams.get("categoryId") ?? undefined,
    specializationId: searchParams.get("specializationId") ?? undefined,
    county: searchParams.get("county") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    lat: lat ? parseFloat(lat) : undefined,
    lng: lng ? parseFloat(lng) : undefined,
    ids: ids ? ids.split(",").filter(Boolean) : undefined,
  });

  return NextResponse.json({ professionals });
}
