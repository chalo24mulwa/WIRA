-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `phoneNormalized` VARCHAR(191) NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `googleId` VARCHAR(191) NULL,
    `role` ENUM('CUSTOMER', 'PROFESSIONAL', 'ADMIN', 'AFFILIATE') NOT NULL DEFAULT 'CUSTOMER',
    `accountKind` ENUM('INDIVIDUAL', 'COMPANY') NOT NULL DEFAULT 'INDIVIDUAL',
    `county` VARCHAR(191) NULL,
    `isSuspended` BOOLEAN NOT NULL DEFAULT false,
    `emailVerifiedAt` DATETIME(3) NULL,
    `phoneVerifiedAt` DATETIME(3) NULL,
    `pendingEmail` VARCHAR(191) NULL,
    `pendingPhone` VARCHAR(191) NULL,
    `pendingPhoneNormalized` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_phoneNormalized_key`(`phoneNormalized`),
    UNIQUE INDEX `User_googleId_key`(`googleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VerificationToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `purpose` ENUM('EMAIL_VERIFY', 'PHONE_VERIFY', 'EMAIL_CHANGE', 'PHONE_CHANGE', 'PASSWORD_RESET') NOT NULL,
    `target` VARCHAR(191) NOT NULL,
    `codeHash` VARCHAR(191) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NOT NULL,
    `consumedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VerificationToken_userId_purpose_idx`(`userId`, `purpose`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompanyProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `registrationNumber` VARCHAR(191) NULL,
    `industry` VARCHAR(191) NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CompanyProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WalletAccount` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `balance` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `WalletAccount_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WalletTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `walletId` VARCHAR(191) NOT NULL,
    `type` ENUM('FUNDING', 'HIRING_FEE', 'CONTACT_UNLOCK', 'SUBSCRIPTION', 'REFUND', 'ADJUSTMENT') NOT NULL,
    `amount` INTEGER NOT NULL,
    `previousBalance` INTEGER NOT NULL,
    `newBalance` INTEGER NOT NULL,
    `reference` VARCHAR(191) NULL,
    `relatedHiringRequestId` VARCHAR(191) NULL,
    `relatedContactUnlockId` VARCHAR(191) NULL,
    `relatedSubscriptionId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `WalletTransaction_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HiringRequest` (
    `id` VARCHAR(191) NOT NULL,
    `employerId` VARCHAR(191) NOT NULL,
    `employmentType` ENUM('CONTRACT', 'PERMANENT') NOT NULL,
    `jobTitle` VARCHAR(191) NOT NULL,
    `jobDescription` VARCHAR(191) NOT NULL,
    `numberRequired` INTEGER NOT NULL DEFAULT 1,
    `workLocationCounty` VARCHAR(191) NOT NULL,
    `workLocationTown` VARCHAR(191) NULL,
    `salaryOrPayment` VARCHAR(191) NOT NULL,
    `workingHours` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `contractDurationDays` INTEGER NULL,
    `requiredQualifications` VARCHAR(191) NULL,
    `additionalInstructions` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PENDING_FUNDING', 'SENT', 'CLOSED', 'CANCELLED', 'EXPIRED') NOT NULL DEFAULT 'SENT',
    `feeAmount` INTEGER NOT NULL,
    `chargeProcessed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Conversation` (
    `id` VARCHAR(191) NOT NULL,
    `recipientId` VARCHAR(191) NOT NULL,
    `hiringRequestId` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NOT NULL,
    `employerId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Conversation_recipientId_key`(`recipientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Message` (
    `id` VARCHAR(191) NOT NULL,
    `conversationId` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HiringRequestRecipient` (
    `id` VARCHAR(191) NOT NULL,
    `hiringRequestId` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'VIEWED', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    `respondedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `HiringRequestRecipient_hiringRequestId_professionalId_key`(`hiringRequestId`, `professionalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactUnlock` (
    `id` VARCHAR(191) NOT NULL,
    `employerId` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SavedProfessional` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SavedProfessional_customerId_professionalId_key`(`customerId`, `professionalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformSettings` (
    `id` VARCHAR(191) NOT NULL DEFAULT 'singleton',
    `individualHiringFee` INTEGER NOT NULL DEFAULT 100,
    `companyHiringFee` INTEGER NOT NULL DEFAULT 150,
    `contactUnlockFee` INTEGER NOT NULL DEFAULT 20,
    `contactAccessDays` INTEGER NOT NULL DEFAULT 5,
    `subscriptionPromoActive` BOOLEAN NOT NULL DEFAULT true,
    `subscriptionPromoLabel` VARCHAR(191) NOT NULL DEFAULT 'SPECIAL LAUNCH OFFER',
    `standardPrice` INTEGER NOT NULL DEFAULT 1500,
    `standardPromoPrice` INTEGER NOT NULL DEFAULT 300,
    `professionalPrice` INTEGER NOT NULL DEFAULT 3000,
    `professionalPromoPrice` INTEGER NOT NULL DEFAULT 600,
    `businessPrice` INTEGER NOT NULL DEFAULT 6000,
    `businessPromoPrice` INTEGER NOT NULL DEFAULT 1200,
    `affiliateDefaultCommission` INTEGER NOT NULL DEFAULT 500,
    `affiliateMinPayoutThreshold` INTEGER NOT NULL DEFAULT 1000,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceCategory` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `icon` VARCHAR(191) NULL,

    UNIQUE INDEX `ServiceCategory_name_key`(`name`),
    UNIQUE INDEX `ServiceCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Specialization` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Specialization_name_categoryId_key`(`name`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProfessionalProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `bio` VARCHAR(191) NULL,
    `county` VARCHAR(191) NOT NULL,
    `town` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `serviceRadiusKm` DOUBLE NOT NULL DEFAULT 15,
    `isOnline` BOOLEAN NOT NULL DEFAULT false,
    `ratingAvg` DOUBLE NOT NULL DEFAULT 0,
    `ratingCount` INTEGER NOT NULL DEFAULT 0,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `agencyOwnerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ProfessionalProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProfessionalCategory` (
    `id` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `ProfessionalCategory_professionalId_categoryId_key`(`professionalId`, `categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProfessionalSpecialization` (
    `id` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NOT NULL,
    `specializationId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `ProfessionalSpecialization_professionalId_specializationId_key`(`professionalId`, `specializationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Credential` (
    `id` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PortfolioPhoto` (
    `id` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `caption` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ServiceRequest` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `photoUrls` VARCHAR(191) NOT NULL DEFAULT '[]',
    `county` VARCHAR(191) NOT NULL,
    `town` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `budgetAmount` DOUBLE NULL,
    `budgetMethod` ENUM('PER_HOUR', 'PER_JOB') NULL,
    `status` ENUM('OPEN', 'QUOTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RequestDismissal` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `RequestDismissal_requestId_professionalId_key`(`requestId`, `professionalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Quotation` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `pricingMethod` ENUM('PER_HOUR', 'PER_JOB') NOT NULL DEFAULT 'PER_JOB',
    `estimatedCompletion` VARCHAR(191) NULL,
    `message` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN') NOT NULL DEFAULT 'PENDING',
    `acceptedAt` DATETIME(3) NULL,
    `popupSeenAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Quotation_requestId_professionalId_key`(`requestId`, `professionalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Booking` (
    `id` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `quotationId` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NOT NULL,
    `status` ENUM('CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    `creditConsumed` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Booking_requestId_key`(`requestId`),
    UNIQUE INDEX `Booking_quotationId_key`(`quotationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Review` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Review_bookingId_key`(`bookingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `professionalId` VARCHAR(191) NOT NULL,
    `plan` ENUM('FREE', 'STANDARD', 'PROFESSIONAL', 'BUSINESS') NOT NULL DEFAULT 'FREE',
    `creditsTotal` INTEGER NOT NULL DEFAULT 5,
    `creditsUsed` INTEGER NOT NULL DEFAULT 0,
    `periodStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `periodEnd` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Subscription_professionalId_key`(`professionalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CreditTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NULL,
    `amount` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `link` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Affiliate` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `businessName` VARCHAR(191) NULL,
    `referralCode` VARCHAR(191) NULL,
    `payoutPhone` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
    `rejectionReason` VARCHAR(191) NULL,
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decidedAt` DATETIME(3) NULL,
    `decidedBy` VARCHAR(191) NULL,
    `suspendedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Affiliate_userId_key`(`userId`),
    UNIQUE INDEX `Affiliate_referralCode_key`(`referralCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Campaign` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `commissionOverride` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Campaign_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Referral` (
    `id` VARCHAR(191) NOT NULL,
    `affiliateId` VARCHAR(191) NOT NULL,
    `referredUserId` VARCHAR(191) NOT NULL,
    `referralCode` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ELIGIBLE', 'INELIGIBLE') NOT NULL DEFAULT 'PENDING',
    `eligibleAt` DATETIME(3) NULL,
    `ineligibleReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Referral_referredUserId_key`(`referredUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Commission` (
    `id` VARCHAR(191) NOT NULL,
    `affiliateId` VARCHAR(191) NOT NULL,
    `referralId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'PAID', 'REVERSED') NOT NULL DEFAULT 'PENDING',
    `approvedAt` DATETIME(3) NULL,
    `approvedBy` VARCHAR(191) NULL,
    `reversedAt` DATETIME(3) NULL,
    `reversedBy` VARCHAR(191) NULL,
    `reversalReason` VARCHAR(191) NULL,
    `payoutId` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Commission_referralId_key`(`referralId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payout` (
    `id` VARCHAR(191) NOT NULL,
    `affiliateId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `method` ENUM('MPESA', 'MANUAL') NOT NULL,
    `reference` VARCHAR(191) NULL,
    `receiptNumber` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Payout_reference_key`(`reference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdminAuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `adminId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `targetId` VARCHAR(191) NOT NULL,
    `metadata` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AdminAuditLog_targetType_targetId_idx`(`targetType`, `targetId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `VerificationToken` ADD CONSTRAINT `VerificationToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompanyProfile` ADD CONSTRAINT `CompanyProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WalletAccount` ADD CONSTRAINT `WalletAccount_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WalletTransaction` ADD CONSTRAINT `WalletTransaction_walletId_fkey` FOREIGN KEY (`walletId`) REFERENCES `WalletAccount`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HiringRequest` ADD CONSTRAINT `HiringRequest_employerId_fkey` FOREIGN KEY (`employerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `HiringRequestRecipient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_hiringRequestId_fkey` FOREIGN KEY (`hiringRequestId`) REFERENCES `HiringRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `ProfessionalProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Conversation` ADD CONSTRAINT `Conversation_employerId_fkey` FOREIGN KEY (`employerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HiringRequestRecipient` ADD CONSTRAINT `HiringRequestRecipient_hiringRequestId_fkey` FOREIGN KEY (`hiringRequestId`) REFERENCES `HiringRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HiringRequestRecipient` ADD CONSTRAINT `HiringRequestRecipient_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `ProfessionalProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactUnlock` ADD CONSTRAINT `ContactUnlock_employerId_fkey` FOREIGN KEY (`employerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContactUnlock` ADD CONSTRAINT `ContactUnlock_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `ProfessionalProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedProfessional` ADD CONSTRAINT `SavedProfessional_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SavedProfessional` ADD CONSTRAINT `SavedProfessional_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `ProfessionalProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Specialization` ADD CONSTRAINT `Specialization_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ServiceCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfessionalProfile` ADD CONSTRAINT `ProfessionalProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfessionalProfile` ADD CONSTRAINT `ProfessionalProfile_agencyOwnerId_fkey` FOREIGN KEY (`agencyOwnerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfessionalCategory` ADD CONSTRAINT `ProfessionalCategory_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `ProfessionalProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfessionalCategory` ADD CONSTRAINT `ProfessionalCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ServiceCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfessionalSpecialization` ADD CONSTRAINT `ProfessionalSpecialization_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `ProfessionalProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProfessionalSpecialization` ADD CONSTRAINT `ProfessionalSpecialization_specializationId_fkey` FOREIGN KEY (`specializationId`) REFERENCES `Specialization`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Credential` ADD CONSTRAINT `Credential_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `ProfessionalProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PortfolioPhoto` ADD CONSTRAINT `PortfolioPhoto_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `ProfessionalProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceRequest` ADD CONSTRAINT `ServiceRequest_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ServiceCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RequestDismissal` ADD CONSTRAINT `RequestDismissal_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RequestDismissal` ADD CONSTRAINT `RequestDismissal_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `ProfessionalProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Quotation` ADD CONSTRAINT `Quotation_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Quotation` ADD CONSTRAINT `Quotation_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `ProfessionalProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `ServiceRequest`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_quotationId_fkey` FOREIGN KEY (`quotationId`) REFERENCES `Quotation`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `ProfessionalProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `ProfessionalProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_professionalId_fkey` FOREIGN KEY (`professionalId`) REFERENCES `ProfessionalProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CreditTransaction` ADD CONSTRAINT `CreditTransaction_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Affiliate` ADD CONSTRAINT `Affiliate_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `Affiliate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referredUserId_fkey` FOREIGN KEY (`referredUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `Campaign`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `Affiliate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_referralId_fkey` FOREIGN KEY (`referralId`) REFERENCES `Referral`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Commission` ADD CONSTRAINT `Commission_payoutId_fkey` FOREIGN KEY (`payoutId`) REFERENCES `Payout`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_affiliateId_fkey` FOREIGN KEY (`affiliateId`) REFERENCES `Affiliate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdminAuditLog` ADD CONSTRAINT `AdminAuditLog_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

