/**
 * Scrape Anna Leigh Waters' PPA semi-final and final match results from PickleWave,
 * then seed the local database with those Game records to test the rating algorithm.
 *
 * How it works:
 *  1. Uses Puppeteer to load ALW's PickleWave profile page and trigger the lazy-loaded
 *     "Recent Matches" turbo-frame — capturing all match URLs for ALW.
 *  2. For each match URL, does a plain HTTP GET to fetch the server-rendered match page,
 *     which contains the round label ("Finals", "Semi-Finals") and final score inline.
 *  3. Filters for Finals and Semi-Finals, creates Player + Game records in the local DB,
 *     and calls processGame() to update ratings.
 *
 * Run with:
 *   npx tsx scripts/scrape-alw-ppa.ts
 *
 * Optional flags:
 *   --debug       Save frame HTML to scripts/picklewave-frame.html for inspection
 *   --dry-run     Scrape and log matches without writing to the database
 */

import puppeteer from "puppeteer";
import { writeFileSync } from "fs";
import { prisma } from "../lib/prisma";
import { processGame } from "../lib/rating/algorithm";

const DEBUG   = process.argv.includes("--debug");
const DRY_RUN = process.argv.includes("--dry-run");
const BASE_URL = "https://www.picklewave.com";

// ─── Known Pro Players ────────────────────────────────────────────────────────
// Name (as it appears in URL slugs, title-cased) → { gender, age as of 2026 }
const KNOWN_PLAYERS: Record<string, { gender: "MALE" | "FEMALE"; age: number }> = {
  "Anna Leigh Waters":   { gender: "FEMALE", age: 20 },
  "Anna Bright":         { gender: "FEMALE", age: 27 },
  "Jessie Irvine":       { gender: "FEMALE", age: 34 },
  "Catherine Parenteau": { gender: "FEMALE", age: 30 },
  "Lea Jansen":          { gender: "FEMALE", age: 30 },
  "Parris Todd":         { gender: "FEMALE", age: 24 },
  "Simone Jardim":       { gender: "FEMALE", age: 41 },
  "Callie Smith":        { gender: "FEMALE", age: 28 },
  "Lucy Kovalova":       { gender: "FEMALE", age: 34 },
  "Meghan Dizon":        { gender: "FEMALE", age: 28 },
  "Tina Pisnik":         { gender: "FEMALE", age: 37 },
  "Hurricane Tyra Black":{ gender: "FEMALE", age: 29 },
  "Jade Kawamoto":       { gender: "FEMALE", age: 28 },
  "Brooke Buckner":      { gender: "FEMALE", age: 28 },
  "Paris Todd":          { gender: "FEMALE", age: 24 },
  "Georgia Johnson":     { gender: "FEMALE", age: 24 },
  "Ben Johns":           { gender: "MALE",   age: 27 },
  "Collin Johns":        { gender: "MALE",   age: 30 },
  "Matt Wright":         { gender: "MALE",   age: 38 },
  "Riley Newman":        { gender: "MALE",   age: 29 },
  "J.W. Johnson":        { gender: "MALE",   age: 23 },
  "Federico Staksrud":   { gender: "MALE",   age: 30 },
  "Tyson McGuffin":      { gender: "MALE",   age: 33 },
  "Zane Navratil":       { gender: "MALE",   age: 31 },
  "Jay Devilliers":      { gender: "MALE",   age: 36 },
  "Dylan Frazier":       { gender: "MALE",   age: 25 },
  "Hunter Johnson":      { gender: "MALE",   age: 22 },
  "Will Howells":        { gender: "MALE",   age: 28 },
  "Eric Oncins":         { gender: "MALE",   age: 34 },
  "Gabriel Tardio":      { gender: "MALE",   age: 27 },
  "Christian Alshon":    { gender: "MALE",   age: 28 },
  "Andrei Daescu":       { gender: "MALE",   age: 28 },
  "Kaitlyn Christian":   { gender: "FEMALE", age: 29 },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedMatch {
  matchUrl:   string;
  tournament: string;
  date:       string;          // ISO date string  e.g. "2026-04-05"
  round:      "Finals" | "Semi-Finals";
  format:     "SINGLES" | "DOUBLES";
  team1Names: string[];        // ALW's team
  team2Names: string[];        // Opposing team
  team1Score: number;          // sets won by team1
  team2Score: number;          // sets won by team2
}

// ─── Step 1: Get Match URLs from the Profile Page ─────────────────────────────

const ALW_PROFILE_URL = `${BASE_URL}/players/477702-anna-leigh-waters`;
const FRAME_PARTIAL   = "/players/477702-anna-leigh-waters/recent-matches-table";
const FRAME_ID        = "recent_matches";

async function getMatchUrls(): Promise<string[]> {
  const browser = await puppeteer.launch({ headless: true });
  const page    = await browser.newPage();

  let frameHtml = "";

  // Intercept the turbo-frame response
  page.on("response", async (response) => {
    if (response.url().includes(FRAME_PARTIAL)) {
      try { frameHtml = await response.text(); } catch { /* already consumed */ }
    }
  });

  console.log("  Loading ALW profile page …");
  await page.goto(ALW_PROFILE_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });

  // Scroll the lazy turbo-frame into view to trigger the fetch
  await page.evaluate((id) => {
    document.querySelector(`turbo-frame#${id}`)?.scrollIntoView({ behavior: "instant" });
  }, FRAME_ID);

  // Wait for the frame HTML to arrive (up to 30 seconds)
  await new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const poll  = setInterval(() => {
      if (frameHtml.length > 500) { clearInterval(poll); resolve(); }
      if (Date.now() - start > 30_000) {
        clearInterval(poll);
        reject(new Error("Timed out waiting for turbo-frame content"));
      }
    }, 300);
  });

  await browser.close();
  console.log(`  Frame HTML received (${(frameHtml.length / 1024).toFixed(0)} KB)`);

  if (DEBUG) {
    writeFileSync("scripts/picklewave-frame.html", frameHtml, "utf8");
    console.log("  Debug HTML saved to scripts/picklewave-frame.html");
  }

  // Extract unique match URLs from the frame HTML
  const matchUrlRe = /href="(\/matches\/[^"]+)"/g;
  const seen       = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = matchUrlRe.exec(frameHtml)) !== null) {
    seen.add(m[1]);
  }

  const urls = [...seen];
  console.log(`  Found ${urls.length} unique match URLs`);
  return urls;
}

