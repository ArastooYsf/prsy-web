-- AlterTable
ALTER TABLE `tickets` ADD COLUMN `messageSeenAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `ticket_replies`
  ADD COLUMN `attachmentUrl` VARCHAR(191) NULL,
  ADD COLUMN `attachmentName` VARCHAR(191) NULL,
  ADD COLUMN `seenAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `canned_responses` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `canned_responses_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `canned_responses` ADD CONSTRAINT `canned_responses_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
