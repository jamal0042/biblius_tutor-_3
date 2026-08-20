CREATE TABLE IF NOT EXISTS public.document_auteurs (
  document_id uuid NOT NULL,
  author_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'principal'::text CHECK (role = ANY (ARRAY['principal'::text, 'coauteur'::text, 'secondaire'::text, 'traducteur'::text, 'illustrateur'::text])),
  author_order integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT document_auteurs_pkey PRIMARY KEY (document_id, author_id),
  CONSTRAINT document_auteurs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE,
  CONSTRAINT document_auteurs_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.auteurs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_document_auteurs_document_id ON public.document_auteurs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_auteurs_author_id ON public.document_auteurs(author_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'author_id'
  ) THEN
    INSERT INTO public.document_auteurs (document_id, author_id, role, author_order)
    SELECT id, author_id, 'principal', 1
    FROM public.documents
    WHERE author_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_author_id_fkey;
    ALTER TABLE public.documents DROP COLUMN author_id;
  END IF;
END $$;

GRANT ALL PRIVILEGES ON TABLE public.document_auteurs TO anon, authenticated, service_role, postgres, authenticator;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres, authenticator;