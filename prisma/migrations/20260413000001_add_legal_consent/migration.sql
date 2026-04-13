-- Add legal consent timestamp fields to User
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt"    TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "dataShareConsentAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "emailConsentAt"     TIMESTAMP(3);
