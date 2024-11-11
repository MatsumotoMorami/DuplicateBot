/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `userInfo` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "userInfo_userId_key" ON "userInfo"("userId");
