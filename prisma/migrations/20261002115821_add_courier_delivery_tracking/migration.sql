-- AlterTable
ALTER TABLE `orders` ADD COLUMN `courierId` VARCHAR(191) NULL,
    ADD COLUMN `courierLat` DOUBLE NULL,
    ADD COLUMN `courierLng` DOUBLE NULL,
    ADD COLUMN `courierLocationUpdatedAt` DATETIME(3) NULL,
    ADD COLUMN `deliveryCode` VARCHAR(191) NULL,
    ADD COLUMN `deliveryCodeVerifiedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('ADMIN', 'SUPPORT', 'CUSTOMER', 'COURIER') NOT NULL DEFAULT 'CUSTOMER';

-- CreateIndex
CREATE INDEX `orders_courierId_idx` ON `orders`(`courierId`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_courierId_fkey` FOREIGN KEY (`courierId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
