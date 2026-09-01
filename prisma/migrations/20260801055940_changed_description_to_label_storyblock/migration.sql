/*
  Warnings:

  - You are about to drop the column `description` on the `StoryBlock` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "StoryBlock" DROP COLUMN "description",
ADD COLUMN     "label" TEXT;
