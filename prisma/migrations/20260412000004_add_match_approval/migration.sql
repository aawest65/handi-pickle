-- Add approval status and submitter tracking to Game
ALTER TABLE "Game"
  ADD COLUMN "status"            TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "submittedByUserId" TEXT;

-- Existing games have already been processed — mark them all as APPROVED
UPDATE "Game" SET "status" = 'APPROVED';
