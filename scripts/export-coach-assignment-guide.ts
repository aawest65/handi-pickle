/**
 * Exports the Coach Assignment admin guide to a Word document.
 * Run with: npx tsx scripts/export-coach-assignment-guide.ts
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";
import * as fs from "fs";
import * as path from "path";

const TEAL   = "0D9488";
const INDIGO = "4F46E5";
const SLATE  = "334155";
const LIGHT  = "F8FAFC";

function heading1(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL } },
  });
}

function heading2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 80 },
  });
}

function body(text: string, bold = false): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold, size: 22, color: SLATE })],
    spacing: { after: 120 },
  });
}

function numbered(num: number, label: string, detail: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${num}.  `, bold: true, size: 22, color: TEAL }),
      new TextRun({ text: `${label} — `, bold: true, size: 22, color: SLATE }),
      new TextRun({ text: detail, size: 22, color: SLATE }),
    ],
    spacing: { after: 140 },
    indent: { left: convertInchesToTwip(0.25) },
  });
}

function note(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: `ℹ  ${text}`, italics: true, size: 20, color: "64748B" })],
    spacing: { after: 160 },
    indent: { left: convertInchesToTwip(0.25) },
  });
}

function stepBox(step: string, action: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: TEAL },
            children: [
              new Paragraph({
                children: [new TextRun({ text: step, bold: true, color: "FFFFFF", size: 24 })],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
          new TableCell({
            width: { size: 88, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.SOLID, color: LIGHT },
            children: [
              new Paragraph({
                children: [new TextRun({ text: action, size: 22, color: SLATE })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function spacer(): Paragraph {
  return new Paragraph({ text: "", spacing: { after: 120 } });
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22, color: SLATE },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top:    convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left:   convertInchesToTwip(1.25),
            right:  convertInchesToTwip(1.25),
          },
        },
      },
      children: [
        // Title block
        new Paragraph({
          children: [new TextRun({ text: "Handi-Pickle", bold: true, size: 36, color: TEAL })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Coach Assignment — Admin Guide", bold: true, size: 28, color: SLATE })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Last updated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, size: 18, color: "94A3B8" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Overview
        heading1("Overview"),
        body(
          "The Coach Assignment feature lets Super Admins designate users as coaches and link them " +
          "to specific players. Once assigned, a coach can enter skill assessments (Serve, Defense, " +
          "Dinking, etc.) for their player via the Metrics panel on the player's public profile. " +
          "Medal counts (Gold, Silver, Bronze) from tournament medal games are also shown in the same panel."
        ),

        spacer(),

        // Step-by-step
        heading1("Step-by-Step Instructions"),

        heading2("Step 1 — Mark a User as a Coach"),
        body("Navigate to Admin › Dashboard. Locate the user you want to designate as a coach in the user table."),
        body("Under their name, you will see a row of flag toggle buttons:"),
        body("  •  Club Admin", true),
        body("  •  Tournament Director", true),
        body("  •  Coach  ← new", true),
        body(
          "Click + Coach to enable the flag. The button turns green (✓ Coach) to confirm. " +
          "Clicking it again revokes the designation."
        ),
        note("Only Super Admins can toggle the Coach flag. Regular admins cannot see these toggles."),

        spacer(),
        stepBox("TIP", "A user can hold multiple flags simultaneously — e.g. a Club Admin who is also a Coach."),
        spacer(),

        heading2("Step 2 — Assign a Coach to a Player"),
        body(
          "Click Edit under any player's row in the admin table. " +
          "The Edit User modal opens with the player's existing details."
        ),
        body("Scroll to the bottom of the modal to find the Assigned Coach field."),
        body(
          "The dropdown is populated with every user who has the Coach flag enabled. " +
          "Select the appropriate coach and click Save Changes."
        ),
        note("If the dropdown is empty, no users have been marked as coaches yet. Complete Step 1 first."),
        note("To remove a coach from a player, open Edit and select '— None —' from the dropdown, then save."),

        spacer(),
        stepBox("NOTE", "Each player can have one assigned coach at a time. Assigning a new coach replaces the previous one."),
        spacer(),

        heading2("Step 3 — Verify the Assignment"),
        body(
          "After saving, an indigo 'Coach: [Name]' label appears beneath the player's name in the admin table, " +
          "confirming the assignment is active."
        ),

        spacer(),

        // Coach experience
        heading1("What the Coach Sees"),
        body(
          "Once assigned, the coach can navigate to any player's public profile page " +
          "(Players › [Player Name]) and click the Metrics button in the stats row (to the right of W/L)."
        ),
        body("The Metrics panel shows two sections:"),

        new Paragraph({
          children: [
            new TextRun({ text: "Tournament Medals", bold: true, size: 22, color: TEAL }),
            new TextRun({ text: " — Gold, Silver, and Bronze counts auto-derived from approved tournament medal games.", size: 22, color: SLATE }),
          ],
          spacing: { after: 100 },
          indent: { left: convertInchesToTwip(0.25) },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Coach Assessment", bold: true, size: 22, color: INDIGO }),
            new TextRun({ text: " — Skill ratings entered by the assigned coach.", size: 22, color: SLATE }),
          ],
          spacing: { after: 160 },
          indent: { left: convertInchesToTwip(0.25) },
        }),

        body("The coach clicks Edit (or Add Ratings for a new assessment) to enter scores for:"),

        ...[
          ["Serve Rating",    "Overall serve effectiveness"],
          ["Serve Speed",     "Pace and power of the serve"],
          ["Return Skill",    "Consistency and placement of returns"],
          ["Defense",         "Ability to retrieve difficult shots"],
          ["Offense",         "Shot selection and attack quality"],
          ["Lobbing",         "Lob height, depth, and timing"],
          ["Dinking",         "Soft-game consistency and placement"],
          ["Drops",           "Third-shot drop quality"],
          ["Speed-Ups",       "Transition from soft to hard game"],
          ["Unforced Errors", "Lower is better — 1.0 = very few errors, 5.0 = frequent errors"],
        ].map(([skill, desc]) =>
          new Paragraph({
            children: [
              new TextRun({ text: `${skill}: `, bold: true, size: 22, color: SLATE }),
              new TextRun({ text: desc, size: 22, color: SLATE }),
            ],
            spacing: { after: 80 },
            indent: { left: convertInchesToTwip(0.5) },
          })
        ),

        spacer(),
        body("Each skill is scored on a 1.0 – 5.0 scale in 0.5 increments:"),

        new Table({
          width: { size: 70, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true, size: 20 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Meaning", bold: true, size: 20 })] })] }),
              ],
            }),
            ...([
              ["1.0", "Beginner / Needs significant work"],
              ["2.0", "Developing — inconsistent"],
              ["3.0", "Proficient — solid fundamentals"],
              ["4.0", "Advanced — reliable under pressure"],
              ["5.0", "Elite / Pro level"],
            ] as [string, string][]).map(([score, meaning]) =>
              new TableRow({
                children: [
                  new TableCell({
                    shading: { type: ShadingType.SOLID, color: LIGHT },
                    children: [new Paragraph({ children: [new TextRun({ text: score, bold: true, size: 20, color: TEAL })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: meaning, size: 20, color: SLATE })] })],
                  }),
                ],
              })
            ),
          ],
        }),

        spacer(),
        note("Non-coaches (including the player themselves) can view ratings but cannot edit them."),
        note("The 'Last updated' date and coach name are displayed beneath the skill bars after each save."),

        spacer(),

        // Medals
        heading1("How Medal Counts Are Calculated"),
        body(
          "Medal counts are automatically derived from Tournament Medal games in the system " +
          "— no manual entry required. When a tournament director enters a medal-round game, " +
          "they should set the Medal Color field to GOLD, SILVER, or BRONZE. " +
          "The system then counts medals per player as follows:"
        ),
        numbered(1, "Gold",   "Player's team won a game marked GOLD."),
        numbered(2, "Silver", "Player's team lost a game marked GOLD (runner-up)."),
        numbered(3, "Bronze", "Player's team won a game marked BRONZE."),
        note("Only games with status APPROVED and a medalColor set contribute to the count."),

        spacer(),

        // Quick reference
        heading1("Quick Reference"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({ shading: { type: ShadingType.SOLID, color: TEAL }, children: [new Paragraph({ children: [new TextRun({ text: "Task", bold: true, color: "FFFFFF", size: 20 })] })] }),
                new TableCell({ shading: { type: ShadingType.SOLID, color: TEAL }, children: [new Paragraph({ children: [new TextRun({ text: "Who", bold: true, color: "FFFFFF", size: 20 })] })] }),
                new TableCell({ shading: { type: ShadingType.SOLID, color: TEAL }, children: [new Paragraph({ children: [new TextRun({ text: "Where", bold: true, color: "FFFFFF", size: 20 })] })] }),
              ],
            }),
            ...([
              ["Toggle Coach flag on a user",     "Super Admin",        "Admin › Dashboard › user row › Coach toggle"],
              ["Assign coach to a player",         "Super Admin",        "Admin › Dashboard › Edit player › Assigned Coach dropdown"],
              ["Remove coach from a player",       "Super Admin",        "Admin › Dashboard › Edit player › select '— None —'"],
              ["Enter / update skill ratings",     "Assigned Coach",     "Players › [Player] › Metrics button → Edit"],
              ["View metrics and medals",          "Anyone",             "Players › [Player] › Metrics button"],
            ] as [string, string, string][]).map(([task, who, where]) =>
              new TableRow({
                children: [
                  new TableCell({ shading: { type: ShadingType.SOLID, color: LIGHT }, children: [new Paragraph({ children: [new TextRun({ text: task, size: 20, color: SLATE })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: who, size: 20, color: SLATE })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: where, size: 20, color: SLATE })] })] }),
                ],
              })
            ),
          ],
        }),

        spacer(),
        new Paragraph({
          children: [new TextRun({ text: "Handi-Pickle · Internal Admin Documentation", size: 16, color: "94A3B8", italics: true })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
        }),
      ],
    },
  ],
});

const outPath = path.join(process.cwd(), "HandiPick_Coach_Assignment_Guide.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log(`✅  Saved to ${outPath}`);
});
