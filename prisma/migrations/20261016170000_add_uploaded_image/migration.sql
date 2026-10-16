-- CreateTable
CREATE TABLE "UploadedImage" (
    "id" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadedImage_sha256_key" ON "UploadedImage"("sha256");

-- CreateIndex
CREATE UNIQUE INDEX "UploadedImage_filename_key" ON "UploadedImage"("filename");
