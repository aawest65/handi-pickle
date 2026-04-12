-- Convert playerNumber from Int to String (e.g. "WA1042")
-- Drop the old unique index and sequence, backfill existing rows, then add new unique index.

-- 1. Drop existing unique index
DROP INDEX IF EXISTS "Player_playerNumber_key";

-- 2. Add a temporary text column
ALTER TABLE "Player" ADD COLUMN IF NOT EXISTS "playerNumberNew" TEXT;

-- 3. Backfill existing players: derive initials from name, append zero-padded old number
UPDATE "Player"
SET "playerNumberNew" = (
  -- Last-name initial: last word of name
  upper(left(
    split_part(trim("name"), ' ', array_length(string_to_array(trim("name"), ' '), 1)),
    1
  )) ||
  -- First-name initial: first word of name
  upper(left(trim("name"), 1)) ||
  -- 4-digit zero-padded old playerNumber
  lpad("playerNumber"::text, 4, '0')
);

-- 4. Drop old column and sequence
ALTER TABLE "Player" DROP COLUMN "playerNumber";
DROP SEQUENCE IF EXISTS "Player_playerNumber_seq";

-- 5. Rename new column
ALTER TABLE "Player" RENAME COLUMN "playerNumberNew" TO "playerNumber";

-- 6. Set NOT NULL
ALTER TABLE "Player" ALTER COLUMN "playerNumber" SET NOT NULL;

-- 7. Recreate unique index
CREATE UNIQUE INDEX "Player_playerNumber_key" ON "Player"("playerNumber");
