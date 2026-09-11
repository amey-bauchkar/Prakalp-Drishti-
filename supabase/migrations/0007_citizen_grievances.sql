-- 0007_citizen_grievances.sql
-- Schema for citizen grievances and observations intake under CPGRAMS interoperability

CREATE TABLE IF NOT EXISTS public.citizen_grievances (
    id BIGSERIAL PRIMARY KEY,
    tracking_id VARCHAR(64) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    other_category VARCHAR(255),
    category_label VARCHAR(255) NOT NULL,
    project_id VARCHAR(100),
    details TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED',
    client_ip VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_grievances_tracking_id ON public.citizen_grievances(tracking_id);
CREATE INDEX IF NOT EXISTS idx_grievances_category ON public.citizen_grievances(category);
CREATE INDEX IF NOT EXISTS idx_grievances_created_at ON public.citizen_grievances(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.citizen_grievances ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'citizen_grievances' AND policyname = 'allow_anon_insert_grievances'
    ) THEN
        CREATE POLICY allow_anon_insert_grievances ON public.citizen_grievances
        FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'citizen_grievances' AND policyname = 'allow_anon_select_grievances'
    ) THEN
        CREATE POLICY allow_anon_select_grievances ON public.citizen_grievances
        FOR SELECT USING (true);
    END IF;
END
$$;
