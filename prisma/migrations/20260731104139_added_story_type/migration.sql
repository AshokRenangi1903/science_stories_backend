-- CreateEnum
CREATE TYPE "StoryType" AS ENUM ('html', 'blocks');

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "storyType" "StoryType" NOT NULL DEFAULT 'html';
