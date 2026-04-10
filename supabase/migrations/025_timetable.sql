-- Emploi du temps : créneaux horaires hebdomadaires par classe
CREATE TABLE public.timetable_slots (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id      UUID REFERENCES public.classes(id)   ON DELETE CASCADE NOT NULL,
  teacher_id    UUID REFERENCES public.profiles(id)  ON DELETE SET NULL,
  subject_name  TEXT NOT NULL,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),  -- 1=Lundi … 6=Samedi
  slot_index    SMALLINT NOT NULL CHECK (slot_index  BETWEEN 0 AND 7),  -- 0=08:00-09:00 … 7=17:00-18:00
  room          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Une classe ne peut avoir qu'un seul créneau par case (jour × heure)
CREATE UNIQUE INDEX timetable_class_day_slot
  ON public.timetable_slots(class_id, day_of_week, slot_index);

-- Index pour accès rapide par enseignant
CREATE INDEX timetable_teacher_idx ON public.timetable_slots(teacher_id);

-- RLS
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_timetable" ON public.timetable_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "teacher_read_timetable" ON public.timetable_slots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'parent')
    )
  );
