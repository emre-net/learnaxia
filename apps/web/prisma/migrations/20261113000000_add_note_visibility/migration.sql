-- AlterTable
ALTER TABLE "Note" ADD COLUMN IF NOT EXISTS "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';

