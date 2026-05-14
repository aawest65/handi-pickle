/**
 * Exports Club Manager & Tournament Director roles/permissions summary
 * Run with: npx tsx scripts/export-roles-permissions.ts
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

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, size: 22 })],
    bullet: { level: 0 },
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
        children: [
          new Paragraph({
            children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF" })],
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { type: ShadingType.SOLID, color: "0D9488" },
        margins: {
          top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05),
          left: convertInchesToTwip(0.1),  right: convertInchesToTwip(0.1),
        },
        borders: {
          top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
        },
      })
    ),
  });
}

function dataRow(cells: string[], shade = false): TableRow {
  return new TableRow({
    children: cells.map((text) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text, size: 20 })],
            alignment: AlignmentType.LEFT,
          }),
        ],
        shading: shade ? { type: ShadingType.SOLID, color: "F0FDFA" } : undefined,
        margins: {
          top: convertInchesToTwip(0.05), bottom: convertInchesToTwip(0.05),
          left: convertInchesToTwip(0.1),  right: convertInchesToTwip(0.1),
        },
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

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1), bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.25), right: convertInchesToTwip(1.25),
          },
        },
      },
      children: [
        // Title
        new Paragraph({
          children: [new TextRun({ text: "HandiPick", bold: true, size: 52, color: "0D9488" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "Roles & Permissions Reference", size: 32, color: "334155" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({ text: "April 2026", size: 22, color: "94A3B8" })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // Overview
        heading1("Overview"),
        body(
          "HandiPick has two elevated non-admin roles that grant specific operational permissions: " +
          "Club Manager (isClubAdmin) and Tournament Director (isTournamentDirector). " +
          "Both are boolean flags on the User record, toggled exclusively by admins — there is no self-service or request flow."
        ),
        spacer(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["Role", "Flag", "Who Can Grant", "Self-Service?"]),
            dataRow(["Club Manager",          "isClubAdmin",           "ADMIN or SUPER_ADMIN", "No"], false),
            dataRow(["Tournament Director",   "isTournamentDirector",  "ADMIN or SUPER_ADMIN", "No"], true),
            dataRow(["Admin",                 "role = ADMIN",          "SUPER_ADMIN only",     "No"], false),
            dataRow(["Super Admin",           "role = SUPER_ADMIN",    "SUPER_ADMIN only",     "No"], true),
          ],
        }),

        spacer(),
        spacer(),

        // Club Manager
        heading1("Club Manager (isClubAdmin)"),

        heading2("How a User Gets This Role"),
        body(
          "An ADMIN or SUPER_ADMIN navigates to the Admin panel → Users tab and toggles the \"Club Admin\" " +
          "switch for the target user. The change takes effect immediately. No approval workflow or email " +
          "notification is sent."
        ),

        heading2("Permissions"),
        bullet("View and approve/deny join requests for a club"),
        bullet("Edit club details (name, description, location, etc.)"),
        bullet("Manage club members (add, remove, update)"),
        bullet("Must be explicitly assigned as manager of a specific club — the flag alone does not grant access to all clubs"),
        spacer(),
        body(
          "Note: When a Club Manager edits a club, the system validates that any users being assigned as " +
          "club admins already hold the isClubAdmin flag. A regular user cannot be assigned as a club admin " +
          "without first being granted the flag by an Admin (SUPER_ADMIN bypass applies)."
        ),

        divider(),

        // Tournament Director
        heading1("Tournament Director (isTournamentDirector)"),

        heading2("How a User Gets This Role"),
        body(
          "Same process — an ADMIN or SUPER_ADMIN toggles the \"Tournament Director\" switch in the Admin panel → Users tab. " +
          "No self-service or request flow exists."
        ),

        heading2("Permissions"),
        bullet("Sees TOURNEY_REG and TOURNEY_MEDAL game types on the Enter Score page"),
        bullet("Can enter tournament match scores"),
        bullet("Gets a \"Tournaments\" navigation link in the app"),
        bullet("Can access and manage tournament admin pages (/admin/tournaments)"),
        bullet("Can create, edit, and manage tournaments"),
        spacer(),

        divider(),

        // System roles
        heading1("System Roles (role field)"),

        body(
          "Separate from the boolean flags above, every user has a role field (USER, ADMIN, SUPER_ADMIN). " +
          "Only a SUPER_ADMIN can promote users to ADMIN or SUPER_ADMIN."
        ),
        spacer(),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            headerRow(["Role", "Key Capabilities"]),
            dataRow(["USER",        "Standard player — enter scores, view leaderboard, manage profile"],         false),
            dataRow(["ADMIN",       "All USER permissions + toggle isClubAdmin and isTournamentDirector flags, view admin panel, manage clubs/players"], true),
            dataRow(["SUPER_ADMIN", "All ADMIN permissions + promote/demote roles, full unrestricted access"],   false),
          ],
        }),

        spacer(),
        spacer(),

        // Footer
        new Paragraph({
          children: [new TextRun({ text: "HandiPick  ·  Internal Documentation  ·  April 2026", size: 18, color: "94A3B8" })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = path.join(process.cwd(), "HandiPick_Roles_Permissions.docx");
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Exported to ${outPath}`);
});
