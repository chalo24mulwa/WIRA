-- AlterTable
ALTER TABLE "ServiceRequest" ADD COLUMN "budgetAmount" REAL;
ALTER TABLE "ServiceRequest" ADD COLUMN "budgetMethod" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requestId" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "pricingMethod" TEXT NOT NULL DEFAULT 'PER_JOB',
    "estimatedCompletion" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "acceptedAt" DATETIME,
    "popupSeenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quotation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quotation_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Quotation" ("amount", "createdAt", "id", "message", "professionalId", "requestId", "status") SELECT "amount", "createdAt", "id", "message", "professionalId", "requestId", "status" FROM "Quotation";
DROP TABLE "Quotation";
ALTER TABLE "new_Quotation" RENAME TO "Quotation";
CREATE UNIQUE INDEX "Quotation_requestId_professionalId_key" ON "Quotation"("requestId", "professionalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
