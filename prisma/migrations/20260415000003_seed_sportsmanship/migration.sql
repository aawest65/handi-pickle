-- Seed all existing players with a starting sportsmanship score of 4.9 (grade A).
-- New players get this seed at creation time; this backfills the existing ones.
-- The seed acts as a single "phantom" peer rating that gives everyone a clean
-- start and is quickly diluted as real peer ratings are submitted.
UPDATE "Player"
SET "sportsmanshipSum"   = 4.9,
    "sportsmanshipCount" = 1
WHERE "sportsmanshipCount" = 0;
