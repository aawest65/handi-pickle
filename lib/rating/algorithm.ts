// All 6 lookup tables and the processMatch function

// Scale factor applied to all rating impacts.
// The raw spreadsheet values are calibrated for hundreds of games per season.
// Increase this to create more spread with fewer games (e.g. for demos/early seasons).
const RATING_SCALE = 4;

// TABLE A — Base Win/Loss value by play type
// playType key: "RECREATIONAL" | "LEAGUE" | "TOURNAMENT_REGULAR" | "TOURNAMENT_MEDAL"
// For "TOURNAMENT" matches with isMedalRound=false → use TOURNAMENT_REGULAR
// For "TOURNAMENT" matches with isMedalRound=true  → use TOURNAMENT_MEDAL

const TABLE_A: Record<string, { win: number; loss: number }> = {
  RECREATIONAL:       { win: 0.02,  loss: -0.02   },
  LEAGUE:             { win: 0.04,  loss: -0.03   },
  TOURNAMENT_REGULAR: { win: 0.09,  loss: -0.045  },
  TOURNAMENT_MEDAL:   { win: 0.13,  loss: -0.0325 },
};

// TABLE B — Gender factor matrix [winnerCategory][opponentCategory]
// Category derived from format:
//   MENS_SINGLES / MENS_DOUBLES → "MEN"
//   WOMENS_SINGLES / WOMENS_DOUBLES → "WOMEN"
//   MIXED_DOUBLES → "MIXED"
const TABLE_B: Record<string, Record<string, number>> = {
  MEN:   { MEN: 1.0,  MIXED: 0.75, WOMEN: 0.5  },
  MIXED: { MEN: 1.25, MIXED: 1.0,  WOMEN: 0.75 },
  WOMEN: { MEN: 1.5,  MIXED: 1.25, WOMEN: 1.0  },
};
const TABLE_B_BASE = 0.01;

// TABLE C — Win bonus by play type (applied only on win)
const TABLE_C: Record<string, number> = {
  RECREATIONAL:       0.0025,
  LEAGUE:             0.005,
  TOURNAMENT_REGULAR: 0.0075,
  TOURNAMENT_MEDAL:   0.01,
};

// TABLE D — Max points per game (standard: 11)
const MAX_POINTS = 11;

// TABLE E — Score differential factor by play type
const TABLE_E: Record<string, number> = {
  RECREATIONAL:       0.005,
  LEAGUE:             0.0075,
  TOURNAMENT_REGULAR: 0.01,
  TOURNAMENT_MEDAL:   0.0125,
};

// TABLE F — Age factor [playerAgeRange][opponentAgeRange] = { win, loss }
// Age ranges: "1-16" | "17-29" | "30-49" | "50-65" | "66-100"
const TABLE_F: Record<string, Record<string, { win: number; loss: number }>> = {
  "1-16":   { "1-16": {win:0.01,loss:-0.01}, "17-29": {win:0.01,loss:-0.01}, "30-49": {win:0.0025,loss:-0.0025}, "50-65": {win:0.001,loss:-0.005},   "66-100": {win:0.0005,loss:-0.02}   },
  "17-29":  { "1-16": {win:0.01,loss:-0.01}, "17-29": {win:0.01,loss:-0.01}, "30-49": {win:0.005,loss:-0.015},   "50-65": {win:0.0025,loss:-0.0175}, "66-100": {win:0.001,loss:-0.02}    },
  "30-49":  { "1-16": {win:0.0025,loss:-0.0025}, "17-29": {win:0.015,loss:-0.005}, "30-49": {win:0.01,loss:-0.01}, "50-65": {win:0.005,loss:-0.015},  "66-100": {win:0.0025,loss:-0.0175} },
  "50-65":  { "1-16": {win:0.005,loss:-0.001},   "17-29": {win:0.0175,loss:-0.0025}, "30-49": {win:0.015,loss:-0.005}, "50-65": {win:0.01,loss:-0.01}, "66-100": {win:0.005,loss:-0.015}  },
  "66-100": { "1-16": {win:0.02,loss:-0.0005},   "17-29": {win:0.02,loss:-0.001},    "30-49": {win:0.0175,loss:-0.0025}, "50-65": {win:0.015,loss:-0.005}, "66-100": {win:0.01,loss:-0.01} },
};

function getAgeRange(age: number): string {
  if (age <= 16) return "1-16";
  if (age <= 29) return "17-29";
  if (age <= 49) return "30-49";
  if (age <= 65) return "50-65";
  return "66-100";
}

function getFormatCategory(format: string): string {
  if (format === "MENS_SINGLES" || format === "MENS_DOUBLES") return "MEN";
  if (format === "WOMENS_SINGLES" || format === "WOMENS_DOUBLES") return "WOMEN";
  return "MIXED";
}

function getPlayTypeKey(playType: string, isMedalRound: boolean): string {
  if (playType === "TOURNAMENT") return isMedalRound ? "TOURNAMENT_MEDAL" : "TOURNAMENT_REGULAR";
  return playType; // "RECREATIONAL" or "LEAGUE"
}

