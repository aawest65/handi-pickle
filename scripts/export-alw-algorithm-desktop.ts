/**
 * Exports the ALW rating algorithm explanation to a Word (.docx) document.
 * Run with: npx tsx scripts/export-alw-algorithm-doc.ts
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
  UnderlineType,
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
    spacing: { before: 300, after: 120 },
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
  });
}

function heading3(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
  });
}

function para(runs: TextRun[], spacing = { before: 60, after: 80 }): Paragraph {
  return new Paragraph({ children: runs, spacing });
}

function bullet(runs: TextRun[], level = 0): Paragraph {
  return new Paragraph({
    children: runs,
    bullet: { level },
    spacing: { before: 40, after: 40 },
  });
}

function code(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: "Courier New",
        size: 18,
        color: "1F3864",
      }),
    ],
    shading: { type: ShadingType.CLEAR, fill: "E9EFF7" },
    spacing: { before: 80, after: 80 },
    indent: { left: convertInchesToTwip(0.3) },
  });
}

function bold(text: string): TextRun {
  return new TextRun({ text, bold: true });
}

function plain(text: string): TextRun {
  return new TextRun({ text });
}

function italicText(text: string): TextRun {
  return new TextRun({ text, italics: true });
}

function headerCell(text: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 18 })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { type: ShadingType.CLEAR, fill: "1F3864" },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
  });
}

function dataCell(text: string, shade = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 18 })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: shade ? { type: ShadingType.CLEAR, fill: "EBF0FA" } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

// ---------------------------------------------------------------------------
// Document content
// ---------------------------------------------------------------------------

function buildDocument(): Document {
  return new Document({
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1.25),
            },
          },
        },
        children: [
          // ── Title ─────────────────────────────────────────────────────────
          new Paragraph({
            children: [
              new TextRun({
                text: "Anna Leigh Waters — Rating Algorithm Analysis",
                bold: true,
                size: 36,
                color: "1F3864",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "PickleRatings System · 2026 PPA Tour Finals Data",
                size: 20,
                italics: true,
                color: "7F7F7F",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 400 },
          }),

          // ── Formula Overview ──────────────────────────────────────────────
          heading1("Formula Overview"),
          para([plain("Every game updates a player's rating using five components, all multiplied by a global scale factor of 4:")]),
          code("newRating = currentRating + (tableA + tableC + SDR + gender + age) × RATING_SCALE(4)"),
          para([
            plain("Each component is described in detail below. All 49 of ALW's 2026 PPA finals games were classified as "),
            bold("TOURNAMENT / isMedalRound = true"),
            plain(", which activates the highest-weight table values throughout."),
          ]),

          // ── Component 1: Table A ──────────────────────────────────────────
          heading2("1. Table A — Base Win/Loss Impact"),
          para([
            plain("Despite the match being a tournament medal round, "),
            bold("Table A is hardcoded to use RECREATIONAL values"),
            plain(" for the stored website rating (see algorithm.ts line 107):"),
          ]),
          code("tableAFactor = won ? TABLE_A.RECREATIONAL.win : TABLE_A.RECREATIONAL.loss"),
          code("tableAImpact = tableAFactor × weighting"),
          para([plain("Values applied:")]),
          bullet([bold("Win: "), plain("+0.02 × weighting")]),
          bullet([bold("Loss: "), plain("−0.02 × weighting")]),
          para([
            italicText("Design note: "),
            plain("The algorithm intentionally normalises all play types to Recreational values for the public-facing rating. Tournament multipliers are factored in through Tables C and E instead."),
          ]),

          // ── Component 2: Weighting ────────────────────────────────────────
          heading2("2. Weighting — The Rating-Relative Multiplier"),
          para([
            plain("Weighting is the "),
            bold("single most influential variable"),
            plain(" and behaves differently for wins and losses:"),
          ]),
          code("Win weighting  = oppAvgRate / playerRate"),
          code("Loss weighting = lowestRateInGame / playerRate"),
          para([plain("How this affects ALW specifically:")]),
          bullet([
            plain("At game 1 all players start at 3.0, so weighting = "),
            bold("1.0 (maximum)"),
            plain(". Every component is at full strength."),
          ]),
          bullet([
            plain("As ALW's rating rises (e.g. to 5.0) while opponents remain near 3.0, win weighting shrinks to "),
            bold("~0.60"),
            plain(", naturally self-limiting her gains."),
          ]),
          bullet([
            bold("Loss weighting uses the lowest-rated player in the game"),
            plain(" divided by ALW's rate. Since ALW is typically the highest-rated player, this denominator is large — making her losses "),
            bold("very cheap"),
            plain(" compared to her wins."),
          ]),
          para([plain("This asymmetry creates a strong upward bias for dominant players.")]),

          // ── Component 3: Table C ──────────────────────────────────────────
          heading2("3. Table C — Win Bonus by Play Type"),
          para([plain("A flat bonus applied on wins only (no weighting applied):")]),
          code("tableCImpact = won ? TABLE_C[TOURNAMENT_MEDAL] : 0"),
          code("TOURNAMENT_MEDAL value = +0.01 per win"),
          para([
            plain("Since all 49 games are medal round, every win earns this bonus. Over ~40 total wins across all three formats this contributes a meaningful "),
            bold("+0.04 cumulative"),
            plain(" to each category's total rating (before the ×4 scale)."),
          ]),

          // ── Component 4: SDR ──────────────────────────────────────────────
          heading2("4. Score Differential (SDR) — The Biggest Differentiator Between Categories"),
          code("sdr       = (myScore − opponentScore) / 11"),
          code("sdrImpact = sdr × weighting × TABLE_E[TOURNAMENT_MEDAL]"),
          code("TABLE_E[TOURNAMENT_MEDAL] = 0.0125"),
          para([plain("Example calculations at full weighting (1.0):")]),

          // SDR table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  headerCell("Score"),
                  headerCell("SDR"),
                  headerCell("SDR Impact (weighting=1.0)"),
                  headerCell("Notes"),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("11–0", true),
                  dataCell("1.000", true),
                  dataCell("+0.01250", true),
                  dataCell("Maximum possible", true),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("11–1"),
                  dataCell("0.909"),
                  dataCell("+0.01136"),
                  dataCell("ALW typical singles score"),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("11–4", true),
                  dataCell("0.636", true),
                  dataCell("+0.00795", true),
                  dataCell("ALW typical doubles score", true),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("11–9"),
                  dataCell("0.182"),
                  dataCell("+0.00227"),
                  dataCell("Tight game"),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("7–11", true),
                  dataCell("−0.364", true),
                  dataCell("−0.00455 × loss_weighting", true),
                  dataCell("Loss (smaller due to weighting)", true),
                ],
              }),
            ],
          }),
          para([
            plain("ALW's "),
            bold("Women's Singles"),
            plain(" scores are extreme blowouts (11-1, 11-2, 11-1, 11-2, 11-1, 11-6) — she consistently operates near the top of this range. Her "),
            bold("Mixed Doubles"),
            plain(" games are closer and she drops 8 individual games, meaning her Mixed SDR average is substantially lower."),
          ]),

          // ── Component 5: Gender ───────────────────────────────────────────
          heading2("5. Gender Factor — Table B (Constant for ALW)"),
          code("genderImpact = won ? TABLE_B_BASE(0.01) × TABLE_B[formatCat][formatCat] : 0"),
          para([
            plain("Because the algorithm compares "),
            bold("formatCat vs. formatCat"),
            plain(" (a player always plays within their own bracket), the factor is always 1.0 for ALW:"),
          ]),
          bullet([plain("Women's Singles / Doubles → TABLE_B[\"WOMEN\"][\"WOMEN\"] = "), bold("1.0")]),
          bullet([plain("Mixed Doubles → TABLE_B[\"MIXED\"][\"MIXED\"] = "), bold("1.0")]),
          para([
            plain("This gives a flat "),
            bold("+0.01 on every win"),
            plain(" regardless of format. Table B is "),
            italicText("not a differentiator"),
            plain(" between ALW's categories — it contributes equally to all three."),
          ]),

          // ── Component 6: Age ─────────────────────────────────────────────
          heading2("6. Age Factor — Table F (Minor, Mostly Constant)"),
          para([
            plain("ALW is 22 → age bracket "),
            bold("\"17-29\""),
            plain(". Her opponents:"),
          ]),
          bullet([plain("Kate Fahey (25), Lea Jansen (26), Jade Kawamoto (26), Anna Bright (28), Hayden Patriquin (24) → all \"17-29\"")]),
          bullet([plain("TABLE_F[\"17-29\"][\"17-29\"] = { win: +0.01, loss: −0.01 }")]),
          bullet([plain("Jackie Kawamoto (32), Tina Pisnik (38) → \"30-49\"")]),
          bullet([plain("TABLE_F[\"17-29\"][\"30-49\"] = { win: +0.005, loss: −0.015 } (slightly smaller win bonus)")]),
          bullet([plain("Eric Oncins (57) → \"50-65\"")]),
          bullet([plain("TABLE_F[\"17-29\"][\"50-65\"] = { win: +0.0025, loss: −0.0175 }")]),
          para([
            plain("Age is a "),
            bold("minor, mostly constant"),
            plain(" driver for ALW. She earns +0.01 per win against most opponents, dropping slightly to +0.005 or +0.0025 against older players. The mixed doubles series against Pisnik/Oncins (Newport Beach) gave her a slightly lower age bonus than other events."),
          ]),

          // ── Per-game example calculation ──────────────────────────────────
          heading1("Worked Example: ALW wins 11-1 in Women's Singles (Game 1, Masters)"),
          para([plain("At game 1, all ratings = 3.0, so weighting = 3.0 / 3.0 = 1.0")]),

          new Table({
            width: { size: 80, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [headerCell("Component"), headerCell("Calculation"), headerCell("Value")],
              }),
              new TableRow({
                children: [dataCell("Table A", true), dataCell("0.02 × 1.0", true), dataCell("+0.02000", true)],
              }),
              new TableRow({
                children: [dataCell("Table C"), dataCell("0.01 (flat)"), dataCell("+0.01000")],
              }),
              new TableRow({
                children: [dataCell("SDR", true), dataCell("(10/11) × 1.0 × 0.0125", true), dataCell("+0.01136", true)],
              }),
              new TableRow({
                children: [dataCell("Gender"), dataCell("0.01 × 1.0"), dataCell("+0.01000")],
              }),
              new TableRow({
                children: [dataCell("Age", true), dataCell("TABLE_F[17-29][17-29].win", true), dataCell("+0.01000", true)],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Sum × RATING_SCALE", bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
                    shading: { type: ShadingType.CLEAR, fill: "1F3864" },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "0.06136 × 4", bold: true, size: 18 })], alignment: AlignmentType.CENTER })],
                    shading: { type: ShadingType.CLEAR, fill: "1F3864" },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "+0.2454", bold: true, color: "FFFFFF", size: 18 })], alignment: AlignmentType.CENTER })],
                    shading: { type: ShadingType.CLEAR, fill: "1F3864" },
                    margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  }),
                ],
              }),
            ],
          }),
          para([
            plain("Result: rating moves from "),
            bold("3.0000 → 3.2454"),
            plain(" after a single 11-1 finals win."),
          ]),

          // ── Category comparison ───────────────────────────────────────────
          heading1("Why Each Category Has a Different Rating"),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  headerCell("Category"),
                  headerCell("Games"),
                  headerCell("ALW Wins"),
                  headerCell("ALW Losses"),
                  headerCell("Typical Win Score"),
                  headerCell("Key Driver"),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Women's Singles", true),
                  dataCell("10", true),
                  dataCell("10", true),
                  dataCell("0", true),
                  dataCell("11-1, 11-2", true),
                  dataCell("Perfect record + blowout SDRs", true),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Women's Doubles"),
                  dataCell("19"),
                  dataCell("18"),
                  dataCell("1"),
                  dataCell("11-3, 11-5"),
                  dataCell("Near-perfect, moderate margins"),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Mixed Doubles", true),
                  dataCell("20", true),
                  dataCell("12", true),
                  dataCell("8", true),
                  dataCell("Varies widely", true),
                  dataCell("8 losses (Bright/Patriquin series)", true),
                ],
              }),
            ],
          }),

          para([
            bold("Women's Singles"),
            plain(" is ALW's highest rating: zero losses, consistently brutal margins, and every game hitting near-maximum SDR."),
          ]),
          para([
            bold("Women's Doubles"),
            plain(" is slightly lower: one dropped game at Lakeville (6-11) plus win margins are modestly tighter than singles."),
          ]),
          para([
            bold("Mixed Doubles"),
            plain(" is her lowest: she dropped 8 individual games — three against Bright/Patriquin at the Masters, two at Cape Coral, and a sweep in the Mesa Cup — each one hitting her with negative Table A, negative SDR, and a −0.01 age penalty."),
          ]),

          // ── Summary ──────────────────────────────────────────────────────
          heading1("Summary of Driver Importance"),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  headerCell("Driver"),
                  headerCell("Magnitude per game"),
                  headerCell("ALW-specific impact"),
                  headerCell("Differentiates categories?"),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("SDR (score margin)", true),
                  dataCell("0.002–0.0125 pre-scale", true),
                  dataCell("Very high — blowout scores dominate", true),
                  dataCell("YES — primary differentiator", true),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Win/loss record"),
                  dataCell("Table A + C + gender + age"),
                  dataCell("Near-perfect record maximises upward bias"),
                  dataCell("YES — Mixed has 8 losses"),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Weighting asymmetry", true),
                  dataCell("Multiplies all components", true),
                  dataCell("Loss penalty is tiny vs win reward", true),
                  dataCell("Amplifies across all categories", true),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Table C (win bonus)"),
                  dataCell("+0.01 per win (flat)"),
                  dataCell("Consistent across all 3 formats"),
                  dataCell("NO — constant"),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Gender (Table B)", true),
                  dataCell("+0.01 per win (flat)", true),
                  dataCell("Always 1.0 factor — no cross-bracket play", true),
                  dataCell("NO — constant", true),
                ],
              }),
              new TableRow({
                children: [
                  dataCell("Age (Table F)"),
                  dataCell("+0.01 to +0.0025 per win"),
                  dataCell("Minor — mostly same-age opponents"),
                  dataCell("Negligible"),
                ],
              }),
            ],
          }),

          // Footer note
          new Paragraph({
            children: [
              new TextRun({
                text: "Generated from PickleRatings · lib/rating/algorithm.ts · 2026 PPA Tour Finals (6 events, 49 games)",
                size: 16,
                italics: true,
                color: "7F7F7F",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 600, after: 0 },
          }),
        ],
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Write file
// ---------------------------------------------------------------------------

async function main() {
  const doc = buildDocument();
  const buffer = await Packer.toBuffer(doc);
  const outPath = path.resolve(
    "C:/Users/AllenWestermann/Desktop",
    "ALW_Rating_Algorithm_Analysis.docx"
  );
  fs.writeFileSync(outPath, buffer);
  console.log(`✅  Saved: ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
