-- Add isPrivate flag to Club
ALTER TABLE "Club" ADD COLUMN "isPrivate" BOOLEAN NOT NULL DEFAULT false;

-- Create PlayerClub join table
CREATE TABLE "PlayerClub" (
    "playerId"  TEXT NOT NULL,
    "clubId"    TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerClub_pkey" PRIMARY KEY ("playerId", "clubId")
);

-- Foreign keys
ALTER TABLE "PlayerClub" ADD CONSTRAINT "PlayerClub_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlayerClub" ADD CONSTRAINT "PlayerClub_clubId_fkey"
    FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: migrate existing single-club memberships into PlayerClub (all as primary)
INSERT INTO "PlayerClub" ("playerId", "clubId", "isPrimary", "joinedAt")
SELECT "id", "clubId", true, "createdAt"
FROM "Player"
WHERE "clubId" IS NOT NULL;

-- Drop old clubId column from Player
ALTER TABLE "Player" DROP COLUMN "clubId";