// ─── Step 2: Parse a Match Detail Page ───────────────────────────────────────

/**
 * Fetches a match page and extracts:
 * - Round name ("Finals" or "Semi-Finals")
 * - Final score ("2 - 0", "2 - 1", etc. — these are sets won)
 * - Player names (team 1 and team 2)
 * - Tournament name and date
 *
 * The data is reliably server-rendered inline in the page's meta description:
 *   "Watch Team1 vs Team2 in the Finals at 2026 PPA Asia Hanoi Cup on April 5, 2026.
 *    Final score: 2 - 0."
 */
async function fetchMatchDetail(slug: string): Promise<ParsedMatch | null> {
  const url = `${BASE_URL}${slug}`;
  let html  = "";

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15_000),
    });
    html = await res.text();
  } catch (err) {
    console.warn(`  ⚠  Failed to fetch ${slug}: ${(err as Error).message}`);
    return null;
  }

  // ── Round ──
  // Server-rendered meta: "in the Finals at ..." or "in the Semi-Finals at ..."
  const roundRe = /in the (Finals|Semi-Finals) at /i;
  const roundM  = html.match(roundRe);
  if (!roundM) return null;   // Not a final/semi-final — skip early

  const round = roundM[1] === "Finals" ? "Finals" : "Semi-Finals";

  // ── Score ──
  // "Final score: 2 - 0" or "2 - 1"
  const scoreRe = /Final score:\s*(\d+)\s*-\s*(\d+)/i;
  const scoreM  = html.match(scoreRe);
  if (!scoreM) return null;

  const team1Score = parseInt(scoreM[1], 10);
  const team2Score = parseInt(scoreM[2], 10);
  if (team1Score === team2Score) return null;

  // ── Players: use JSON-LD competitor field for full names ──
  // JSON-LD: "competitor":[{"name":"Anna Leigh Waters \u0026 Ben Johns"},{...}]
  let team1Names: string[] = [];
  let team2Names: string[] = [];

  const ldRe  = /<script type="application\/ld\+json">([\s\S]+?)<\/script>/i;
  const ldM   = html.match(ldRe);
  if (ldM) {
    try {
      const ld = JSON.parse(ldM[1]) as { competitor?: { name?: string }[] };
      const competitors = ld.competitor ?? [];
      team1Names = splitByAmpersand(competitors[0]?.name ?? "");
      team2Names = splitByAmpersand(competitors[1]?.name ?? "");
    } catch { /* fall through to slug-based fallback */ }
  }

  // Fallback: parse from URL slug
  if (!team1Names.length) {
    const vsIdx = slug.indexOf("-vs-");
    if (vsIdx !== -1) {
      const t1Part = slug.slice(slug.indexOf("/matches/") + 9).replace(/^\d+-/, "").slice(0, vsIdx - (slug.indexOf("/matches/") + 9) - slug.replace(/^\d+-/,"").length + 1);
      void t1Part; // complex, skip — just use slug names
    }
    team1Names = extractTeam1FromSlug(slug);
    team2Names = extractTeam2FromSlug(slug);
  }

  // ── Format ──
  const format: "SINGLES" | "DOUBLES" =
    team1Names.length > 1 || team2Names.length > 1 ? "DOUBLES" : "SINGLES";

  // ── Tournament ──
  const tournRe = /in the (?:Finals|Semi-Finals) at (.+?) on /i;
  const tournM  = html.match(tournRe);
  const tournament = tournM ? tournM[1].trim() : "PPA Tournament";

  // ── Date: prefer JSON-LD startDate, fallback to text ──
  const ldDateRe = /"startDate":"([^"]+)"/;
  const ldDateM  = html.match(ldDateRe);
  const date     = ldDateM
    ? ldDateM[1].split("T")[0]
    : (() => {
        const dateRe = /on\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/i;
        const dateM  = html.match(dateRe);
        return dateM ? normalizeDate(dateM[1]) : new Date().toISOString().split("T")[0];
      })();

  return { matchUrl: slug, tournament, date, round, format, team1Names, team2Names, team1Score, team2Score };
}

