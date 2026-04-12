// Number of games required to reach 100% rating reliability.
// Increase this value to make the rating take longer to "settle".
export const RELIABILITY_GAMES_TARGET = 50;

export function calcReliability(gamesPlayed: number): number {
  return Math.min(gamesPlayed / RELIABILITY_GAMES_TARGET, 1.0);
}
