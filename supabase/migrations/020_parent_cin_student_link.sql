-- CIN parent : inscription + rattachement automatique des élèves saisis par l'admin

CREATE OR REPLACE FUNCTION public.parent_cin_normalized(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT CASE
    WHEN t IS NULL OR btrim(t) = '' THEN NULL
    ELSE upper(regexp_replace(btrim(t), '\s', '', 'g'))
  END
$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cin text NULL;

COMMENT ON COLUMN public.profiles.cin IS 'CIN normalisé (sans espaces, majuscules) — unique pour les comptes où il est renseigné';

DROP INDEX IF EXISTS idx_profiles_cin_unique;
CREATE UNIQUE INDEX idx_profiles_cin_unique
  ON public.profiles (cin)
  WHERE cin IS NOT NULL;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS enrollment_parent_cin text NULL;

COMMENT ON COLUMN public.students.enrollment_parent_cin IS 'CIN déclaré par l''admin si aucun parent trouvé ; effacé quand parent_id est lié';

CREATE OR REPLACE FUNCTION public.link_orphan_students_for_parent(p_parent_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm text;
  n int := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_parent_id AND role = 'parent') THEN
    RETURN 0;
  END IF;

  SELECT public.parent_cin_normalized(cin) INTO v_norm FROM profiles WHERE id = p_parent_id;

  IF v_norm IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.students s
  SET
    parent_id = p_parent_id,
    enrollment_parent_cin = NULL,
    updated_at = now()
  WHERE s.parent_id IS NULL
    AND public.parent_cin_normalized(s.enrollment_parent_cin) = v_norm;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_profiles_link_students_by_cin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'parent'::public.user_role THEN
    PERFORM public.link_orphan_students_for_parent(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_link_students_after_insert ON public.profiles;
CREATE TRIGGER profiles_link_students_after_insert
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_profiles_link_students_by_cin();

DROP TRIGGER IF EXISTS profiles_link_students_after_cin_update ON public.profiles;
CREATE TRIGGER profiles_link_students_after_cin_update
  AFTER UPDATE OF cin ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'parent'::public.user_role)
  EXECUTE FUNCTION public.trg_profiles_link_students_by_cin();

-- Profil à la création auth : inclure le CIN (métadonnées inscription parent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.user_role;
  user_name text;
  user_cin text;
BEGIN
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'parent'::public.user_role);
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
  user_cin := public.parent_cin_normalized(NEW.raw_user_meta_data->>'cin');

  IF user_role <> 'parent'::public.user_role THEN
    user_cin := NULL;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, cin)
  VALUES (NEW.id, NEW.email, user_name, user_role, user_cin);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
