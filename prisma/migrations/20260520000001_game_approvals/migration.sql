CREATE TABLE "GameApproval" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameApproval_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GameApproval_gameId_playerId_key" ON "GameApproval"("gameId", "playerId");

ALTER TABLE "GameApproval" ADD CONSTRAINT "GameApproval_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameApproval" ADD CONSTRAINT "GameApproval_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
