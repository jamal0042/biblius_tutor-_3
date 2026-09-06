-- Settings table: single-row global library configuration.
-- Matches the interface used by admin/systeme/page.tsx.

CREATE TABLE IF NOT EXISTS public.settings (
  id integer NOT NULL DEFAULT 1
    CONSTRAINT settings_pkey PRIMARY KEY
    CONSTRAINT settings_single_row CHECK (id = 1),
  library_name text NOT NULL DEFAULT 'Biblius',
  library_address text DEFAULT '',
  library_phone text DEFAULT '',
  library_email text DEFAULT '',
  max_physical_loans integer NOT NULL DEFAULT 5,
  max_loan_duration_days integer NOT NULL DEFAULT 15,
  max_renewals integer NOT NULL DEFAULT 2,
  max_digital_loans integer NOT NULL DEFAULT 3,
  penalty_per_day_late integer NOT NULL DEFAULT 100,
  penalty_lost_book integer NOT NULL DEFAULT 15000,
  penalty_damaged_book integer NOT NULL DEFAULT 5000,
  enable_email_notifications boolean NOT NULL DEFAULT true,
  enable_sms_notifications boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Seed the single row so upserts always find it
INSERT INTO public.settings (id, library_name)
VALUES (1, 'Biblius')
ON CONFLICT (id) DO NOTHING;

-- RLS: only staff can read/write settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_all" ON public.settings;
CREATE POLICY "settings_select_all"
  ON public.settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "settings_staff_write" ON public.settings;
CREATE POLICY "settings_staff_write"
  ON public.settings FOR ALL
  TO authenticated
  USING (public.is_staff_member())
  WITH CHECK (public.is_staff_member());

GRANT ALL PRIVILEGES ON TABLE public.settings TO anon, authenticated, service_role, postgres, authenticator;
