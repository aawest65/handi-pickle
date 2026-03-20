/*
  Warnings:

  - Added the required column `age` to the `Player` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playType" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "team1Score" INTEGER NOT NULL,
    "team2Score" INTEGER NOT NULL,
    "winningSide" TEXT NOT NULL,
    "isMedalRound" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "team1Player1Id" TEXT NOT NULL,
    "team1Player2Id" TEXT,
    "team2Player1Id" TEXT NOT NULL,
    "team2Player2Id" TEXT,
    CONSTRAINT "Match_team1Player1Id_fkey" FOREIGN KEY ("team1Player1Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_team1Player2Id_fkey" FOREIGN KEY ("team1Player2Id") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_team2Player1Id_fkey" FOREIGN KEY ("team2Player1Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_team2Player2Id_fkey" FOREIGN KEY ("team2Player2Id") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("createdAt", "date", "format", "id", "playType", "team1Player1Id", "team1Player2Id", "team1Score", "team2Player1Id", "team2Player2Id", "team2Score", "winningSide") SELECT "createdAt", "date", "format", "id", "playType", "team1Player1Id", "team1Player2Id", "team1Score", "team2Player1Id", "team2Player2Id", "team2Score", "winningSide" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("age", "createdAt", "gender", "id", "name", "userId") SELECT 30, "createdAt", "gender", "id", "name", "userId" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
