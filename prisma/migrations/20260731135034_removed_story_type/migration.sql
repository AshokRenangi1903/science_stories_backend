/*
  Warnings:

  - You are about to drop the column `htmlUrl` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `storyType` on the `Story` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Story" DROP COLUMN "htmlUrl",
DROP COLUMN "storyType";

-- DropEnum
DROP TYPE "StoryType";
