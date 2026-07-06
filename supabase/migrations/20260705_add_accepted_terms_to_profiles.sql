-- SQL migration to add terms acceptance tracking to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS accepted_terms_version INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ;

-- Notify schema reload for PostgREST
NOTIFY pgrst, 'reload schema';
