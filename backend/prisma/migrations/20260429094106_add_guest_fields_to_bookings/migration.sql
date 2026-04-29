/*
  Warnings:

  - You are about to drop the column `tenantId` on the `airbnb_bookings` table. All the data in the column will be lost.
  - Added the required column `guestName` to the `airbnb_bookings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "airbnb_bookings" DROP CONSTRAINT "airbnb_bookings_tenantId_fkey";

-- AlterTable
ALTER TABLE "airbnb_bookings" DROP COLUMN "tenantId",
ADD COLUMN     "bookingSource" TEXT NOT NULL DEFAULT 'SELF_BOOKING',
ADD COLUMN     "bookingSourceOther" TEXT,
ADD COLUMN     "guestName" TEXT NOT NULL,
ADD COLUMN     "guestPhone" TEXT;
