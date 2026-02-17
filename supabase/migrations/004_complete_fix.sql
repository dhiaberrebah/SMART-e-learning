-- First, let's check what we have
-- SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- SELECT * FROM auth.users;
-- SELECT * FROM profiles;

-- Clean up everything
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Recreate the function with explicit schema and better error handling
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
    -- Log the error but don't fail the signup
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users that don't have profiles
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'User'),
  COALESCE((u.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
