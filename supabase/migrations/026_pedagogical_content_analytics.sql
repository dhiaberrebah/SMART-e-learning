-- Optional explicit type for filters (pdf / video / image / other); fallback to mime inference in app when null
ALTER TABLE public.pedagogical_contents
  ADD COLUMN IF NOT EXISTS content_kind text;

COMMENT ON COLUMN public.pedagogical_contents.content_kind IS 'pdf | video | image | other — for filters; null = infer from mime_type';

-- Anonymous visit/download events (tracked via API Route + service role)
CREATE TABLE IF NOT EXISTS public.pedagogical_content_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedagogical_content_id uuid NOT NULL REFERENCES public.pedagogical_contents(id) ON DELETE CASCADE,
  event_kind text NOT NULL CHECK (event_kind IN ('view', 'download')),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pedagogical_content_events_content
  ON public.pedagogical_content_events (pedagogical_content_id);

CREATE INDEX IF NOT EXISTS idx_pedagogical_content_events_created
  ON public.pedagogical_content_events (created_at DESC);

ALTER TABLE public.pedagogical_content_events ENABLE ROW LEVEL SECURITY;
