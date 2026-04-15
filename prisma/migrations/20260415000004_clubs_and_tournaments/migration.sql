-- ── User: role flags ─────────────────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN "isClubAdmin"          BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "isTournamentDirector" BOOLEAN NOT NULL DEFAULT false;

-- ── Club: admin ownership + status ───────────────────────────────────────────
ALTER TABLE "Club" ADD COLUMN "primaryAdminId" TEXT;
ALTER TABLE "Club" ADD COLUMN "backupAdminId"  TEXT;
ALTER TABLE "Club" ADD COLUMN "status"         TEXT NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE "Club"
  ADD CONSTRAINT "Club_primaryAdminId_fkey"
  FOREIGN KEY ("primaryAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Club"
  ADD CONSTRAINT "Club_backupAdminId_fkey"
  FOREIGN KEY ("backupAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Tournament ────────────────────────────────────────────────────────────────
-- status:   DRAFT | REGISTRATION | IN_PROGRESS | COMPLETED | CANCELLED
-- format:   SINGLES | DOUBLES | MIXED | ALL
-- gameType: TOURNEY_REG | TOURNEY_MEDAL | BOTH

CREATE TABLE "Tournament" (
  "id"                   TEXT         NOT NULL,
  "name"                 TEXT         NOT NULL,
  "description"          TEXT,
  "location"             TEXT,
  "city"                 TEXT,
  "state"                TEXT,
  "startDate"            TIMESTAMP(3) NOT NULL,
  "endDate"              TIMESTAMP(3) NOT NULL,
  "registrationOpenAt"   TIMESTAMP(3),
  "registrationCloseAt"  TIMESTAMP(3),
  "status"               TEXT         NOT NULL DEFAULT 'DRAFT',
  "format"               TEXT         NOT NULL DEFAULT 'ALL',
  "gameType"             TEXT         NOT NULL DEFAULT 'TOURNEY_REG',
  "maxParticipants"      INTEGER,
  "createdById"          TEXT         NOT NULL,
  "clubId"               TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Tournament"
  ADD CONSTRAINT "Tournament_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Tournament"
  ADD CONSTRAINT "Tournament_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── TournamentDirector (flexible ownership — composite PK) ───────────────────
CREATE TABLE "TournamentDirector" (
  "tournamentId" TEXT    NOT NULL,
  "userId"       TEXT    NOT NULL,
  "isPrimary"    BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "TournamentDirector_pkey" PRIMARY KEY ("tournamentId", "userId")
);

ALTER TABLE "TournamentDirector"
  ADD CONSTRAINT "TournamentDirector_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TournamentDirector"
  ADD CONSTRAINT "TournamentDirector_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── TournamentRegistration (roster) ──────────────────────────────────────────
-- status: CONFIRMED | WAITLISTED | WITHDRAWN
-- Auto-confirmed on registration; confirmedAt set immediately.

CREATE TABLE "TournamentRegistration" (
  "id"           TEXT         NOT NULL,
  "tournamentId" TEXT         NOT NULL,
  "playerId"     TEXT         NOT NULL,
  "status"       TEXT         NOT NULL DEFAULT 'CONFIRMED',
  "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt"  TIMESTAMP(3)          DEFAULT CURRENT_TIMESTAMP,
  "seed"         INTEGER,
  CONSTRAINT "TournamentRegistration_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TournamentRegistration"
  ADD CONSTRAINT "TournamentRegistration_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TournamentRegistration"
  ADD CONSTRAINT "TournamentRegistration_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "TournamentRegistration_tournamentId_playerId_key"
  ON "TournamentRegistration"("tournamentId", "playerId");

-- ── Game: optional tournament link ────────────────────────────────────────────
ALTER TABLE "Game" ADD COLUMN "tournamentId" TEXT;

ALTER TABLE "Game"
  ADD CONSTRAINT "Game_tournamentId_fkey"
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ── RLS (consistent with all other tables) ────────────────────────────────────
ALTER TABLE "Tournament"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TournamentDirector"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TournamentRegistration" ENABLE ROW LEVEL SECURITY;
