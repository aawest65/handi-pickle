/**
 * Exports the Tournament Setup testing guide to a Word (.docx) document.
 * Run with: npx tsx scripts/export-tournament-testing-guide.ts
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

// ── Helpers ──────────────────────────────────────────────────────────────────

const DARK_GREEN  = "1b3a2b";
const MID_GREEN   = "2d5a3f";
const LIGHT_GREEN = "e8f5e9";
const SLATE_BG    = "f1f5f9";
const WHITE       = "FFFFFF";

function h1(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 120 },
    shading: { type: ShadingType.SOLID, color: DARK_GREEN, fill: DARK_GREEN },
    indent: { left: convertInchesToTwip(0.1), right: convertInchesToTwip(0.1) },
    children: [new TextRun({ text, bold: true, color: WHITE, size: 28 })],
  });
}

function h2(text: string): Paragraph {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    shading: { type: ShadingType.SOLID, color: MID_GREEN, fill: MID_GREEN },
    indent: { left: convertInchesToTwip(0.05) },
    children: [new TextRun({ text, bold: true, color: WHITE, size: 24 })],
  });
}

function h3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 60 },
    children: [new TextRun({ text, bold: true, color: DARK_GREEN, size: 22 })],
  });
}

function body(text: string, options?: { bold?: boolean; italic?: boolean }): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, bold: options?.bold, italics: options?.italic, size: 20 })],
  });
}

function bullet(text: string, level = 0): Paragraph {
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60 },
    indent: { left: convertInchesToTwip(0.25 * (level + 1)) },
    children: [new TextRun({ text, size: 20 })],
  });
}

function checkBullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: convertInchesToTwip(0.25) },
    children: [
      new TextRun({ text: "✅ ", size: 20 }),
      new TextRun({ text, size: 20 }),
    ],
  });
}

function step(num: number, text: string): Paragraph {
  return new Paragraph({
    numbering: { reference: "steps", level: 0 },
    spacing: { after: 60 },
    indent: { left: convertInchesToTwip(0.25) },
    children: [new TextRun({ text, size: 20 })],
  });
}

function numbered(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: convertInchesToTwip(0.25) },
    children: [new TextRun({ text, size: 20 })],
  });
}

function note(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 60, after: 100 },
    shading: { type: ShadingType.SOLID, color: SLATE_BG, fill: SLATE_BG },
    indent: { left: convertInchesToTwip(0.15), right: convertInchesToTwip(0.15) },
    children: [new TextRun({ text: `ℹ  ${text}`, italics: true, color: "475569", size: 18 })],
  });
}

function spacer(): Paragraph {
  return new Paragraph({ spacing: { after: 80 } });
}

function headerRow(cells: string[]): TableRow {
  return new TableRow({
    tableHeader: true,
    children: cells.map(text =>
      new TableCell({
        shading: { type: ShadingType.SOLID, color: DARK_GREEN, fill: DARK_GREEN },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({ text, bold: true, color: WHITE, size: 18 })],
        })],
      })
    ),
  });
}

function dataRow(cells: string[], shade = false): TableRow {
  return new TableRow({
    children: cells.map(text =>
      new TableCell({
        shading: shade ? { type: ShadingType.SOLID, color: LIGHT_GREEN, fill: LIGHT_GREEN } : undefined,
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        borders: {
          top:    { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
          left:   { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
          right:  { style: BorderStyle.SINGLE, size: 1, color: "cbd5e1" },
        },
        children: [new Paragraph({ children: [new TextRun({ text, size: 18 })] })],
      })
    ),
  });
}

function twoColTable(rows: [string, string][], widths: [number, number] = [40, 60]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(([a, b], i) => dataRow([a, b], i % 2 === 0)),
  });
}

function checklistTable(items: { num: string; test: string; pass: string; notes: string }[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      headerRow(["#", "Test", "Pass", "Notes"]),
      ...items.map(({ num, test, pass, notes }, i) => dataRow([num, test, pass, notes], i % 2 === 0)),
    ],
  });
}

// ── Document ──────────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "steps",
        levels: [{
          level: 0,
          format: "decimal",
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: convertInchesToTwip(0.4), hanging: convertInchesToTwip(0.2) } } },
        }],
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top:    convertInchesToTwip(1),
          bottom: convertInchesToTwip(1),
          left:   convertInchesToTwip(1.1),
          right:  convertInchesToTwip(1.1),
        },
      },
    },
    children: [

      // ── Cover ──────────────────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 100 },
        shading: { type: ShadingType.SOLID, color: DARK_GREEN, fill: DARK_GREEN },
        children: [new TextRun({ text: "HandiPick", bold: true, color: WHITE, size: 52 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        shading: { type: ShadingType.SOLID, color: MID_GREEN, fill: MID_GREEN },
        children: [new TextRun({ text: "Tournament Setup — Tester's Guide", bold: true, color: WHITE, size: 30 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        shading: { type: ShadingType.SOLID, color: MID_GREEN, fill: MID_GREEN },
        children: [new TextRun({ text: "Date: April 15, 2026  |  Environment: Production or localhost:3001", color: "a7f3d0", size: 20 })],
      }),

      spacer(),

      // ── Prerequisites ──────────────────────────────────────────────────
      h1("Prerequisites"),
      body("You will need two test accounts:"),
      spacer(),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          headerRow(["Account", "Role", "Purpose"]),
          dataRow(["Account A", "SUPER_ADMIN", "Creates tournaments, manages all"], false),
          dataRow(["Account B", "USER with isTournamentDirector=true", "Will be assigned as a director"], true),
        ],
      }),
      spacer(),
      note("Grant the Tournament Director flag to Account B via /admin before starting Part 2."),
      spacer(),

      // ── Part 1 ─────────────────────────────────────────────────────────
      h1("Part 1 — Tournament Director Role Granting"),
      body("Path: /admin  (Admin Dashboard)"),
      spacer(),

      h3("1.1 — Grant Tournament Director role"),
      numbered("1. Sign in as Account A (SUPER_ADMIN)"),
      numbered("2. Navigate to /admin"),
      numbered("3. Find Account B in the user list"),
      numbered("4. Below the Edit / Delete links you should see two toggle badges:"),
      bullet("+ Club Admin"),
      bullet("+ Tournament Director"),
      numbered("5. Click + Tournament Director on Account B"),
      checkBullet("Badge immediately turns green and shows ✓ Tournament Director"),
      numbered("6. Refresh the page"),
      checkBullet("Badge is still green (persisted to database)"),
      spacer(),

      h3("1.2 — Revoke the role"),
      numbered("1. Hover over the green ✓ Tournament Director badge — it should turn red"),
      numbered("2. Click to revoke"),
      checkBullet("Badge returns to inactive state (+ Tournament Director, slate color)"),
      numbered("3. Re-grant the role before continuing"),
      spacer(),

      h3("1.3 — Self-protection"),
      numbered("1. Find Account A (your own account) in the list"),
      checkBullet("No role toggle badges appear on your own row"),
      spacer(),

      // ── Part 2 ─────────────────────────────────────────────────────────
      h1("Part 2 — Tournament List  (/admin/tournaments)"),
      spacer(),

      h3("2.1 — Stats row"),
      numbered("1. Sign in as Account A, navigate to /admin/tournaments"),
      checkBullet("Three stats cards at the top: Total, Active, Players Registered"),
      spacer(),

      h3("2.2 — Create a tournament (SUPER_ADMIN)"),
      numbered("1. Click + New Tournament"),
      numbered("2. Fill in:"),
      bullet("Name: Spring Open 2026  (required)"),
      bullet("Start Date: any future date"),
      bullet("End Date: same day or later"),
      bullet("Format: All Formats"),
      bullet("Game Type: Regular"),
      bullet("City: Austin, State: TX"),
      bullet("Venue: Riverside Courts"),
      bullet("Max Participants: 16"),
      numbered("3. Click Create Tournament"),
      checkBullet("Modal closes, new tournament card appears in the list"),
      checkBullet("Status badge shows Draft"),
      checkBullet("Player count shows 0"),
      spacer(),

      h3("2.3 — Tournament card details"),
      body("Each card should display:"),
      bullet("Tournament name + status badge"),
      bullet("Date range and city/state"),
      bullet("Format, game type, and player count"),
      bullet("Primary director name"),
      bullet("Manage button"),
      spacer(),

      h3("2.4 — Create as Tournament Director"),
      numbered("1. Sign in as Account B (Tournament Director)"),
      numbered("2. Navigate to /admin/tournaments"),
      checkBullet("+ New Tournament button is visible"),
      numbered("3. Create a second tournament"),
      checkBullet("Tournament appears in list"),
      checkBullet("Account B is automatically listed as the primary director"),
      spacer(),

      h3("2.5 — Access control"),
      numbered("1. Sign in as a regular USER (no Tournament Director role)"),
      numbered("2. Navigate to /admin/tournaments"),
      checkBullet("Page returns 403 or redirects to login"),
      spacer(),

      // ── Part 3 ─────────────────────────────────────────────────────────
      h1("Part 3 — Tournament Detail  (/admin/tournaments/{id})"),
      body("Click Manage on the Spring Open 2026 tournament created in Part 2.2."),
      spacer(),

      h3("3.1 — Edit tournament info"),
      numbered("1. Change the name to Austin Spring Open 2026"),
      numbered("2. Change status from Draft to Registration"),
      numbered("3. Add a description"),
      numbered("4. Click Save Info"),
      checkBullet("Green ✓ Saved appears briefly"),
      numbered("5. Refresh the page"),
      checkBullet("All changes persisted"),
      numbered("6. Clear the name field and click Save Info"),
      checkBullet("Error: Tournament name cannot be empty"),
      numbered("7. Set end date before start date and click Save Info"),
      checkBullet("Error: End date must be on or after start date"),
      spacer(),

      h3("3.2 — Status progression"),
      body("Change the status through each state and verify saves correctly:"),
      bullet("Draft → Registration → In Progress → Completed"),
      checkBullet("Status badge on the detail page and list page both update"),
      spacer(),

      h3("3.3 — Directors panel  (ADMIN+ only)"),
      note("This section only appears for ADMIN and SUPER_ADMIN users."),
      spacer(),
      numbered("1. In the Tournament Directors section, open the Add dropdown"),
      checkBullet("Only users with the Tournament Director flag appear"),
      numbered("2. Select Account B and click Add"),
      checkBullet("Account B appears in the directors list as a non-primary director"),
      numbered("3. Click Make Primary next to Account B"),
      checkBullet("Account B is now marked Primary; the previous primary is demoted"),
      numbered("4. Try to Remove the only primary director"),
      checkBullet("Error: Cannot remove the only primary director"),
      numbered("5. Add Account B back if needed, then Remove a non-primary director"),
      checkBullet("Director is removed from the list"),
      spacer(),

      h3("3.4 — Tournament Director cannot see Directors panel"),
      numbered("1. Sign in as Account B (Tournament Director, assigned to this tournament)"),
      numbered("2. Navigate to the tournament detail page"),
      checkBullet("Directors panel does NOT appear"),
      checkBullet("Tournament info form IS visible and editable"),
      spacer(),

      h3("3.5 — Access denied for unassigned director"),
      numbered("1. Sign in as a Tournament Director not assigned to this tournament"),
      numbered("2. Navigate directly to /admin/tournaments/{id}"),
      checkBullet("Returns 403 / Tournament not found or access denied"),
      spacer(),

      // ── Part 4 ─────────────────────────────────────────────────────────
      h1("Part 4 — Roster Management"),
      spacer(),

      h3("4.1 — Add a player"),
      numbered("1. On the tournament detail page, type at least 2 characters in the Search players field"),
      checkBullet("Dropdown appears with matching player results"),
      checkBullet("Each result shows name, player ID, rating, and gender"),
      numbered("2. Click a player name to add them"),
      checkBullet("Player disappears from search results and appears in the roster table"),
      checkBullet("Roster count in header increments"),
      numbered("3. Search for the same player again"),
      checkBullet("They no longer appear in search results (already registered)"),
      spacer(),

      h3("4.2 — Add multiple players"),
      numbered("1. Add at least 3 more players"),
      checkBullet("All players appear in the roster table with name, player ID, rating, seed column"),
      numbered("2. Verify player links go to /players/{id}"),
      spacer(),

      h3("4.3 — Max participants enforcement"),
      numbered("1. Set Max Participants to the current roster count and save"),
      numbered("2. Try to add another player via the API: POST /api/admin/tournaments/{id}/registrations"),
      checkBullet("API returns 409 with error: Tournament is full"),
      spacer(),

      h3("4.4 — Remove a player"),
      numbered("1. Click Remove on a player in the roster"),
      checkBullet("Confirmation modal appears: [Name] will be removed from [Tournament]. Their player profile and rating history are unaffected."),
      numbered("2. Click Cancel"),
      checkBullet("Modal closes, player still in roster"),
      numbered("3. Click Remove again, then confirm"),
      checkBullet("Player removed from roster"),
      checkBullet("Player's profile still exists and is accessible at /players/{id}"),
      spacer(),

      h3("4.5 — Duplicate registration rejected"),
      numbered("1. Attempt to POST the same playerId twice to /api/admin/tournaments/{id}/registrations"),
      checkBullet("Second request returns 409: Player is already registered"),
      spacer(),

      // ── Part 5 ─────────────────────────────────────────────────────────
      h1("Part 5 — Delete Tournament"),
      spacer(),

      h3("5.1 — Primary director can delete a Draft"),
      numbered("1. Sign in as Account B (primary director of a Draft tournament)"),
      numbered("2. Make a request: DELETE /api/admin/tournaments/{id}"),
      checkBullet("Tournament is deleted (200 OK)"),
      spacer(),

      h3("5.2 — Cannot delete a non-Draft tournament"),
      numbered("1. Create a new tournament and advance status to Registration"),
      numbered("2. As Account B (primary director), attempt DELETE"),
      checkBullet("Returns 403: Only the primary director can delete a draft tournament"),
      spacer(),

      h3("5.3 — SUPER_ADMIN can delete any status"),
      numbered("1. Sign in as Account A (SUPER_ADMIN)"),
      numbered("2. DELETE the Registration-status tournament"),
      checkBullet("Tournament is deleted successfully"),
      spacer(),

      // ── Quick Checklist ────────────────────────────────────────────────
      h1("Quick Checklist"),
      spacer(),
      checklistTable([
        { num: "1.1", test: "Grant Tournament Director role",            pass: "☐", notes: "" },
        { num: "1.2", test: "Revoke Tournament Director role",           pass: "☐", notes: "" },
        { num: "1.3", test: "Self-protection (can't modify self)",       pass: "☐", notes: "" },
        { num: "2.1", test: "Stats row visible",                         pass: "☐", notes: "" },
        { num: "2.2", test: "Create tournament (SUPER_ADMIN)",           pass: "☐", notes: "" },
        { num: "2.3", test: "Tournament card shows correct details",     pass: "☐", notes: "" },
        { num: "2.4", test: "Tournament Director can create tournament", pass: "☐", notes: "" },
        { num: "2.5", test: "Regular user cannot access /admin/tournaments", pass: "☐", notes: "" },
        { num: "3.1", test: "Edit info persists + validation errors",    pass: "☐", notes: "" },
        { num: "3.2", test: "Status progression saves correctly",        pass: "☐", notes: "" },
        { num: "3.3", test: "Add / promote / remove directors",          pass: "☐", notes: "" },
        { num: "3.4", test: "TD cannot see Directors panel",             pass: "☐", notes: "" },
        { num: "3.5", test: "Unassigned TD gets 403",                    pass: "☐", notes: "" },
        { num: "4.1", test: "Player search add (debounced dropdown)",    pass: "☐", notes: "" },
        { num: "4.2", test: "Multiple players in roster",                pass: "☐", notes: "" },
        { num: "4.3", test: "Max participants enforced via API",         pass: "☐", notes: "" },
        { num: "4.4", test: "Remove player with confirmation",           pass: "☐", notes: "" },
        { num: "4.5", test: "Duplicate registration rejected (409)",     pass: "☐", notes: "" },
        { num: "5.1", test: "Primary director deletes Draft tournament", pass: "☐", notes: "" },
        { num: "5.2", test: "Director cannot delete non-Draft",          pass: "☐", notes: "" },
        { num: "5.3", test: "SUPER_ADMIN deletes any status",            pass: "☐", notes: "" },
      ]),
      spacer(),

      // ── Expected Failures ──────────────────────────────────────────────
      h1("Expected Failures  (should be rejected)"),
      spacer(),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          headerRow(["Action", "Expected Result"]),
          dataRow(["Non-admin visits /admin/tournaments", "403 Forbidden or redirect to login"], false),
          dataRow(["Unassigned Tournament Director visits tournament detail", "403 Forbidden"], true),
          dataRow(["ADMIN tries to add non-TD user as director via API", "400: User must have Tournament Director role"], false),
          dataRow(["POST registration to a full tournament", "409: Tournament is full"], true),
          dataRow(["POST same player twice to registrations", "409: Player is already registered"], false),
          dataRow(["Tournament Director deletes a non-Draft tournament", "403 Forbidden"], true),
          dataRow(["Remove the only primary director", "400: Cannot remove the only primary director"], false),
          dataRow(["Save tournament with empty name", "400: Tournament name cannot be empty"], true),
          dataRow(["End date before start date", "400: End date must be on or after start date"], false),
        ],
      }),
      spacer(),

      // ── Bugs / Notes ───────────────────────────────────────────────────
      h1("Bugs / Notes"),
      body("Use this section to capture anything unexpected:"),
      spacer(),
      bullet(""),
      bullet(""),
      bullet(""),
      spacer(),

      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 400 },
        children: [new TextRun({ text: "Guide prepared by: Allen W. / HandiPick dev team", italics: true, color: "94a3b8", size: 18 })],
      }),
    ],
  }],
});

// ── Write file ────────────────────────────────────────────────────────────────

const outPath = path.join(process.cwd(), "HandiPick_Tournament_Testing_Guide.docx");
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outPath, buffer);
  console.log(`✅  Saved: ${outPath}`);
});
