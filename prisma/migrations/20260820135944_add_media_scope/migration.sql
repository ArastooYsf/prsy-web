-- AlterTable
ALTER TABLE `media_assets` ADD COLUMN `scope` ENUM('SITE_CONTENT', 'TICKET_ATTACHMENT', 'PROFILE_AVATAR', 'CONTRACT_FILE') NOT NULL DEFAULT 'SITE_CONTENT';

-- CreateIndex
CREATE INDEX `media_assets_scope_idx` ON `media_assets`(`scope`);
