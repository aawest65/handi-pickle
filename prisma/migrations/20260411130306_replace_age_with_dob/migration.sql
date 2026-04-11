/*
  Warnings:

  - You are about to drop the column `age` on the `Player` table. All the data in the column will be lost.
  - Added the required column `dateOfBirth` to the `Player` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "age",
ADD COLUMN     "dateOfBirth" DATE NOT NULL;
