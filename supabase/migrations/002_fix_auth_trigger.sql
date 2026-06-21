  -- Fix: "Database error saving new user" on Google OAuth signup
  -- Run this in Supabase SQL Editor if Google login fails after auth.

  -- Required for share_token defaults (if not already enabled)
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  -- Recreate profile trigger with search_path + null-safe email handling
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, name, avatar_url)
    VALUES (
      NEW.id,
      COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', NEW.raw_user_meta_data->>'email_address'),
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', 'user'), '@', 1)
      ),
      COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
      )
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = NOW();

    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'handle_new_user error for %: %', NEW.id, SQLERRM;
      RAISE;
  END;
  $$;

  -- Ensure trigger exists (drop + recreate to avoid duplicates)
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

  -- Allow trigger function to write profiles regardless of RLS
  GRANT USAGE ON SCHEMA public TO postgres, service_role;
  GRANT ALL ON public.profiles TO postgres, service_role;

  -- If a previous failed signup left a user without a profile, backfill:
  INSERT INTO public.profiles (id, email, name, avatar_url)
  SELECT
    u.id,
    COALESCE(u.email, u.raw_user_meta_data->>'email'),
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(COALESCE(u.email, 'user'), '@', 1)),
    COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL
    AND COALESCE(u.email, u.raw_user_meta_data->>'email') IS NOT NULL;
