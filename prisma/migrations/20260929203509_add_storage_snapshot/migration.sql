-- CreateTable
CREATE TABLE `storage_snapshots` (
    `id` VARCHAR(191) NOT NULL,
    `publicUsedBytes` BIGINT NOT NULL,
    `privateUsedBytes` BIGINT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `storage_snapshots_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
