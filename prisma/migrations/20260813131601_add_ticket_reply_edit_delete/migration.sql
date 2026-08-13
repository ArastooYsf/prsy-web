-- AlterTable
ALTER TABLE `ticket_replies` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `editedAt` DATETIME(3) NULL;
