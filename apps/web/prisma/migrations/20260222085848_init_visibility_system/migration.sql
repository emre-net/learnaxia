/*
  Warnings:

  - You are about to drop the column `isPublic` on the `Collection` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Collection" DROP COLUMN "isPublic",
ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';
