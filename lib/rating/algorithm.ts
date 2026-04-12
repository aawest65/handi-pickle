// Rating algorithm based on PB Rating Schema.xlsx
// new_rate = initial + Table_A + Table_D_factor + Table_E_factor + Table_F_factor + Table_G_factor

import { pickleballAge } from "@/lib/pickleballAge";

export const CATEGORY_INITIAL_RATING: Record<string, number> = {
  NOVICE:       2.0,
  INTERMEDIATE: 3.5,
  ADVANCED:     4.5,
  PRO:          6.0,
};

export function categoryFromRating(rating: number): string {
  if (rating >= 5.5) return "PRO";
  if (rating >= 4.5) return "ADVANCED";
  if (rating >= 3.5) return "INTERMEDIATE";
  return "NOVICE";
}

// TABLE A — Base win/loss value (always ±0.05)
const TABLE_A = { win: 0.05, loss: -0.05 };

// TABLE D — Type weight applied on top of TABLE A base
// win/loss values are signed; formula uses: 0.05 × D[type].win (if won) or 0.05 × D[type].loss (if lost)
const TABLE_D: Record<string, { win: number; loss: number }> = {
  REC:          { win:  0.30, loss: -0.30 },
  CLUB:         { win:  0.40, loss: -0.40 },
  TOURNEY_REG:  { win:  0.60, loss: -0.40 },
  TOURNEY_MEDAL:{ win:  1.00, loss: -0.20 },
};

// TABLE E — Gender factor lookup by gender fact
// fact = sum of own team gender codes − sum of opp team gender codes
// gender code: MALE=1, FEMALE=2
// Positive fact (e.g. ww vs mm = +2): W value always applied (consolation if lose, bonus if win)
// Negative fact (e.g. mm vs ww = −2): W value if won (0 = no bonus), L value if lost (penalty)
const TABLE_E: Record<number, { win: number; loss: number }> = {
  [-2]: { win: 0.00, loss: -1.00 },
  [-1]: { win: 0.00, loss: -0.50 },
  [ 0]: { win: 0.00, loss:  0.00 },
  [ 1]: { win: 0.50, loss:  0.00 },
  [ 2]: { win: 1.00, loss:  0.00 },
};
const GENDER_BASE = 0.05;

// TABLE F — Age differential factor (per year of difference)
const AGE_FACTOR_PER_YEAR = 1 / 1200; // ≈ 0.000833

// TABLE G — Type rate bonus scaled by opponent rating ratio and score differential
const TABLE_G: Record<string, { win: number; loss: number }> = {
  REC:          { win:  0.02, loss: -0.02 },
  CLUB:         { win:  0.03, loss: -0.03 },
  TOURNEY_REG:  { win:  0.08, loss: -0.04 },
  TOURNEY_MEDAL:{ win:  0.10, loss: -0.01 },
};

function genderCode(gender: string): number {
  return gender === "MALE" ? 1 : 2;
}

export interface RatingFactors {
  winLoss:  number;
  type:     number;
  gender:   number;
  age:      number;
  rateType: number;
}

export interface RatingResult {
  newRating: number;
  delta:     number;
  factors:   RatingFactors;
}

