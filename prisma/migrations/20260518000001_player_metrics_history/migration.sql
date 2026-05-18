-- CreateTable
CREATE TABLE "PlayerMetricsHistory" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "coachId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serveRating" DOUBLE PRECISION,
    "serveSpeed" DOUBLE PRECISION,
    "returnSkill" DOUBLE PRECISION,
    "defense" DOUBLE PRECISION,
    "offense" DOUBLE PRECISION,
    "lobbing" DOUBLE PRECISION,
    "dinking" DOUBLE PRECISION,
    "drops" DOUBLE PRECISION,
    "speedUps" DOUBLE PRECISION,
    "unforcedErrors" DOUBLE PRECISION,

    CONSTRAINT "PlayerMetricsHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayerMetricsHistory_playerId_createdAt_idx" ON "PlayerMetricsHistory"("playerId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "PlayerMetricsHistory" ADD CONSTRAINT "PlayerMetricsHistory_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerMetricsHistory" ADD CONSTRAINT "PlayerMetricsHistory_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
