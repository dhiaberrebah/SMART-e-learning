-- First, convert column to TEXT to allow any value temporarily
ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;

-- Drop the old enum
DROP TYPE IF EXISTS user_role;

-- Create new enum without 'student'
CREATE TYPE user_role AS ENUM ('teacher', 'parent', 'admin');

-- Update any existing student users to parent (now that enum has parent)
UPDATE profiles SET role = 'parent' WHERE role = 'student';

-- Convert column back to the new enum type
ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;

-- Update the trigger function to only allow teacher/parent/admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role user_role;
  user_name text;
BEGIN
  -- Extract role from metadata, default to 'parent'
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'parent'::user_role);
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
