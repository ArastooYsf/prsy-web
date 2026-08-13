-- CreateTable
CREATE TABLE `ticket_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `replyId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ticket_attachments_replyId_idx`(`replyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ticket_attachments` ADD CONSTRAINT `ticket_attachments_replyId_fkey` FOREIGN KEY (`replyId`) REFERENCES `ticket_replies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
