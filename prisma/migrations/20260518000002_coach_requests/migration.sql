-- CreateTable
CREATE TABLE "CoachRequest" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "coachUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "CoachRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoachRequest_playerId_coachUserId_key" ON "CoachRequest"("playerId", "coachUserId");

-- AddForeignKey
ALTER TABLE "CoachRequest" ADD CONSTRAINT "CoachRequest_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachRequest" ADD CONSTRAINT "CoachRequest_coachUserId_fkey" FOREIGN KEY ("coachUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
