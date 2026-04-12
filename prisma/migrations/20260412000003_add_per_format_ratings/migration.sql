-- Add isMixed to Game (default false, backfilled below)
ALTER TABLE "Game" ADD COLUMN "isMixed" BOOLEAN NOT NULL DEFAULT false;

-- Backfill isMixed: true when format=DOUBLES and at least one team has players of different genders
UPDATE "Game" g
SET "isMixed" = true
WHERE g.format = 'DOUBLES'
  AND (
    (
      g."team1Player2Id" IS NOT NULL AND
      (SELECT p.gender FROM "Player" p WHERE p.id = g."team1Player1Id") !=
      (SELECT p.gender FROM "Player" p WHERE p.id = g."team1Player2Id")
    )
    OR
    (
      g."team2Player2Id" IS NOT NULL AND
      (SELECT p.gender FROM "Player" p WHERE p.id = g."team2Player1Id") !=
      (SELECT p.gender FROM "Player" p WHERE p.id = g."team2Player2Id")
    )
  );

-- Add ratingFormat to RatingHistory (temporary default 'SINGLES', backfilled below)
ALTER TABLE "RatingHistory" ADD COLUMN "ratingFormat" TEXT NOT NULL DEFAULT 'SINGLES';

-- Backfill ratingFormat from the related Game
UPDATE "RatingHistory" rh
SET "ratingFormat" = CASE
  WHEN g.format = 'SINGLES' THEN 'SINGLES'
  WHEN g.format = 'DOUBLES' AND g."isMixed" = true THEN 'MIXED'
  ELSE 'DOUBLES'
END
FROM "Game" g
WHERE rh."gameId" = g.id;

-- Remove the temporary default
ALTER TABLE "RatingHistory" ALTER COLUMN "ratingFormat" DROP DEFAULT;

-- Add per-format rating and games-played fields to Player
ALTER TABLE "Player"
  ADD COLUMN "singlesRating"      DOUBLE PRECISION NOT NULL DEFAULT 3.0,
  ADD COLUMN "doublesRating"      DOUBLE PRECISION NOT NULL DEFAULT 3.0,
  ADD COLUMN "mixedRating"        DOUBLE PRECISION NOT NULL DEFAULT 3.0,
  ADD COLUMN "singlesGamesPlayed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "doublesGamesPlayed" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "mixedGamesPlayed"   INTEGER NOT NULL DEFAULT 0;

-- Seed per-format ratings from each player's current overall rating
UPDATE "Player" SET
  "singlesRating" = "currentRating",
  "doublesRating" = "currentRating",
  "mixedRating"   = "currentRating";

-- Backfill per-format games played from RatingHistory
UPDATE "Player" p SET
  "singlesGamesPlayed" = (
    SELECT COUNT(*) FROM "RatingHistory" rh
    WHERE rh."playerId" = p.id AND rh."ratingFormat" = 'SINGLES'
  ),
  "doublesGamesPlayed" = (
    SELECT COUNT(*) FROM "RatingHistory" rh
    WHERE rh."playerId" = p.id AND rh."ratingFormat" = 'DOUBLES'
  ),
  "mixedGamesPlayed" = (
    SELECT COUNT(*) FROM "RatingHistory" rh
    WHERE rh."playerId" = p.id AND rh."ratingFormat" = 'MIXED'
  );
