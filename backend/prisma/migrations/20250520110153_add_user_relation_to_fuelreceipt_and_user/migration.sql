/*
  Warnings:

  - Added the required column `userId` to the `FuelReceipt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FuelReceipt" ADD COLUMN     "userId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "FuelReceipt_userId_idx" ON "FuelReceipt"("userId");

-- AddForeignKey
ALTER TABLE "FuelReceipt" ADD CONSTRAINT "FuelReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
