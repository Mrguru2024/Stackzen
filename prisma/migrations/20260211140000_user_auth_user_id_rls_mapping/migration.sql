-- Map Supabase Auth (auth.uid) to Prisma User.id for Row Level Security.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "authUserId" UUID;

CREATE UNIQUE INDEX IF NOT EXISTS "User_authUserId_key" ON "User"("authUserId");

CREATE OR REPLACE FUNCTION public.prisma_user_id_for_auth()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id::text
  FROM "User" u
  WHERE u."authUserId" IS NOT NULL
    AND u."authUserId" = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.prisma_user_id_for_auth() FROM PUBLIC;
DO $rls_grants$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.prisma_user_id_for_auth() TO anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.prisma_user_id_for_auth() TO authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.prisma_user_id_for_auth() TO service_role';
  END IF;
END
$rls_grants$;

-- Transaction
DROP POLICY IF EXISTS "Users can view their own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can create their own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can update their own transactions" ON "Transaction";
DROP POLICY IF EXISTS "Users can delete their own transactions" ON "Transaction";

CREATE POLICY "Users can view their own transactions"
ON "Transaction"
FOR SELECT
USING ("userId"::text = public.prisma_user_id_for_auth());

CREATE POLICY "Users can create their own transactions"
ON "Transaction"
FOR INSERT
WITH CHECK ("userId"::text = public.prisma_user_id_for_auth());

CREATE POLICY "Users can update their own transactions"
ON "Transaction"
FOR UPDATE
USING ("userId"::text = public.prisma_user_id_for_auth())
WITH CHECK ("userId"::text = public.prisma_user_id_for_auth());

CREATE POLICY "Users can delete their own transactions"
ON "Transaction"
FOR DELETE
USING ("userId"::text = public.prisma_user_id_for_auth());

-- User
DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
DROP POLICY IF EXISTS "Users can update their own profile" ON "User";

CREATE POLICY "Users can view their own profile"
ON "User"
FOR SELECT
USING (id::text = public.prisma_user_id_for_auth());

CREATE POLICY "Users can update their own profile"
ON "User"
FOR UPDATE
USING (id::text = public.prisma_user_id_for_auth())
WITH CHECK (id::text = public.prisma_user_id_for_auth());

-- UserSettings
DROP POLICY IF EXISTS "Users can view their own settings" ON "UserSettings";
DROP POLICY IF EXISTS "Users can update their own settings" ON "UserSettings";

CREATE POLICY "Users can view their own settings"
ON "UserSettings"
FOR SELECT
USING ("userId"::text = public.prisma_user_id_for_auth());

CREATE POLICY "Users can update their own settings"
ON "UserSettings"
FOR UPDATE
USING ("userId"::text = public.prisma_user_id_for_auth())
WITH CHECK ("userId"::text = public.prisma_user_id_for_auth());

-- FinancialGoal
DROP POLICY IF EXISTS "Users can view their own financial goals" ON "FinancialGoal";
DROP POLICY IF EXISTS "Users can insert their own financial goals" ON "FinancialGoal";
DROP POLICY IF EXISTS "Users can update their own financial goals" ON "FinancialGoal";
DROP POLICY IF EXISTS "Users can delete their own financial goals" ON "FinancialGoal";

CREATE POLICY "Users can view their own financial goals"
ON "FinancialGoal"
FOR SELECT
USING ("userId"::text = public.prisma_user_id_for_auth());

CREATE POLICY "Users can insert their own financial goals"
ON "FinancialGoal"
FOR INSERT
WITH CHECK ("userId"::text = public.prisma_user_id_for_auth());

CREATE POLICY "Users can update their own financial goals"
ON "FinancialGoal"
FOR UPDATE
USING ("userId"::text = public.prisma_user_id_for_auth())
WITH CHECK ("userId"::text = public.prisma_user_id_for_auth());

CREATE POLICY "Users can delete their own financial goals"
ON "FinancialGoal"
FOR DELETE
USING ("userId"::text = public.prisma_user_id_for_auth());

-- Income, Expense, SavingsGoal, WellnessScore
DROP POLICY IF EXISTS "Users can view their own income" ON "Income";
DROP POLICY IF EXISTS "Users can manage their own income" ON "Income";
CREATE POLICY "Users can manage their own income"
ON "Income"
FOR ALL
USING ("userId"::text = public.prisma_user_id_for_auth())
WITH CHECK ("userId"::text = public.prisma_user_id_for_auth());

DROP POLICY IF EXISTS "Users can view their own expenses" ON "Expense";
DROP POLICY IF EXISTS "Users can manage their own expenses" ON "Expense";
CREATE POLICY "Users can manage their own expenses"
ON "Expense"
FOR ALL
USING ("userId"::text = public.prisma_user_id_for_auth())
WITH CHECK ("userId"::text = public.prisma_user_id_for_auth());

DROP POLICY IF EXISTS "Users can view their own savings goals" ON "SavingsGoal";
DROP POLICY IF EXISTS "Users can manage their own savings goals" ON "SavingsGoal";
CREATE POLICY "Users can manage their own savings goals"
ON "SavingsGoal"
FOR ALL
USING ("userId"::text = public.prisma_user_id_for_auth())
WITH CHECK ("userId"::text = public.prisma_user_id_for_auth());

DROP POLICY IF EXISTS "Users can view their own wellness scores" ON "WellnessScore";
DROP POLICY IF EXISTS "Users can manage their own wellness scores" ON "WellnessScore";
CREATE POLICY "Users can manage their own wellness scores"
ON "WellnessScore"
FOR ALL
USING ("userId"::text = public.prisma_user_id_for_auth())
WITH CHECK ("userId"::text = public.prisma_user_id_for_auth());

-- Account, Session
DROP POLICY IF EXISTS "Users can view their own accounts" ON "Account";
DROP POLICY IF EXISTS "Users can manage their own accounts" ON "Account";
CREATE POLICY "Users can manage their own accounts"
ON "Account"
FOR ALL
USING ("userId"::text = public.prisma_user_id_for_auth())
WITH CHECK ("userId"::text = public.prisma_user_id_for_auth());

DROP POLICY IF EXISTS "Users can view their own sessions" ON "Session";
DROP POLICY IF EXISTS "Users can manage their own sessions" ON "Session";
CREATE POLICY "Users can manage their own sessions"
ON "Session"
FOR ALL
USING ("userId"::text = public.prisma_user_id_for_auth())
WITH CHECK ("userId"::text = public.prisma_user_id_for_auth());
