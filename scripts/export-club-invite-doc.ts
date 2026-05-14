/**
 * Exports the Club Invite / QR Code feature overview to a Word (.docx) document.
 * Run with: npx tsx scripts/export-club-invite-doc.ts
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

function bold(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 22 })],
    spacing: { after: 80 },
  });
}

function inlineRuns(...runs: TextRun[]): Paragraph {
  return new Paragraph({ children: runs, spacing: { after: 100 } });
}

function spacer(): Paragraph {
  return new Paragraph({ text: "", spacing: { after: 80 } });
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

        // ── Title ──────────────────────────────────────────────────────────
        new Paragraph({
          children: [new TextRun({ text: "HandiPick", bold: true, size: 52, color: "0D9488" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Club Invite Link & QR Code", size: 32, color: "334155" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Feature Overview  ·  April 2026", size: 22, color: "94A3B8" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // ── Overview ───────────────────────────────────────────────────────
        heading1("Overview"),
        body(
          "Club managers can now invite prospective players to both HandiPick and their specific club in a single step — " +
          "no email addresses required. Each club gets a unique shareable link and QR code. New players who scan " +
          "or click the link are guided through registration and automatically joined to the club upon completing onboarding."
        ),

        // ── How It Works ───────────────────────────────────────────────────
        heading1("How It Works"),

        heading2("For Club Managers"),
        body("On the club admin page, managers now see an 'Invite Players' panel containing:"),
        bullet("A QR code ready to print on flyers, post at courts, or share on social media"),
        bullet("A copy-link button to paste the URL into WhatsApp, text messages, or email"),
        spacer(),
        body("The invite link format is:"),
        new Paragraph({
          children: [new TextRun({ text: "    https://www.handipickle.com/join/{clubId}", size: 22, font: "Courier New", color: "0D9488" })],
          spacing: { after: 120 },
        }),

        heading2("For New Players (Not Yet Registered)"),
        body("When a prospective player scans the QR code or clicks the link, they are taken to a club landing page showing:"),
        bullet("Club name, location, and description"),
        bullet("Current member count"),
        bullet("Club logo (if one has been set)"),
        spacer(),
        body("They then choose one of two paths:"),
        bullet("Create Account & Join  →  registration flow  →  onboarding with the club pre-selected  →  automatically joined"),
        bullet("Sign In  →  onboarding (if not yet complete) with club pre-selected  →  automatically joined"),

        heading2("For Existing Players (Already Registered & Onboarded)"),
        body(
          "If a signed-in player who has completed onboarding visits a club invite link, they see the club info " +
          "and a single 'Join [Club Name]' button. One tap joins them immediately — no extra steps."
        ),

        heading2("Google Sign-In Flow"),
        body(
          "The club parameter is preserved through the Google OAuth flow. Players who sign up via Google are " +
          "redirected to onboarding with the club already pre-selected, so no extra steps are needed."
        ),

        // ── Flow Diagram ───────────────────────────────────────────────────
        heading1("Player Journey at a Glance"),
        spacer(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["Player Type", "Scans / Clicks Link", "Result"]),
            dataRow(["New player (not registered)", "→  Registration  →  Onboarding", "Joined to club on completion"], false),
            dataRow(["Google sign-up",               "→  Google OAuth  →  Onboarding",  "Joined to club on completion"], true),
            dataRow(["Registered, not onboarded",    "→  Onboarding (club pre-selected)", "Joined to club on completion"], false),
            dataRow(["Fully onboarded player",       "→  One-tap Join button",            "Joined immediately"],           true),
          ],
        }),

        spacer(),
        spacer(),

        // ── Access & Visibility ────────────────────────────────────────────
        heading1("Access & Visibility"),
        body("The Invite Players panel is visible to:"),
        bullet("Site Admins (ADMIN and SUPER_ADMIN roles)"),
        bullet("Club Admins who are assigned as the Primary or Backup Admin of the specific club"),
        spacer(),
        body("The /join/{clubId} landing page is fully public — no account required to view it."),

        // ── Override Feature ───────────────────────────────────────────────
        heading1("Admin Override (Unchanged)"),
        body(
          "The existing admin rating override feature is unaffected. Admins can still manually set any player's " +
          "skill category and starting rating from the admin panel, independent of what the player self-selects during onboarding."
        ),

        // ── Skill Levels ───────────────────────────────────────────────────
        heading1("Updated Skill Levels"),
        body("As part of the same release, skill levels were expanded from 4 to 9 to give players more granular starting options:"),
        spacer(),

        new Table({
          width: { size: 60, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["Level", "Starting Rating"]),
            dataRow(["Beginner",      "2.0"], false),
            dataRow(["Novice",        "2.5"], true),
            dataRow(["Novice Plus",   "3.0"], false),
            dataRow(["Intermediate",  "3.5"], true),
            dataRow(["Advanced",      "4.0"], false),
            dataRow(["Advanced Plus", "4.5"], true),
            dataRow(["Expert",        "5.0"], false),
            dataRow(["Expert Plus",   "5.5"], true),
            dataRow(["Pro",           "6.0"], false),
          ],
        }),

        spacer(),
        spacer(),

        // ── Technical Notes ────────────────────────────────────────────────
        heading1("Technical Notes"),
        bullet("No database migration required — club membership is stored as a single clubId field on the Player record (already existed)"),
        bullet("QR code is generated entirely client-side using the react-qr-code library — no external service or server call"),
        bullet("The invite link works in any environment (dev, staging, production) — the URL is derived from window.location.origin"),
        bullet("Existing players with old skill category labels (NOVICE, INTERMEDIATE, ADVANCED, PRO) are unaffected — their data is unchanged"),

        spacer(),

        // ── Footer ─────────────────────────────────────────────────────────
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
  const outPath = path.join(process.cwd(), "HandiPick_Club_Invite_Feature.docx");
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Exported to ${outPath}`);
});
