-- AlterTable
ALTER TABLE `users` ADD COLUMN `emailVerificationAttempts` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `emailVerificationCodeExpires` DATETIME(3) NULL,
    ADD COLUMN `emailVerificationCodeHash` VARCHAR(191) NULL,
    ADD COLUMN `emailVerified` DATETIME(3) NULL,
    ADD COLUMN `pendingEmail` VARCHAR(191) NULL;

-- Backfill: existing accounts are grandfathered in as already verified (as
-- of when they were created), so this feature only demands verification of
-- genuinely new signups going forward, not retroactively of everyone
-- already using the app.
UPDATE `users` SET `emailVerified` = `createdAt` WHERE `emailVerified` IS NULL;
