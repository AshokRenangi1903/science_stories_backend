-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[];
