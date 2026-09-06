-- Contact / demo request messages table.
-- Used by /contact and /demo pages via /api/messages.

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid()
    CONSTRAINT contact_messages_pkey PRIMARY KEY,
  type text NOT NULL DEFAULT 'contact'
    CHECK (type IN ('contact', 'demo')),
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text,
  -- demo-only fields
  establishment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_type ON public.contact_messages(type);

-- RLS: only staff can read; anon/authenticated can insert
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contact_messages_insert_anon" ON public.contact_messages;
CREATE POLICY "contact_messages_insert_anon"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "contact_messages_staff_select" ON public.contact_messages;
CREATE POLICY "contact_messages_staff_select"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (public.is_staff_member());

DROP POLICY IF EXISTS "contact_messages_staff_delete" ON public.contact_messages;
CREATE POLICY "contact_messages_staff_delete"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (public.is_staff_member());

GRANT ALL PRIVILEGES ON TABLE public.contact_messages TO anon, authenticated, service_role, postgres, authenticator;