// ─── Name Helpers ─────────────────────────────────────────────────────────────

/** Split "Anna Leigh Waters & Ben Johns" → ["Anna Leigh Waters", "Ben Johns"] */
function splitByAmpersand(s: string): string[] {
  return s.split(/\s*&\s*/).map(n => n.trim()).filter(Boolean);
}

/** Extract team 1 names from slug like "/matches/123-player-a-player-b-vs-player-c-player-d" */
function extractTeam1FromSlug(slug: string): string[] {
  const base  = slug.replace(/^\/matches\/\d+-/, "");
  const vsIdx = base.indexOf("-vs-");
  if (vsIdx === -1) return [slugToName(base)];
  return [slugToName(base.slice(0, vsIdx))];
}

function extractTeam2FromSlug(slug: string): string[] {
  const base  = slug.replace(/^\/matches\/\d+-/, "");
  const vsIdx = base.indexOf("-vs-");
  if (vsIdx === -1) return [];
  return [slugToName(base.slice(vsIdx + 4))];
}

function slugToName(s: string): string {
  return s.split("-").map(titleCase).join(" ");
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeDate(raw: string): string {
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  } catch {}
  return new Date().toISOString().split("T")[0];
}

// ─── Step 3: Database Import ──────────────────────────────────────────────────

function slugEmail(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ".") + "@ppa-import.test";
}

async function upsertPlayer(name: string): Promise<string> {
  const email  = slugEmail(name);
  const info   = KNOWN_PLAYERS[name];
  const gender = info?.gender ?? "FEMALE";   // default female (common in ALW's events)
  const age    = info?.age ?? 28;

  const user = await prisma.user.upsert({
    where:  { email },
    update: {},
    create: { email, name },
  });

  const player = await prisma.player.upsert({
    where:  { userId: user.id },
    update: {},
    create: {
      userId:            user.id,
      name,
      gender,
      age,
      selfRatedCategory: "PRO",
      currentRating:     6.0,
    },
  });

  return player.id;
}

