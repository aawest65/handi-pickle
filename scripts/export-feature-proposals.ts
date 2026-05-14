/**
 * Exports feature proposals (Handicap System + Game Deletion Policy)
 * Run with: npx tsx scripts/export-feature-proposals.ts
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
} from "docx";
import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function heading1(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
  });
}

function body(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    spacing: { after: 120 },
  });
}

function bullet(text: string, level = 0): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    bullet: { level },
    spacing: { after: 80 },
  });
}

function spacer(): Paragraph {
  return new Paragraph({ text: "", spacing: { after: 80 } });
}

function divider(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E2E8F0" } },
    spacing: { before: 200, after: 200 },
  });
}

function headerRow(cells: string[]): TableRow {
  return new TableRow({
    children: cells.map((text) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF" })], alignment: AlignmentType.CENTER })],
        shading: { type: ShadingType.SOLID, color: "0D9488" },
        margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
        borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
      })
    ),
  });
}

function dataRow(cells: string[], shade = false): TableRow {
  return new TableRow({
    children: cells.map((text) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, size: 20 })], alignment: AlignmentType.LEFT })],
        shading: shade ? { type: ShadingType.SOLID, color: "F0FDFA" } : undefined,
        margins: { top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05), left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          left:   { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
          right:  { style: BorderStyle.SINGLE, size: 1, color: "E2E8F0" },
        },
      })
    ),
  });
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
  },
  sections: [
    {
      properties: {
        page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.25), right: convertInchesToTwip(1.25) } },
      },
      children: [

        // ── Title ────────────────────────────────────────────────────────────
        new Paragraph({
          children: [new TextRun({ text: "HandiPick", bold: true, size: 52, color: "0D9488" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Feature Proposals for Co-Creator Review", size: 32, color: "334155" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "April 2026", size: 22, color: "94A3B8" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // ════════════════════════════════════════════════════════════════════
        // SECTION 1 — HANDICAP SYSTEM
        // ════════════════════════════════════════════════════════════════════

        heading1("Proposal 1 — True Handicap Rating System"),

        body(
          "A secondary rating displayed alongside each player's skill rating, modeled on the golf handicap index. " +
          "The closer to zero, the better the player. A near-zero player needs no spots; a player showing 9.0 " +
          "immediately knows they are being spotted 9 points and have meaningful room to grow. " +
          "It gives every player — beginner to pro — an intuitive, universal sense of where they stand."
        ),

        // ── Two Layers ───────────────────────────────────────────────────────
        heading2("Two Layers: Index vs. Par"),

        body(
          "The system operates on two levels — one for the math, one for the player:"
        ),
        bullet(
          "Handicap Index (backend)  —  the precise decimal used for all calculations: " +
          "net differentials, doubles averaging, allowance adjustments. Players never need to think about this number directly."
        ),
        bullet(
          "\"Your Par\" (frontend)  —  the rounded, plain-language number shown on the player's profile. " +
          "A player with an index of 3.9 simply sees: \"Your par: 4\""
        ),
        spacer(),
        body(
          "Just like an 18-handicap golfer mentally adds 18 to a par-72 course and knows they should shoot " +
          "around 90, a \"par 4\" pickleball player knows they should win roughly 4 gross points in a standard " +
          "game against scratch competition. Below par = overperforming. Above par = underperforming. " +
          "No math required from the player. The par number becomes the identity — \"I'm a 4\" is immediately " +
          "meaningful to anyone in the system."
        ),

        // ── Formula ─────────────────────────────────────────────────────────
        heading2("Formula"),

        body(
          "An inverted, non-linear mapping of the skill rating (1.0–8.0) to a handicap index (1.0–11.0):"
        ),
        new Paragraph({
          children: [new TextRun({ text: "    handicap = 1.0 + 10.0 × ((8.0 − rating) / 7.0)^0.75", size: 22, font: "Courier New", color: "0D9488" })],
          spacing: { after: 160 },
        }),
        body(
          "The exponent 0.75 (less than 1) makes the curve non-linear: it drops steeply as a player improves " +
          "from 2.0 → 3.0 → 4.0 (fast early progression, big handicap changes) but flattens from 4.5 → 5.0 → 6.0 " +
          "(the long plateau most players experience). This directly mirrors real pickleball development."
        ),
        spacer(),

        new Table({
          width: { size: 55, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["Skill Rating", "Handicap Index", "\"Your Par\""]),
            dataRow(["1.0  (floor)",      "11.0", "11"], false),
            dataRow(["2.0  (beginner)",   "8.7",  "9"],  true),
            dataRow(["3.0",               "6.6",  "7"],  false),
            dataRow(["4.0",               "4.7",  "5"],  true),
            dataRow(["4.5  (plateau)",    "3.9",  "4"],  false),
            dataRow(["5.0",               "3.1",  "3"],  true),
            dataRow(["6.0",               "1.8",  "2"],  false),
            dataRow(["8.0  (elite)",      "1.0",  "1"],  true),
          ],
        }),

        spacer(),
        spacer(),

        // ── Net Scoring ──────────────────────────────────────────────────────
        heading2("How Net Scoring Works"),

        body("Net differential = Weaker player's handicap − Stronger player's handicap."),
        body("The weaker player starts the game with that many points already on the board."),
        spacer(),
        body(
          "Example: Player A (handicap 1.1) vs Player B (handicap 10.9). " +
          "B starts at 9.8–0. B needs only 2 gross points to win; A needs 11. " +
          "If B wins 2–11 on gross score, B wins 11.8–11 on net — a victory for the underdog."
        ),
        spacer(),
        body("Two built-in constraints protect the integrity of net scoring:"),
        bullet("Minimum differential > 1.0  —  no player can win in a single point; the weaker player always needs at least 2 gross points."),
        bullet("Maximum differential (9.8) stays below the winning score (11)  —  the stronger player is never already losing before the game starts."),

        // ── Singles ─────────────────────────────────────────────────────────
        heading2("Singles Matches"),
        body("Full handicap differential applied. Straightforward — no additional configuration needed."),

        // ── Doubles ─────────────────────────────────────────────────────────
        heading2("Doubles Matches"),
        body(
          "Team handicap = average of the two partners' handicap indexes. " +
          "This is calculated fresh at pairing time and recalculated each round in mixer or rotational formats."
        ),
        spacer(),
        body(
          "Allowance percentage: To address the stacking problem (a 1.0 + 11.0 team averages the same as " +
          "a 5.5 + 6.5 team but plays very differently), tournament directors can apply an allowance — " +
          "typically 85–90% of the full differential — to dampen extreme pairings."
        ),
        spacer(),

        new Table({
          width: { size: 70, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["Format", "Suggested Allowance", "Notes"]),
            dataRow(["Singles",              "100%", "Full differential always"],              false),
            dataRow(["Doubles, fixed pairs", "85–90%", "Recalculated per round"],             true),
            dataRow(["Mixer / rotational",   "85%",  "Partners change each round"],           false),
          ],
        }),

        spacer(),
        spacer(),

        // ── TD Controls ─────────────────────────────────────────────────────
        heading2("Tournament Director / Club Manager Controls"),
        bullet("Toggle handicap scoring on or off per event"),
        bullet("Set allowance percentage (75%, 85%, 100%) per tournament"),
        bullet("Format type (singles, fixed doubles, mixer)"),
        spacer(),

        // ── Open Questions ───────────────────────────────────────────────────
        heading2("Open Questions for Co-Creator Decision"),
        bullet("Should handicap be based on currentRating (dynamic, updates with every game) or the player's initial self-rated category (static)?"),
        bullet("Display handicap index and/or par on player profiles and the leaderboard?"),
        bullet("Track net-score results as a separate stat over time?"),
        bullet("Show players a handicap trend line (dropping index = improving) as a motivational feature?"),

        divider(),

        // ════════════════════════════════════════════════════════════════════
        // SECTION 2 — GAME DELETION POLICY
        // ════════════════════════════════════════════════════════════════════

        heading1("Proposal 2 — Policy for Correcting Wrong Scores"),

        body(
          "Occasionally a game score will be entered incorrectly — wrong players, wrong score, " +
          "or a test entry that needs to be removed. The question is: how does the system handle deletion, " +
          "and what guardrails should exist?"
        ),

        // ── The Problem ──────────────────────────────────────────────────────
        heading2("The Core Problem: Out-of-Order Deletion"),

        body(
          "Deleting a player's most recent game is safe and clean — the system can simply roll the rating " +
          "back to what it was before that game."
        ),
        body(
          "Deleting an older game is fundamentally different. Imagine a player has played 96 games and " +
          "game 82 had a wrong score. Deleting game 82 means games 83–96 were all calculated on top of " +
          "a wrong result. To correct the rating properly, the system would need to replay games 83–96 " +
          "from scratch — recalculating each one as if game 82 never happened. Without replay, " +
          "the player's rating becomes inaccurate even after the delete."
        ),

        // ── Options ─────────────────────────────────────────────────────────
        heading2("Three Approaches — Decision Required"),

        body("The co-creators need to agree on which approach to implement:"),
        spacer(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["Option", "How It Works", "Pros", "Cons"]),
            dataRow(
              [
                "A  —  Block out-of-order deletion",
                "Only allow deleting the most recent game for each player involved. Older games cannot be deleted.",
                "Simple, zero math risk, easy to explain",
                "Wrong scores in older games cannot be corrected without a manual DB fix",
              ],
              false
            ),
            dataRow(
              [
                "B  —  Void instead of delete",
                "Mark game as VOIDED rather than removing it. Rating stays as-is until a replay job is run.",
                "Keeps full audit trail; can batch-replay later",
                "Rating stays wrong until replay runs; adds complexity",
              ],
              true
            ),
            dataRow(
              [
                "C  —  Full replay on delete",
                "Deleting any game triggers automatic replay of all subsequent games for affected players.",
                "Always correct; fully automated",
                "More complex to build; slower for players with many games",
              ],
              false
            ),
          ],
        }),

        spacer(),
        spacer(),

        // ── Recommendation ───────────────────────────────────────────────────
        heading2("Recommendation"),
        body(
          "Start with Option A — block out-of-order deletion. Most wrong scores are caught within minutes " +
          "of entry, so restricting deletion to the most recent game handles the vast majority of real cases. " +
          "If a genuinely older correction is ever needed, a Super Admin can handle it as a one-off. " +
          "Option C can be added later if volume justifies it."
        ),

        // ── Current State ────────────────────────────────────────────────────
        heading2("Current State (as of April 2026)"),
        bullet("Super Admins can delete any game via the admin panel."),
        bullet("The system correctly rolls back PlayerCategoryRating and recomputes weighted averages for the most-recent-game case."),
        bullet("Out-of-order deletion produces a correct game count but an inaccurate rating — the open issue this proposal addresses."),

        spacer(),

        // ── Footer ───────────────────────────────────────────────────────────
        new Paragraph({
          children: [new TextRun({ text: "HandiPick  ·  Internal Documentation  ·  April 2026", size: 18, color: "94A3B8" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
        }),
      ],
    },
  ],
});

// ---------------------------------------------------------------------------
// Write file
// ---------------------------------------------------------------------------

Packer.toBuffer(doc).then((buffer) => {
  const outPath = path.join(process.cwd(), "HandiPick_Feature_Proposals.docx");
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Exported to ${outPath}`);
});
