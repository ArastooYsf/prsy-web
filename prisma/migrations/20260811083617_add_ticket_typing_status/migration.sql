-- AlterTable
ALTER TABLE `tickets` ADD COLUMN `customerTypingAt` DATETIME(3) NULL,
    ADD COLUMN `staffTypingAt` DATETIME(3) NULL;
