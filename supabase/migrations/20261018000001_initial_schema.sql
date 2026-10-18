-- ==============================================================================
-- Migration: 20261018000001_initial_schema.sql
-- Description: Creates the profiles table, automatic updated_at trigger,
--              user registration profile bootstrap trigger, audit log table,
--              and Row Level Security (RLS) policies.
-- ==============================================================================

-- 1. Enable pgcrypto / uuid-ossp if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL DEFAULT '',
    avatar_url TEXT DEFAULT '',
    bio VARCHAR(500) DEFAULT '',
    gender VARCHAR(50) DEFAULT 'unspecified',
    hobbies TEXT[] DEFAULT ARRAY[]::TEXT[],
    strengths TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Comment on table and columns for database self-documentation
COMMENT ON TABLE public.profiles IS 'Stores user profile information synced across Web and Mobile clients';
COMMENT ON COLUMN public.profiles.id IS 'Primary key, 1:1 reference to Supabase auth.users';
COMMENT ON COLUMN public.profiles.display_name IS 'User chosen display name';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Hosted URL or Supabase storage path of profile photo';
COMMENT ON COLUMN public.profiles.gender IS 'User gender preference';
COMMENT ON COLUMN public.profiles.hobbies IS 'List of user hobbies';
COMMENT ON COLUMN public.profiles.strengths IS 'List of key strengths/skills';
COMMENT ON COLUMN public.profiles.updated_at IS 'Automatically refreshed on every UPDATE via PostgreSQL trigger';

-- 3. Create the updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach the trigger to the profiles table
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Create automatic profile creation on user registration (bootstrap trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url, bio, gender, hobbies, strengths)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'New User'),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
        'Hello! I am using the full-stack synced platform.',
        'unspecified',
        ARRAY['Coding', 'Learning']::TEXT[],
        ARRAY['Problem Solving']::TEXT[]
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach trigger to Supabase auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 7. Create Profile Audit Log Table
CREATE TABLE IF NOT EXISTS public.profile_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

COMMENT ON TABLE public.profile_audit_logs IS 'Audit trail recording all profile modifications for security and compliance';

-- 8. Audit log trigger on profiles modification
CREATE OR REPLACE FUNCTION public.handle_profile_audit()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.profile_audit_logs (user_id, action, old_data, new_data)
        VALUES (
            NEW.id,
            'UPDATE',
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.profile_audit_logs (user_id, action, old_data, new_data)
        VALUES (
            NEW.id,
            'INSERT',
            NULL,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.profile_audit_logs (user_id, action, old_data, new_data)
        VALUES (
            OLD.id,
            'DELETE',
            to_jsonb(OLD),
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_profile_audit ON public.profiles;
CREATE TRIGGER trigger_profile_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_profile_audit();

-- 9. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. Define RLS Policies for Profiles
-- Users can view only their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Define RLS Policies for Audit Logs
-- Users can view only their own audit logs
CREATE POLICY "Users can view own audit logs"
    ON public.profile_audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- 11. Create Avatars Storage Bucket and Storage Policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: Allow authenticated users to upload avatar images into avatars bucket
CREATE POLICY "Allow authenticated user uploads"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow users to update their own avatar objects
CREATE POLICY "Allow authenticated user updates"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow public read access to avatar images
CREATE POLICY "Allow public read access to avatars"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
