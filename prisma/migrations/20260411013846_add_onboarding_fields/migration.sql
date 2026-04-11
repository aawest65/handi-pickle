-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "dominantHand" TEXT,
ADD COLUMN     "duprRating" DOUBLE PRECISION,
ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferredFormat" TEXT,
ADD COLUMN     "yearsPlaying" INTEGER;
