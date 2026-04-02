-- Programme prévu par classe : matières qui doivent être enseignées (référentiel admin)
CREATE TABLE IF NOT EXISTS public.class_curriculum_items (
  id          uuid        NOT NULL DEFAULT extensions.uuid_generate_v4(),
  class_id    uuid        NOT NULL REFERENCES public.classes (id) ON DELETE CASCADE,
  name        text        NOT NULL,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT class_curriculum_items_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_class_curriculum_items_class_id ON public.class_curriculum_items (class_id);
CREATE INDEX IF NOT EXISTS idx_class_curriculum_items_sort ON public.class_curriculum_items (class_id, sort_order);

CREATE UNIQUE INDEX IF NOT EXISTS idx_class_curriculum_items_class_name_lower
  ON public.class_curriculum_items (class_id, lower(trim(name)));