// Calculate new rating for a single player in a match.
// Returns the new rating value.
export function calcPlayerRating(params: {
  playerRate: number;
  playerAge: number;
  opponentRates: number[];   // 1 or 2 opponent ratings
  opponentAges: number[];    // 1 or 2 opponent ages
  allPlayerRates: number[];  // all 4 (or 2) players' rates in the game
  myScore: number;
  opponentScore: number;
  won: boolean;
  playType: string;          // "RECREATIONAL" | "LEAGUE" | "TOURNAMENT"
  format: string;            // "MENS_SINGLES" etc.
  isMedalRound: boolean;
}): number {
  const { playerRate, playerAge, opponentRates, opponentAges, allPlayerRates, myScore, opponentScore, won, playType, format, isMedalRound } = params;

  const ptKey = getPlayTypeKey(playType, isMedalRound);
  const oppAvgRate = opponentRates.reduce((a, b) => a + b, 0) / opponentRates.length;
  const lowestRate = Math.min(...allPlayerRates);

  // Weighting factor
  const weighting = won
    ? oppAvgRate / playerRate
    : lowestRate / playerRate;

  // Table A impact — always use RECREATIONAL values for the stored "website" rating
  const tableAFactor = won ? TABLE_A.RECREATIONAL.win : TABLE_A.RECREATIONAL.loss;
  const tableAImpact = tableAFactor * weighting;

  // Table C impact (win only)
  const tableCImpact = won ? TABLE_C[ptKey] : 0;

  // Score differential impact
  const sdr = (myScore - opponentScore) / MAX_POINTS;
  const sdrImpact = sdr * weighting * TABLE_E[ptKey];

  // Gender impact (win only)
  const formatCat = getFormatCategory(format);
  const genderFactor = TABLE_B[formatCat][formatCat]; // same format = always 1.0
  const genderImpact = won ? TABLE_B_BASE * genderFactor : 0;

  // Age impact
  const playerAgeRange = getAgeRange(playerAge);
  const avgOppAge = opponentAges.reduce((a, b) => a + b, 0) / opponentAges.length;
  const oppAgeRange = getAgeRange(Math.round(avgOppAge));
  const ageImpact = won
    ? TABLE_F[playerAgeRange][oppAgeRange].win
    : TABLE_F[playerAgeRange][oppAgeRange].loss;

  const totalImpact = (tableAImpact + tableCImpact + sdrImpact + genderImpact + ageImpact) * RATING_SCALE;
  return playerRate + totalImpact;
}

// Process a match and update all player ratings in the database.
export async function processMatch(matchId: string): Promise<void> {
  // import prisma here to avoid circular deps at module load time
  const { prisma } = await import("@/lib/prisma");

  const match = await prisma.match.findUniqueOrThrow({
    where: { id: matchId },
    include: {
      team1Player1: true,
      team1Player2: true,
      team2Player1: true,
      team2Player2: true,
    },
  });

  const team1 = [match.team1Player1, match.team1Player2].filter(Boolean) as typeof match.team1Player1[];
  const team2 = [match.team2Player1, match.team2Player2].filter(Boolean) as typeof match.team2Player1[];

  // Get or create ratings for all players
  async function getRate(playerId: string): Promise<number> {
    const rating = await prisma.rating.findUnique({
      where: { playerId_playType_format: { playerId, playType: match.playType, format: match.format } },
    });
    return rating?.rating ?? 3.0;
  }

  const t1p1Rate = await getRate(match.team1Player1Id);
  const t1p2Rate = match.team1Player2Id ? await getRate(match.team1Player2Id) : null;
  const t2p1Rate = await getRate(match.team2Player1Id);
  const t2p2Rate = match.team2Player2Id ? await getRate(match.team2Player2Id) : null;

  const team1Rates = [t1p1Rate, ...(t1p2Rate !== null ? [t1p2Rate] : [])];
  const team2Rates = [t2p1Rate, ...(t2p2Rate !== null ? [t2p2Rate] : [])];
  const allRates = [...team1Rates, ...team2Rates];

  const team1Ages = team1.map(p => p.age);
  const team2Ages = team2.map(p => p.age);

  const team1Won = match.winningSide === "TEAM1";

  // Calculate new ratings for all players
  const updates: { playerId: string; newRating: number }[] = [];

  for (let i = 0; i < team1.length; i++) {
    const player = team1[i];
    const rate = team1Rates[i];
    const newRating = calcPlayerRating({
      playerRate: rate,
      playerAge: player.age,
      opponentRates: team2Rates,
      opponentAges: team2Ages,
      allPlayerRates: allRates,
      myScore: match.team1Score,
      opponentScore: match.team2Score,
      won: team1Won,
      playType: match.playType,
      format: match.format,
      isMedalRound: match.isMedalRound,
    });
    updates.push({ playerId: player.id, newRating });
  }

  for (let i = 0; i < team2.length; i++) {
    const player = team2[i];
    const rate = team2Rates[i];
    const newRating = calcPlayerRating({
      playerRate: rate,
      playerAge: player.age,
      opponentRates: team1Rates,
      opponentAges: team1Ages,
      allPlayerRates: allRates,
      myScore: match.team2Score,
      opponentScore: match.team1Score,
      won: !team1Won,
      playType: match.playType,
      format: match.format,
      isMedalRound: match.isMedalRound,
    });
    updates.push({ playerId: player.id, newRating });
  }

  // Upsert all rating records
  for (const { playerId, newRating } of updates) {
    await prisma.rating.upsert({
      where: { playerId_playType_format: { playerId, playType: match.playType, format: match.format } },
      update: {
        rating: newRating,
        gamesPlayed: { increment: 1 },
        // reliability: based on games played, computed next line via a read-then-write approach
      },
      create: {
        playerId,
        playType: match.playType,
        format: match.format,
        rating: newRating,
        reliability: 0,
        gamesPlayed: 1,
      },
    });
    // Update reliability based on new gamesPlayed count
    const updated = await prisma.rating.findUnique({
      where: { playerId_playType_format: { playerId, playType: match.playType, format: match.format } },
    });
    if (updated) {
      const reliability = Math.min(updated.gamesPlayed / 30, 1.0);
      await prisma.rating.update({
        where: { playerId_playType_format: { playerId, playType: match.playType, format: match.format } },
        data: { reliability },
      });
    }
  }
}
