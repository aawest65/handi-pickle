-- Add clubId to Game (which club this game counts toward; null = not a club game)
ALTER TABLE "Game" ADD COLUMN "clubId" TEXT;
ALTER TABLE "Game" ADD CONSTRAINT "Game_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add clubId to PlayerCategoryRating (null = REC/TOURNEY row, non-null = club-specific row)
ALTER TABLE "PlayerCategoryRating" ADD COLUMN "clubId" TEXT;
ALTER TABLE "PlayerCategoryRating" ADD CONSTRAINT "PlayerCategoryRating_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop the old unique constraint and replace with a regular index that supports multiple
-- club-specific rows per (playerId, format, gameCategory)
DROP INDEX IF EXISTS "PlayerCategoryRating_playerId_format_gameCategory_key";
CREATE INDEX "PlayerCategoryRating_playerId_format_gameCategory_clubId_idx"
  ON "PlayerCategoryRating"("playerId", "format", "gameCategory", "clubId");

-- Add clubId to RatingHistory for traceability
ALTER TABLE "RatingHistory" ADD COLUMN "clubId" TEXT;
ALTER TABLE "RatingHistory" ADD CONSTRAINT "RatingHistory_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
