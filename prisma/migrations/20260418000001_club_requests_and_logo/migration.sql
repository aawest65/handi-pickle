-- ── Club: add logoUrl ─────────────────────────────────────────────────────────
ALTER TABLE "Club" ADD COLUMN "logoUrl" TEXT;

-- ── ClubRequest ───────────────────────────────────────────────────────────────
-- status: PENDING | APPROVED | REJECTED
CREATE TABLE "ClubRequest" (
  "id"            TEXT         NOT NULL,
  "name"          TEXT         NOT NULL,
  "city"          TEXT,
  "state"         TEXT,
  "description"   TEXT,
  "logoUrl"       TEXT,
  "note"          TEXT,
  "status"        TEXT         NOT NULL DEFAULT 'PENDING',
  "requestedById" TEXT         NOT NULL,
  "clubId"        TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt"    TIMESTAMP(3),

  CONSTRAINT "ClubRequest_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ClubRequest"
  ADD CONSTRAINT "ClubRequest_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClubRequest"
  ADD CONSTRAINT "ClubRequest_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