export function calcNewRating(params: {
  playerRate:        number;
  playerAge:         number;
  playerGender:      string;          // "MALE" | "FEMALE"
  partnerRate:       number | null;
  partnerAge:        number | null;
  partnerGender:     string | null;
  oppRates:          number[];        // 1 or 2 opponent ratings
  oppAges:           number[];
  oppGenders:        string[];
  myScore:           number;
  oppScore:          number;
  gameType:          string;          // "REC" | "CLUB" | "TOURNEY_REG" | "TOURNEY_MEDAL"
}): RatingResult {
  const {
    playerRate, playerAge, playerGender,
    partnerRate, partnerAge, partnerGender,
    oppRates, oppAges, oppGenders,
    myScore, oppScore, gameType,
  } = params;

  const won = myScore > oppScore;
  const maxScore = Math.max(myScore, oppScore);

  // — Table A: base win/loss —
  const winLoss = won ? TABLE_A.win : TABLE_A.loss;

  // — Table D: type weight factor (0.05 × signed type weight) —
  const dRow = TABLE_D[gameType] ?? TABLE_D.REC;
  const typeFactor = 0.05 * (won ? dRow.win : dRow.loss);

  // — Table E: gender factor —
  const ownGenderSum = genderCode(playerGender) + (partnerGender ? genderCode(partnerGender) : 0);
  const oppGenderSum = oppGenders.reduce((s, g) => s + genderCode(g), 0);
  const genderFact = ownGenderSum - oppGenderSum;
  const eRow = TABLE_E[genderFact] ?? TABLE_E[0];
  // Positive/zero fact: W value always (consolation for expected loss, bonus for upset win)
  // Negative fact: W value if won (0 = expected, no bonus), L value if lost (penalty)
  const eValue = genderFact >= 0 ? eRow.win : (won ? eRow.win : eRow.loss);
  const genderFactor = eValue * GENDER_BASE;

  // — Table F: age factor —
  const ownAges = [playerAge, ...(partnerAge !== null ? [partnerAge] : [])];
  const ownAvgAge = ownAges.reduce((s, a) => s + a, 0) / ownAges.length;
  const oppAvgAge = oppAges.reduce((s, a) => s + a, 0) / oppAges.length;
  const ageFactor = (ownAvgAge - oppAvgAge) * AGE_FACTOR_PER_YEAR;

  // — Table G: type bonus × rate ratio × score differential —
  const oppAvgRate = oppRates.reduce((s, r) => s + r, 0) / oppRates.length;
  const rateFactor = won
    ? oppAvgRate / playerRate
    : playerRate / oppAvgRate;
  const gRow = TABLE_G[gameType] ?? TABLE_G.REC;
  const gValue = won ? gRow.win : gRow.loss;
  const scoreDiff = Math.abs(myScore - oppScore);
  const rateTypeFactor = gValue * rateFactor * (scoreDiff / maxScore);

  const delta = winLoss + typeFactor + genderFactor + ageFactor + rateTypeFactor;
  const newRating = playerRate + delta;

  return {
    newRating,
    delta,
    factors: { winLoss, type: typeFactor, gender: genderFactor, age: ageFactor, rateType: rateTypeFactor },
  };
}

// Determine the rating format for a game.
export function getRatingFormat(format: string, isMixed: boolean): "SINGLES" | "DOUBLES" | "MIXED" {
  if (format === "SINGLES") return "SINGLES";
  return isMixed ? "MIXED" : "DOUBLES";
}

// Determine whether a doubles game is mixed (at least one team has players of different genders).
export function detectMixed(
  team1Genders: string[],
  team2Genders: string[],
  format: string,
): boolean {
  if (format !== "DOUBLES") return false;
  const team1Mixed = new Set(team1Genders).size > 1;
  const team2Mixed = new Set(team2Genders).size > 1;
  return team1Mixed || team2Mixed;
}

// Pick the format-specific rating for a player.
// If the player has never played this format (0 games), seed from currentRating.
function formatRating(player: {
  currentRating: number;
  singlesRating: number; singlesGamesPlayed: number;
  doublesRating: number; doublesGamesPlayed: number;
  mixedRating:   number; mixedGamesPlayed:   number;
}, fmt: "SINGLES" | "DOUBLES" | "MIXED"): number {
  if (fmt === "SINGLES") return player.singlesGamesPlayed > 0 ? player.singlesRating : player.currentRating;
  if (fmt === "DOUBLES") return player.doublesGamesPlayed > 0 ? player.doublesRating : player.currentRating;
  return player.mixedGamesPlayed > 0 ? player.mixedRating : player.currentRating;
}

