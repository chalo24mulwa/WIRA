-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "pendingEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "pendingPhone" TEXT;
ALTER TABLE "User" ADD COLUMN "pendingPhoneNormalized" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneNormalized" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" DATETIME;

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN "relatedSubscriptionId" TEXT;

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlatformSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "individualHiringFee" INTEGER NOT NULL DEFAULT 100,
    "companyHiringFee" INTEGER NOT NULL DEFAULT 150,
    "contactUnlockFee" INTEGER NOT NULL DEFAULT 20,
    "contactAccessDays" INTEGER NOT NULL DEFAULT 5,
    "subscriptionPromoActive" BOOLEAN NOT NULL DEFAULT true,
    "subscriptionPromoLabel" TEXT NOT NULL DEFAULT 'SPECIAL LAUNCH OFFER',
    "standardPrice" INTEGER NOT NULL DEFAULT 1500,
    "standardPromoPrice" INTEGER NOT NULL DEFAULT 300,
    "professionalPrice" INTEGER NOT NULL DEFAULT 3000,
    "professionalPromoPrice" INTEGER NOT NULL DEFAULT 600,
    "businessPrice" INTEGER NOT NULL DEFAULT 6000,
    "businessPromoPrice" INTEGER NOT NULL DEFAULT 1200,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_PlatformSettings" ("companyHiringFee", "contactAccessDays", "contactUnlockFee", "id", "individualHiringFee", "updatedAt") SELECT "companyHiringFee", "contactAccessDays", "contactUnlockFee", "id", "individualHiringFee", "updatedAt" FROM "PlatformSettings";
DROP TABLE "PlatformSettings";
ALTER TABLE "new_PlatformSettings" RENAME TO "PlatformSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "VerificationToken_userId_purpose_idx" ON "VerificationToken"("userId", "purpose");
