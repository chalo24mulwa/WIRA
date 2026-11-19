import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/require-session";

/**
 * Delivers each pending quotation's popup exactly once: a quotation is
 * claimed (popupSeenAt stamped) in the same transaction it is returned in,
 * so re-polling or re-opening the dashboard never re-shows it, while an
 * offline customer still gets it the next time they poll.
 */
export async function GET() {
  try {
    const session = await requireRole("CUSTOMER");

    const unseen = await prisma.$transaction(async (tx) => {
      const found = await tx.quotation.findMany({
        where: {
          status: "PENDING",
          popupSeenAt: null,
          request: { customerId: session.userId },
        },
        orderBy: { createdAt: "asc" },
        take: 5,
        include: {
          request: { select: { id: true, category: { select: { name: true } } } },
          professional: { include: { user: { select: { name: true } } } },
        },
      });

      if (found.length > 0) {
        await tx.quotation.updateMany({
          where: { id: { in: found.map((q) => q.id) }, popupSeenAt: null },
          data: { popupSeenAt: new Date() },
        });
      }

      return found;
    });

    return NextResponse.json({ quotations: unseen });
  } catch (error) {
    return handleApiError(error);
  }
}
