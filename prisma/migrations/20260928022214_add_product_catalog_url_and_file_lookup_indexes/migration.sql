-- AlterTable
ALTER TABLE `products` ADD COLUMN `catalogUrl` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `contracts_fileUrl_idx` ON `contracts`(`fileUrl`);

-- CreateIndex
CREATE INDEX `customer_files_url_idx` ON `customer_files`(`url`);

-- CreateIndex
CREATE INDEX `ticket_attachments_url_idx` ON `ticket_attachments`(`url`);

-- CreateIndex
CREATE INDEX `users_avatarUrl_idx` ON `users`(`avatarUrl`);
