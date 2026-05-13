-- Allow several rows for the same class and same libellé with different teachers
-- (removes restrictive uniqueness sometimes added manually outside this repo).

DROP INDEX IF EXISTS idx_subjects_class_name_unique;
DROP INDEX IF EXISTS idx_subjects_class_name_lower_unique;
DROP INDEX IF EXISTS ux_subjects_class_name;
ALTER TABLE public.subjects DROP CONSTRAINT IF EXISTS subjects_class_id_name_key;