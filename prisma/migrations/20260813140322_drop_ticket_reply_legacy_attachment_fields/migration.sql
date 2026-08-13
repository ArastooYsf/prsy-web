-- Legacy attachmentUrl/attachmentName data was migrated into ticket_attachments
-- by prisma/migrate-ticket-attachments.ts before this migration was applied.
ALTER TABLE `ticket_replies` DROP COLUMN `attachmentUrl`,
                              DROP COLUMN `attachmentName`;
