-- Drop old tables (order matters for foreign keys)
DROP TABLE IF EXISTS "TournamentMatch";
DROP TABLE IF EXISTS "LeagueMatch";
DROP TABLE IF EXISTS "Tournament";
DROP TABLE IF EXISTS "League";
DROP TABLE IF EXISTS "Rating";
DROP TABLE IF EXISTS "Match";

-- Add new columns to Player
ALTER TABLE "Player" ADD COLUMN "currentRating" REAL NOT NULL DEFAULT 3.0;
ALTER TABLE "Player" ADD COLUMN "gamesPlayed" INTEGER NOT NULL DEFAULT 0;

-- Reset currentRating based on selfRatedCategory
UPDATE "Player" SET "currentRating" = CASE
  WHEN "selfRatedCategory" = 'PRO'          THEN 6.0
  WHEN "selfRatedCategory" = 'ADVANCED'     THEN 4.5
  WHEN "selfRatedCategory" = 'INTERMEDIATE' THEN 3.5
  ELSE 2.0
END;

-- Create Game table
CREATE TABLE "Game" (
  "id"             TEXT    NOT NULL PRIMARY KEY,
  "gameType"       TEXT    NOT NULL,
  "format"         TEXT    NOT NULL,
  "date"           DATETIME NOT NULL,
  "maxScore"       INTEGER NOT NULL DEFAULT 11,
  "team1Score"     INTEGER NOT NULL,
  "team2Score"     INTEGER NOT NULL,
  "team1Player1Id" TEXT    NOT NULL,
  "team1Player2Id" TEXT,
  "team2Player1Id" TEXT    NOT NULL,
  "team2Player2Id" TEXT,
  "createdAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Game_team1Player1Id_fkey" FOREIGN KEY ("team1Player1Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Game_team1Player2Id_fkey" FOREIGN KEY ("team1Player2Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Game_team2Player1Id_fkey" FOREIGN KEY ("team2Player1Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Game_team2Player2Id_fkey" FOREIGN KEY ("team2Player2Id") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create RatingHistory table
CREATE TABLE "RatingHistory" (
  "id"             TEXT    NOT NULL PRIMARY KEY,
  "playerId"       TEXT    NOT NULL,
  "gameId"         TEXT    NOT NULL,
  "ratingBefore"   REAL    NOT NULL,
  "ratingAfter"    REAL    NOT NULL,
  "delta"          REAL    NOT NULL,
  "winLossFactor"  REAL    NOT NULL,
  "typeFactor"     REAL    NOT NULL,
  "genderFactor"   REAL    NOT NULL,
  "ageFactor"      REAL    NOT NULL,
  "rateTypeFactor" REAL    NOT NULL,
  "createdAt"      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RatingHistory_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RatingHistory_gameId_fkey"   FOREIGN KEY ("gameId")   REFERENCES "Game"   ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
