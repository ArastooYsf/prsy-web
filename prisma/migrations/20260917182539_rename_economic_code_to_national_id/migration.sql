-- Rename economicCode to nationalId (the field now maps directly to
-- api.ir's CompanyInfo "nationalID" input) and add columns to store the
-- last automatic verification result.
ALTER TABLE `users`
  CHANGE COLUMN `economicCode` `nationalId` VARCHAR(191) NULL,
  ADD COLUMN `nationalIdVerified` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `nationalIdOfficialName` VARCHAR(191) NULL,
  ADD COLUMN `nationalIdActive` BOOLEAN NULL,
  ADD COLUMN `nationalIdCheckedAt` DATETIME(3) NULL;
