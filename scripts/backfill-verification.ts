/**
 * One-off migration helper, run once after the add_promo_pricing_and_verification
 * migration and before the follow-up migration that adds the UNIQUE constraint
 * on User.phoneNormalized.
 *
 * - Grandfathers every existing account in as already-verified, so the new
 *   email/phone verification requirement never locks out a user who
 *   registered before this feature existed.
 * - Backfills phoneNormalized for existing users, first-created-wins: if two
 *   existing accounts already share a phone number, only the earlier one
 *   gets a normalized value. The later one is left null (and therefore
 *   unaffected by the uniqueness rule) so the migration can proceed without
 *   deleting or locking out either account. Flagged in the summary output
 *   below for manual admin review.
 */
import { PrismaClient } from "@prisma/client";
import { normalizePhone } from "../src/lib/phone";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  const verifiedCount = await prisma.user.updateMany({
    where: { emailVerifiedAt: null },
    data: { emailVerifiedAt: now },
  });
  await prisma.user.updateMany({
    where: { phoneVerifiedAt: null },
    data: { phoneVerifiedAt: now },
  });
  console.log(`Grandfathered ${verifiedCount.count} existing user(s) as verified.`);

  const users = await prisma.user.findMany({
    where: { phone: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, phone: true },
  });

  const claimed = new Map<string, string>(); // normalized -> owning userId
  const conflicts: { email: string; phone: string }[] = [];

  for (const user of users) {
    const normalized = user.phone ? normalizePhone(user.phone) : null;
    if (!normalized) continue;

    const owner = claimed.get(normalized);
    if (owner) {
      conflicts.push({ email: user.email, phone: user.phone! });
      continue;
    }

    claimed.set(normalized, user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { phoneNormalized: normalized },
    });
  }

  console.log(`Backfilled phoneNormalized for ${claimed.size} user(s).`);
  if (conflicts.length > 0) {
    console.log("Pre-existing duplicate phone numbers left unassigned (needs admin review):");
    for (const c of conflicts) console.log(`  - ${c.email} (${c.phone})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
