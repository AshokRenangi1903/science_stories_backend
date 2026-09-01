-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MODERATE', 'ADVANCED');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "category" TEXT[],
ADD COLUMN     "explanation" TEXT;

-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "marksPerQuestion" INTEGER NOT NULL DEFAULT 5;
