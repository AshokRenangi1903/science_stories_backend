/*
  Warnings:

  - The values [NOTES] on the enum `ContentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ContentType_new" AS ENUM ('PARAGRAPH', 'IMAGE', 'LINK', 'HIGHLIGHT', 'QUOTATION', 'CARD', 'RELATED_CONTENT');
ALTER TABLE "StoryBlock" ALTER COLUMN "type" TYPE "ContentType_new" USING ("type"::text::"ContentType_new");
ALTER TYPE "ContentType" RENAME TO "ContentType_old";
ALTER TYPE "ContentType_new" RENAME TO "ContentType";
DROP TYPE "public"."ContentType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;
