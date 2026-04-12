-- Reclassify doubles games where both genders appear across all players
-- (previously only flagged mixed if a single team had mixed genders;
--  now two women vs two men is also classified as mixed doubles)

-- Step 1: update isMixed on games that have both genders across all players
UPDATE "Game"
SET "isMixed" = true
WHERE format = 'DOUBLES'
  AND "isMixed" = false
  AND id IN (
    SELECT g.id
    FROM "Game" g
    JOIN "Player" t1p1 ON t1p1.id = g."team1Player1Id"
    JOIN "Player" t2p1 ON t2p1.id = g."team2Player1Id"
    LEFT JOIN "Player" t1p2 ON t1p2.id = g."team1Player2Id"
    LEFT JOIN "Player" t2p2 ON t2p2.id = g."team2Player2Id"
    WHERE g.format = 'DOUBLES'
      AND g."isMixed" = false
      AND (
        -- At least one player is MALE and at least one is FEMALE across all four slots
        (t1p1.gender = 'MALE' OR COALESCE(t1p2.gender, '') = 'MALE' OR t2p1.gender = 'MALE' OR COALESCE(t2p2.gender, '') = 'MALE')
        AND
        (t1p1.gender = 'FEMALE' OR COALESCE(t1p2.gender, '') = 'FEMALE' OR t2p1.gender = 'FEMALE' OR COALESCE(t2p2.gender, '') = 'FEMALE')
      )
  );

-- Step 2: update ratingFormat on RatingHistory for those now-mixed games
UPDATE "RatingHistory"
SET "ratingFormat" = 'MIXED'
WHERE "ratingFormat" = 'DOUBLES'
  AND "gameId" IN (
    SELECT id FROM "Game" WHERE format = 'DOUBLES' AND "isMixed" = true
  );

-- Step 3: transfer accumulated delta and game count from doubles to mixed
-- for each player affected by the reclassified games
WITH adjustments AS (
  SELECT
    rh."playerId",
    COUNT(*)::int AS game_count,
    SUM(rh.delta) AS delta_sum
  FROM "RatingHistory" rh
  JOIN "Game" g ON g.id = rh."gameId"
  WHERE g.format = 'DOUBLES'
    AND g."isMixed" = true
    AND rh."ratingFormat" = 'MIXED'
  GROUP BY rh."playerId"
)
UPDATE "Player" p
SET
  "doublesGamesPlayed" = "doublesGamesPlayed" - a.game_count,
  "mixedGamesPlayed"   = "mixedGamesPlayed"   + a.game_count,
  "doublesRating"      = "doublesRating"       - a.delta_sum,
  "mixedRating"        = "mixedRating"         + a.delta_sum
FROM adjustments a
WHERE p.id = a."playerId";
