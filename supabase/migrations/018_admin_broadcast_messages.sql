-- Messages diffusés par l'admin vers tous les utilisateurs ou par rôle (enseignants / parents)
CREATE TABLE IF NOT EXISTS public.admin_broadcast_messages (
  id              uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  title           text        NOT NULL,
  body            text        NOT NULL,
  target_audience text        NOT NULL CHECK (target_audience IN ('all', 'teacher', 'parent')),
  created_by      uuid        REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_broadcast_created_at ON public.admin_broadcast_messages (created_at DESC);

ALTER TABLE public.admin_broadcast_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_broadcast_select" ON public.admin_broadcast_messages;
DROP POLICY IF EXISTS "admin_broadcast_insert" ON public.admin_broadcast_messages;

CREATE POLICY "admin_broadcast_select"
  ON public.admin_broadcast_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (
        p.role = 'admin'
        OR target_audience = 'all'
        OR (p.role = 'teacher' AND target_audience = 'teacher')
        OR (p.role = 'parent' AND target_audience = 'parent')
      )
    )
  );

CREATE POLICY "admin_broadcast_insert"
  ON public.admin_broadcast_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
