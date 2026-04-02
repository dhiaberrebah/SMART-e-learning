-- Numéros élèves séquentiels 1..n (ordre created_at, puis id)
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id)::int AS n
  FROM public.students
)
UPDATE public.students s
SET student_number = o.n::text,
    updated_at     = now()
FROM ordered o
WHERE s.id = o.id;
