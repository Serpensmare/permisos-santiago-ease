-- Security hardening for profiles table
-- 1) Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) Enforce one profile per user for consistency and to avoid accidental data leakage across duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_user_id_key'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END$$;

-- 3) Create an index to speed up lookups by user_id (safe if it already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i' AND c.relname = 'idx_profiles_user_id' AND n.nspname = 'public'
  ) THEN
    CREATE INDEX idx_profiles_user_id ON public.profiles (user_id);
  END IF;
END$$;