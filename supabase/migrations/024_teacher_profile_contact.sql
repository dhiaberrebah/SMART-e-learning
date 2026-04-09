-- Optional contact / HR fields for teachers (nullable for parents and legacy rows)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS recruitment_date DATE;

COMMENT ON COLUMN public.profiles.phone IS 'Téléphone (enseignants)';
COMMENT ON COLUMN public.profiles.address IS 'Adresse (enseignants)';
COMMENT ON COLUMN public.profiles.recruitment_date IS 'Date de recrutement (enseignants)';
