/*
  Warnings:

  - Made the column `position` on table `Era` required. This step will fail if there are existing NULL values in that column.
  - Made the column `position` on table `Story` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Era" ALTER COLUMN "position" SET NOT NULL;

-- AlterTable
ALTER TABLE "Story" ALTER COLUMN "position" SET NOT NULL;
