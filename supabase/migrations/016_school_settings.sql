-- Paramètres publics de l'établissement (une seule ligne)
CREATE TABLE IF NOT EXISTS public.school_settings (
  id boolean PRIMARY KEY DEFAULT true CONSTRAINT school_settings_single_row CHECK (id = true),
  school_name text NOT NULL DEFAULT 'Mon établissement',
  study_hours text,
  enrollment_period text,
  registration_fee_dt numeric(10, 3),
  tuition_annual_dt numeric(10, 3),
  tuition_notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.school_settings (id) VALUES (true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read school_settings" ON public.school_settings;
DROP POLICY IF EXISTS "Admin update school_settings" ON public.school_settings;
DROP POLICY IF EXISTS "Admin insert school_settings" ON public.school_settings;

CREATE POLICY "Public read school_settings"
  ON public.school_settings FOR SELECT
  USING (true);

CREATE POLICY "Admin update school_settings"
  ON public.school_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin insert school_settings"
  ON public.school_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
