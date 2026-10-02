-- AlterTable
ALTER TABLE `orders` ADD COLUMN `deliveryStage` ENUM('PICKED_UP', 'ON_THE_WAY', 'NEARBY', 'ARRIVED') NULL,
    ADD COLUMN `recipientAddress` TEXT NULL,
    ADD COLUMN `recipientLat` DOUBLE NULL,
    ADD COLUMN `recipientLng` DOUBLE NULL,
    ADD COLUMN `recipientPostalCode` VARCHAR(191) NULL,
    ADD COLUMN `recipientSignatureUrl` VARCHAR(191) NULL;
