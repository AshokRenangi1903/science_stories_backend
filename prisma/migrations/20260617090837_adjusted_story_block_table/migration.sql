/*
  Warnings:

  - You are about to drop the column `estimatedReadingTime` on the `StoryBlock` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Story" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "StoryBlock" DROP COLUMN "estimatedReadingTime",
ADD COLUMN     "content" JSONB;
