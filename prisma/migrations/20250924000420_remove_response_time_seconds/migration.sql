/*
  Warnings:

  - You are about to drop the column `response_time_seconds` on the `completed_reviews` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."completed_reviews" DROP COLUMN "response_time_seconds";
