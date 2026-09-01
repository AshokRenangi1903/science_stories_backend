-- AlterTable
ALTER TABLE "Era" ALTER COLUMN "isPublished" SET DEFAULT true,
ALTER COLUMN "position" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "discipline" TEXT,
ADD COLUMN     "estimatedReadTime" TEXT,
ADD COLUMN     "geolocation" TEXT,
ADD COLUMN     "subject" TEXT,
ALTER COLUMN "position" DROP NOT NULL;
