-- Create Club table
CREATE TABLE "Club" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "city"        TEXT,
  "state"       TEXT,
  "description" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Club_name_key" ON "Club"("name");

-- Add clubId FK to Player
ALTER TABLE "Player" ADD COLUMN "clubId" TEXT;

ALTER TABLE "Player"
  ADD CONSTRAINT "Player_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
