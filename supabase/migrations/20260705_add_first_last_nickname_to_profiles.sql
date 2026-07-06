- SQL migration to add first_name, last_name, and nickname columns to profiles table

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Update existing profiles: Use the full_name to fill in nickname as a fallback
UPDATE public.profiles
SET nickname = COALESCE(nickname, full_name)
WHERE nickname IS NULL;

-- Create indexes for name-based searches or quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON public.profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON public.profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);


