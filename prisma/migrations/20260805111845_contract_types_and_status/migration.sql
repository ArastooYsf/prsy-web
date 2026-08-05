-- AlterTable
ALTER TABLE `contracts` MODIFY COLUMN `status` ENUM('PENDING_APPROVAL', 'ACTIVE', 'RENEWING', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE `contract_types` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `contract_types_label_key`(`label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
