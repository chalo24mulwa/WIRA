import { prisma } from "@/lib/prisma";

export type ContactAccess =
  | { unlocked: false }
  | { unlocked: true; source: "PURCHASE" | "HIRING_ACCEPT"; expiresAt: Date | null };

/**
 * The single source of truth for whether `employerId` may see
 * `professionalId`'s phone/email. Called server-side only — a professional's
 * contact details are never embedded in a public API response, so there is
 * nothing for a client to "unblur" without this check passing first.
 */
export async function getContactAccess(
  employerId: string,
  professionalId: string
): Promise<ContactAccess> {
  const purchasedUnlock = await prisma.contactUnlock.findFirst({
    where: { employerId, professionalId, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "desc" },
  });
  if (purchasedUnlock) {
    return { unlocked: true, source: purchasedUnlock.source as "PURCHASE" | "HIRING_ACCEPT", expiresAt: purchasedUnlock.expiresAt };
  }

  const acceptedHire = await prisma.hiringRequestRecipient.findFirst({
    where: {
      professionalId,
      status: "ACCEPTED",
      hiringRequest: { employerId },
    },
  });
  if (acceptedHire) {
    return { unlocked: true, source: "HIRING_ACCEPT", expiresAt: null };
  }

  return { unlocked: false };
}
