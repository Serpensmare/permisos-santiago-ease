-- Ensure RLS is strictly limited to authenticated users and owner-only access on profiles
ALTER POLICY "Users can view their own profile" ON public.profiles
  TO authenticated
  USING (auth.uid() = user_id);

ALTER POLICY "Users can create their own profile" ON public.profiles
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update their own profile" ON public.profiles
  TO authenticated
  USING (auth.uid() = user_id);

-- Add a unique index on user_id to prevent multiple profiles per user (safely, only if no duplicates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'profiles_user_id_unique'
  ) THEN
    IF EXISTS (
      SELECT user_id FROM public.profiles GROUP BY user_id HAVING COUNT(*) > 1
    ) THEN
      RAISE NOTICE 'Skipping unique index on profiles.user_id due to existing duplicate rows. Please resolve duplicates first.';
    ELSE
      CREATE UNIQUE INDEX profiles_user_id_unique ON public.profiles(user_id);
    END IF;
  END IF;
END $$;

-- Double-check RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
