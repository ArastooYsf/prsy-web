-- AlterTable
ALTER TABLE `media_assets` MODIFY `scope` ENUM('SITE_CONTENT', 'TICKET_ATTACHMENT', 'PROFILE_AVATAR', 'CONTRACT_FILE', 'PRODUCT_COMMENT') NOT NULL DEFAULT 'SITE_CONTENT';

-- AlterTable
ALTER TABLE `product_comments` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `editedAt` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `product_comment_images` (
    `id` VARCHAR(191) NOT NULL,
    `commentId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `product_comment_images_commentId_idx`(`commentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `product_comment_images` ADD CONSTRAINT `product_comment_images_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `product_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

