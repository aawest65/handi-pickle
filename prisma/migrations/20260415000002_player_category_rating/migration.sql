-- PlayerCategoryRating: independent rating track per player per (format × game category).
-- format:       SINGLES | DOUBLES | MIXED
-- gameCategory: REC | CLUB | TOURNEY  (TOURNEY covers TOURNEY_REG + TOURNEY_MEDAL)

CREATE TABLE "PlayerCategoryRating" (
  "id"           TEXT             NOT NULL,
  "playerId"     TEXT             NOT NULL,
  "format"       TEXT             NOT NULL,
  "gameCategory" TEXT             NOT NULL,
  "rating"       DOUBLE PRECISION NOT NULL DEFAULT 3.0,
  "gamesPlayed"  INTEGER          NOT NULL DEFAULT 0,
  "wins"         INTEGER          NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlayerCategoryRating_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PlayerCategoryRating"
  ADD CONSTRAINT "PlayerCategoryRating_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "PlayerCategoryRating_playerId_format_gameCategory_key"
  ON "PlayerCategoryRating"("playerId", "format", "gameCategory");

-- SportsmanshipRating: per-game peer ratings (1–5) submitted after each match.
-- Averaged to a letter grade on the profile card: A ≥ 4.5, B ≥ 3.5, C ≥ 2.5, D ≥ 1.5, F < 1.5

CREATE TABLE "SportsmanshipRating" (
  "id"            TEXT         NOT NULL,
  "gameId"        TEXT         NOT NULL,
  "raterId"       TEXT         NOT NULL,
  "ratedPlayerId" TEXT         NOT NULL,
  "score"         INTEGER      NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SportsmanshipRating_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SportsmanshipRating"
  ADD CONSTRAINT "SportsmanshipRating_gameId_fkey"
  FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SportsmanshipRating"
  ADD CONSTRAINT "SportsmanshipRating_raterId_fkey"
  FOREIGN KEY ("raterId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SportsmanshipRating"
  ADD CONSTRAINT "SportsmanshipRating_ratedPlayerId_fkey"
  FOREIGN KEY ("ratedPlayerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "SportsmanshipRating_gameId_raterId_ratedPlayerId_key"
  ON "SportsmanshipRating"("gameId", "raterId", "ratedPlayerId");

-- Add initialRating and sportsmanship denorm columns to Player.
-- initialRating is the registration/admin-set seed used to start each category track.
ALTER TABLE "Player" ADD COLUMN "initialRating"       DOUBLE PRECISION NOT NULL DEFAULT 3.0;
ALTER TABLE "Player" ADD COLUMN "sportsmanshipSum"    DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Player" ADD COLUMN "sportsmanshipCount"  INTEGER          NOT NULL DEFAULT 0;

-- Seed initialRating from selfRatedCategory for existing players.
UPDATE "Player" SET "initialRating" = CASE
  WHEN "selfRatedCategory" = 'NOVICE'       THEN 2.0
  WHEN "selfRatedCategory" = 'INTERMEDIATE' THEN 3.5
  WHEN "selfRatedCategory" = 'ADVANCED'     THEN 4.5
  WHEN "selfRatedCategory" = 'PRO'          THEN 6.0
  ELSE 3.0
END;

-- Enable RLS on new tables (consistent with existing tables).
ALTER TABLE "PlayerCategoryRating" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SportsmanshipRating"  ENABLE ROW LEVEL SECURITY;
