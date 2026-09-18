-- AlterTable
ALTER TABLE `users`
    ADD COLUMN `notifyEmail` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifySms` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyTicketReply` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyOrderStatus` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyContractExpiry` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyStaffNewMessage` BOOLEAN NOT NULL DEFAULT true;
