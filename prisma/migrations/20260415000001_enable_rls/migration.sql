-- Enable Row Level Security on all public tables exposed via PostgREST.
-- The app accesses Postgres through Prisma's direct connection (postgres role),
-- which is a superuser and bypasses RLS. Enabling RLS here only blocks the
-- Supabase PostgREST API from exposing these tables to anonymous/authenticated
-- requests made with the anon or service_role JWT — it does not affect Prisma.

-- Auth / NextAuth tables
ALTER TABLE "Account"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User"               ENABLE ROW LEVEL SECURITY;

-- Application tables
ALTER TABLE "Club"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Player"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Game"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RatingHistory" ENABLE ROW LEVEL SECURITY;

-- Prisma internal migration table
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- No permissive policies are added, so PostgREST access is denied by default
-- for all roles (anon, authenticated). Access is only possible via the Prisma
-- server-side connection, which runs as a superuser and is unaffected by RLS.
