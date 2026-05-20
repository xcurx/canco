-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- AlterTable
ALTER TABLE "Canvas" ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';
