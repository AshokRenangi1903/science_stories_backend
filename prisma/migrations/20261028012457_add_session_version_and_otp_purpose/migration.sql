/*
  Warnings:

  - Added the required column `purpose` to the `EmailOTP` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OTPPurpose" AS ENUM ('REGISTER', 'RESET_PASSWORD');

-- AlterTable
ALTER TABLE "EmailOTP" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "purpose" "OTPPurpose" NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "EmailOTP_email_purpose_idx" ON "EmailOTP"("email", "purpose");
