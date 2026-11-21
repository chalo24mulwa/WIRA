import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new ApiError("Please log in to continue.", 401);
  return session;
}

export async function requireRole(
  role: SessionPayload["role"]
): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== role) {
    throw new ApiError("You do not have permission to do this.", 403);
  }
  return session;
}

export async function requireAgency(): Promise<SessionPayload> {
  const session = await requireRole("PROFESSIONAL");
  if (session.accountKind !== "COMPANY") {
    throw new ApiError("This is only available for company/agency accounts.", 403);
  }
  return session;
}

export async function requireAffiliate(): Promise<SessionPayload> {
  return requireRole("AFFILIATE");
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