// Process a game and update all player ratings in the database.
export async function processGame(gameId: string): Promise<void> {
  const { prisma } = await import("@/lib/prisma");

  const game = await prisma.game.findUniqueOrThrow({
    where: { id: gameId },
    include: {
      team1Player1: true,
      team1Player2: true,
      team2Player1: true,
      team2Player2: true,
    },
  });

  type PlayerRecord = typeof game.team1Player1;

  const team1 = [game.team1Player1, game.team1Player2].filter(Boolean) as PlayerRecord[];
  const team2 = [game.team2Player1, game.team2Player2].filter(Boolean) as PlayerRecord[];

  const team1Genders = team1.map(p => p.gender);
  const team2Genders = team2.map(p => p.gender);

  const isMixed      = detectMixed(team1Genders, team2Genders, game.format);
  const ratingFormat = getRatingFormat(game.format, isMixed);

  // Store isMixed on the game record
  await prisma.game.update({ where: { id: gameId }, data: { isMixed } });

  const team1Ages = team1.map(p => pickleballAge(p.dateOfBirth));
  const team2Ages = team2.map(p => pickleballAge(p.dateOfBirth));

  // Use format-specific ratings for the calculation
  const team1Rates = team1.map(p => formatRating(p, ratingFormat));
  const team2Rates = team2.map(p => formatRating(p, ratingFormat));

  const updates: { player: PlayerRecord; result: RatingResult; formatRatingBefore: number }[] = [];

  for (let i = 0; i < team1.length; i++) {
    const player  = team1[i];
    const partner = team1[i === 0 ? 1 : 0] ?? null;
    const before  = formatRating(player, ratingFormat);
    const result  = calcNewRating({
      playerRate:    before,
      playerAge:     pickleballAge(player.dateOfBirth),
      playerGender:  player.gender,
      partnerRate:   partner ? formatRating(partner, ratingFormat) : null,
      partnerAge:    partner ? pickleballAge(partner.dateOfBirth) : null,
      partnerGender: partner?.gender ?? null,
      oppRates:      team2Rates,
      oppAges:       team2Ages,
      oppGenders:    team2Genders,
      myScore:       game.team1Score,
      oppScore:      game.team2Score,
      gameType:      game.gameType,
    });
    updates.push({ player, result, formatRatingBefore: before });
  }

  for (let i = 0; i < team2.length; i++) {
    const player  = team2[i];
    const partner = team2[i === 0 ? 1 : 0] ?? null;
    const before  = formatRating(player, ratingFormat);
    const result  = calcNewRating({
      playerRate:    before,
      playerAge:     pickleballAge(player.dateOfBirth),
      playerGender:  player.gender,
      partnerRate:   partner ? formatRating(partner, ratingFormat) : null,
      partnerAge:    partner ? pickleballAge(partner.dateOfBirth) : null,
      partnerGender: partner?.gender ?? null,
      oppRates:      team1Rates,
      oppAges:       team1Ages,
      oppGenders:    team1Genders,
      myScore:       game.team2Score,
      oppScore:      game.team1Score,
      gameType:      game.gameType,
    });
    updates.push({ player, result, formatRatingBefore: before });
  }

  for (const { player, result, formatRatingBefore } of updates) {
    // Format-specific field names
    const ratingField      = ratingFormat === "SINGLES" ? "singlesRating"
                           : ratingFormat === "DOUBLES" ? "doublesRating"
                           : "mixedRating";
    const gamesPlayedField = ratingFormat === "SINGLES" ? "singlesGamesPlayed"
                           : ratingFormat === "DOUBLES" ? "doublesGamesPlayed"
                           : "mixedGamesPlayed";

    await prisma.ratingHistory.create({
      data: {
        playerId:      player.id,
        gameId,
        ratingFormat,
        ratingBefore:  formatRatingBefore,
        ratingAfter:   result.newRating,
        delta:         result.delta,
        winLossFactor: result.factors.winLoss,
        typeFactor:    result.factors.type,
        genderFactor:  result.factors.gender,
        ageFactor:     result.factors.age,
        rateTypeFactor:result.factors.rateType,
      },
    });

    await prisma.player.update({
      where: { id: player.id },
      data: {
        [ratingField]:      result.newRating,
        [gamesPlayedField]: { increment: 1 },
        // Overall rating = weighted average across all formats
        currentRating: result.newRating,
        gamesPlayed:   { increment: 1 },
      },
    });
  }
}
