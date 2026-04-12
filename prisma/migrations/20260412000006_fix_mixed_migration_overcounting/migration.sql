-- The previous migration (20260412000005) over-counted in Step 3.
-- It adjusted game counts and ratings for ALL isMixed doubles games,
-- but should have only touched the newly reclassified ones (single-gender
-- teams with cross-team gender mixing, e.g. FF vs MM).
--
-- Games that were ALREADY correctly classified as mixed (intra-team mixing,
-- e.g. MF vs MF) had their doublesGamesPlayed incorrectly decremented and
-- mixedGamesPlayed incorrectly incremented a second time.
--
-- This migration reverses that over-counting for the already-correct games.

WITH already_mixed_games AS (
  -- Games that had intra-team gender mixing (were always correctly MIXED)
  SELECT DISTINCT g.id
  FROM "Game" g
  JOIN  "Player" t1p1 ON t1p1.id = g."team1Player1Id"
  LEFT JOIN "Player" t1p2 ON t1p2.id = g."team1Player2Id"
  JOIN  "Player" t2p1 ON t2p1.id = g."team2Player1Id"
  LEFT JOIN "Player" t2p2 ON t2p2.id = g."team2Player2Id"
  WHERE g.format = 'DOUBLES'
    AND g."isMixed" = true
    AND (
      (t1p2.id IS NOT NULL AND t1p1.gender != t1p2.gender)
      OR
      (t2p2.id IS NOT NULL AND t2p1.gender != t2p2.gender)
    )
),
overcounted AS (
  SELECT
    rh."playerId",
    COUNT(*)::int AS game_count,
    SUM(rh.delta)  AS delta_sum
  FROM "RatingHistory" rh
  WHERE rh."gameId" IN (SELECT id FROM already_mixed_games)
    AND rh."ratingFormat" = 'MIXED'
  GROUP BY rh."playerId"
)
UPDATE "Player" p
SET
  "doublesGamesPlayed" = "doublesGamesPlayed" + a.game_count,
  "mixedGamesPlayed"   = "mixedGamesPlayed"   - a.game_count,
  "doublesRating"      = "doublesRating"       + a.delta_sum,
  "mixedRating"        = "mixedRating"         - a.delta_sum
FROM overcounted a
WHERE p.id = a."playerId";
