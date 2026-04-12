-- Add auto-incrementing player number for human-readable support IDs
CREATE SEQUENCE IF NOT EXISTS "Player_playerNumber_seq";

ALTER TABLE "Player"
  ADD COLUMN IF NOT EXISTS "playerNumber" INTEGER NOT NULL DEFAULT nextval('"Player_playerNumber_seq"'),
  ADD COLUMN IF NOT EXISTS "showAge" BOOLEAN NOT NULL DEFAULT true;

-- Backfill existing players with sequential numbers
SELECT setval('"Player_playerNumber_seq"', COALESCE((SELECT MAX("playerNumber") FROM "Player"), 0));

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Player_playerNumber_key" ON "Player"("playerNumber");
