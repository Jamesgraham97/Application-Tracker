--
-- Job Tracker - Supabase SQL Schema Migration
-- Run this in your Supabase SQL Editor to provision the 'applications' table
--

-- 1. Create the Applications table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    remote VARCHAR(50) DEFAULT 'Remote', -- 'Onsite' | 'Hybrid' | 'Remote'
    salary_min NUMERIC,
    salary_max NUMERIC,
    salary_text VARCHAR(255),
    source VARCHAR(255),
    job_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Saved',
    notes TEXT,
    applied_date DATE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    timeline JSONB DEFAULT '[]'::jsonb
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow public access using the Anon key
-- Since this is a personal project for a single user, we allow anonymous select/insert/update/delete.
-- For a secure single-user setup, users can restrict this or connect via standard Supabase auth.
CREATE POLICY "Allow public select" 
    ON public.applications FOR SELECT 
    USING (true);

CREATE POLICY "Allow public insert" 
    ON public.applications FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow public update" 
    ON public.applications FOR UPDATE 
    USING (true);

CREATE POLICY "Allow public delete" 
    ON public.applications FOR DELETE 
    USING (true);

-- 4. Set up automatic last_updated update trigger (optional but recommended)
CREATE OR REPLACE FUNCTION public.set_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_last_updated
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.set_last_updated();

-- 5. Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_last_updated ON public.applications(last_updated DESC);