async function gameExistsByPlayers(date: string, t1p1Id: string, t2p1Id: string): Promise<boolean> {
  const day   = new Date(date);
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end   = new Date(day); end.setHours(23, 59, 59, 999);

  const existing = await prisma.game.findFirst({
    where: { date: { gte: start, lte: end }, team1Player1Id: t1p1Id, team2Player1Id: t2p1Id },
  });
  return existing !== null;
}

async function importMatch(match: ParsedMatch): Promise<void> {
  const gameType = match.round === "Finals" ? "TOURNEY_MEDAL" : "TOURNEY_REG";

  // Upsert all players
  const t1ids = await Promise.all(match.team1Names.map(n => upsertPlayer(n)));
  const t2ids = await Promise.all(match.team2Names.map(n => upsertPlayer(n)));

  const t1p1 = t1ids[0];
  const t1p2 = t1ids[1] ?? null;
  const t2p1 = t2ids[0];
  const t2p2 = t2ids[1] ?? null;

  if (await gameExistsByPlayers(match.date, t1p1, t2p1)) {
    console.log(`  ⏭  Skipped (already exists): ${match.round} ${match.team1Names[0]} vs ${match.team2Names[0]}`);
    return;
  }

  const game = await prisma.game.create({
    data: {
      gameType,
      format:         match.format,
      date:           new Date(match.date),
      maxScore:       2,   // best-of-3 sets; maxScore=2 means need 2 to win
      team1Score:     match.team1Score,
      team2Score:     match.team2Score,
      team1Player1Id: t1p1,
      team1Player2Id: t1p2,
      team2Player1Id: t2p1,
      team2Player2Id: t2p2,
    },
  });

  await processGame(game.id);

  const result  = match.team1Score > match.team2Score ? "WIN " : "LOSS";
  const t1label = match.team1Names.join(" / ");
  const t2label = match.team2Names.join(" / ");
  console.log(
    `  ✅ [${result}] ${match.round.padEnd(12)} ${gameType.padEnd(15)} ` +
    `${t1label} ${match.team1Score}-${match.team2Score} ${t2label}  (${match.date})`
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== ALW PPA Match Scraper ===\n");
  if (DRY_RUN) console.log("  [DRY RUN — no DB writes]\n");

  // Step 1: get match URLs from the profile turbo-frame
  let matchUrls: string[];
  try {
    matchUrls = await getMatchUrls();
  } catch (err) {
    console.error("Failed to get match URLs:", (err as Error).message);
    process.exit(1);
  }

  // Step 2: fetch each match detail page and filter for Finals/Semi-Finals
  console.log("\nFetching match detail pages …");
  const matches: ParsedMatch[] = [];

  for (const slug of matchUrls) {
    const detail = await fetchMatchDetail(slug);
    if (detail) {
      matches.push(detail);
      console.log(`  ✓ ${detail.round.padEnd(12)} ${detail.team1Names[0]} vs ${detail.team2Names[0]}  (${detail.date})`);
    }
  }

  if (matches.length === 0) {
    console.log("\nNo Finals or Semi-Finals found in the recent matches.");
    console.log("Run with --debug to inspect the frame HTML.");
    return;
  }

  console.log(`\nFound ${matches.length} Finals/Semi-Finals matches\n`);

  if (DRY_RUN) {
    console.log("[DRY RUN] Skipping database import.");
    return;
  }

  // Step 3: import to DB
  console.log("Importing to database …\n");
  let imported = 0;
  let skipped  = 0;
  for (const match of matches) {
    try {
      const before = await prisma.game.count();
      await importMatch(match);
      const after = await prisma.game.count();
      if (after > before) imported++; else skipped++;
    } catch (err) {
      console.error(`  ❌ Failed: ${match.round} ${match.matchUrl} — ${(err as Error).message}`);
    }
  }

  const summary = skipped > 0 ? `${imported} new, ${skipped} skipped` : `${imported}`;
  console.log(`\n✅  Done. ${summary}/${matches.length} matches.`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
