-- AlterTable
ALTER TABLE `order_items`
    ADD COLUMN `productId` VARCHAR(191) NULL,
    ADD COLUMN `price` INTEGER NULL;

-- CreateIndex
CREATE INDEX `order_items_productId_idx` ON `order_items`(`productId`);

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
