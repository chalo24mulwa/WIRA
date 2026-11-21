import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

/**
 * An affiliate profile can belong to a dedicated AFFILIATE account or be
 * attached to an existing Customer/Professional login — so this checks for
 * the Affiliate row itself rather than any particular Role.
 */
export async function requireAffiliate(): Promise<SessionPayload> {
  const session = await requireUser();
  const affiliate = await prisma.affiliate.findUnique({ where: { userId: session.userId } });
  if (!affiliate) {
    throw new ApiError("You don't have an affiliate profile yet.", 403);
  }
  return session;
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
}
