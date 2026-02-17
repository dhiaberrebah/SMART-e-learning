-- First, check if there are any parent users (optional - for safety)
-- SELECT COUNT(*) FROM profiles WHERE role = 'parent';

-- Update any existing parent users to student (or delete them)
UPDATE profiles SET role = 'student' WHERE role = 'parent';

-- Drop the old enum and recreate without 'parent'
ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;

DROP TYPE IF EXISTS user_role;

CREATE TYPE user_role AS ENUM ('teacher', 'student', 'admin');

ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;

-- Update the trigger function to only allow teacher/student/admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role user_role;
  user_name text;
BEGIN
  -- Extract role from metadata, default to 'student'
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role);
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'User');
  
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, user_name, user_role);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
