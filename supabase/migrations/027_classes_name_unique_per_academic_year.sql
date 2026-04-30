-- Même nom de classe autorisé pour deux années scolaires différentes (ex. 1re année a 2024-2025 vs 2025-2026).
-- L'unicité s'applique à la combinaison (nom normalisé, année scolaire normalisée).
DROP INDEX IF EXISTS public.idx_classes_name_lower_trim;

CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_name_academic_year_lower
  ON public.classes (
    lower(trim(name)),
    COALESCE(NULLIF(trim(academic_year), ''), '')
  );
