import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SERVICE_CATEGORIES } from "../src/lib/constants";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@wira.co.ke";
const ADMIN_PASSWORD = "WiraAdmin123!";

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const now = new Date();
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      name: "WIRA Admin",
      email: ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
      accountKind: "INDIVIDUAL",
      emailVerifiedAt: now,
      phoneVerifiedAt: now,
    },
  });
  await prisma.walletAccount.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, balance: 0 },
  });
  console.log(`Admin account ready: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

  for (const category of SERVICE_CATEGORIES) {
    const created = await prisma.serviceCategory.upsert({
      where: { slug: category.slug },
      update: { name: category.name, icon: category.icon },
      create: {
        name: category.name,
        slug: category.slug,
        icon: category.icon,
      },
    });

    for (const specName of category.specializations) {
      await prisma.specialization.upsert({
        where: { name_categoryId: { name: specName, categoryId: created.id } },
        update: {},
        create: { name: specName, categoryId: created.id },
      });
    }
  }

  console.log(`Seeded ${SERVICE_CATEGORIES.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
