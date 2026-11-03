-- CreateEnum
CREATE TYPE "Subject" AS ENUM (
  'Physics',
  'Chemistry',
  'Biology',
  'Medicine',
  'Astronomy & Space',
  'Earth & Environment',
  'Mathematics',
  'Computer Science',
  'Materials & Technology'
);

-- Convert existing subject column without losing data
ALTER TABLE "Story"
ALTER COLUMN "subject" TYPE "Subject"
USING "subject"::"Subject";