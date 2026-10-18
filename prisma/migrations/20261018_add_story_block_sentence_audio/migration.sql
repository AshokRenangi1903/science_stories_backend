-- CreateEnum
CREATE TYPE "AudioGenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');

-- CreateTable
CREATE TABLE "StoryBlockSentence" (
    "id" TEXT NOT NULL,
    "storyBlockId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "textHash" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryBlockSentence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SentenceAudio" (
    "id" TEXT NOT NULL,
    "sentenceId" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL,
    "voiceName" TEXT NOT NULL,
    "status" "AudioGenerationStatus" NOT NULL DEFAULT 'PENDING',
    "audioUrl" TEXT,
    "storagePath" TEXT,
    "durationMs" INTEGER,
    "errorMessage" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SentenceAudio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoryBlockSentence_storyBlockId_position_idx" ON "StoryBlockSentence"("storyBlockId", "position");

-- CreateIndex
CREATE INDEX "StoryBlockSentence_storyBlockId_textHash_idx" ON "StoryBlockSentence"("storyBlockId", "textHash");

-- CreateIndex
CREATE INDEX "SentenceAudio_status_idx" ON "SentenceAudio"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SentenceAudio_sentenceId_languageCode_voiceName_key" ON "SentenceAudio"("sentenceId", "languageCode", "voiceName");

-- AddForeignKey
ALTER TABLE "StoryBlockSentence" ADD CONSTRAINT "StoryBlockSentence_storyBlockId_fkey" FOREIGN KEY ("storyBlockId") REFERENCES "StoryBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentenceAudio" ADD CONSTRAINT "SentenceAudio_sentenceId_fkey" FOREIGN KEY ("sentenceId") REFERENCES "StoryBlockSentence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
