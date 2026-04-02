-- Noms de classe uniques (insensible à la casse / espaces en bout)
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_name_lower_trim
  ON public.classes (lower(trim(name)));
