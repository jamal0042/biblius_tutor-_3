-- ============================================================================
-- BIBLIUS — Système professionnel de catalogage & classification (Dewey)
-- Migration NON destructive — Ajoute / enrichit sans supprimer de données.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. ROLES DE CONTRIBUTION enrichis (document_auteurs)
--    Élargit le CHECK aux rôles de responsabilité intellectuelle.
-- ---------------------------------------------------------------------------
ALTER TABLE public.document_auteurs
  DROP CONSTRAINT IF EXISTS document_auteurs_role_check;

ALTER TABLE public.document_auteurs
  ADD CONSTRAINT document_auteurs_role_check CHECK (
    role = ANY (ARRAY[
      'principal',
      'coauteur',
      'secondaire',
      'encadreur',
      'directeur_memoire',
      'directeur_these',
      'editeur_scientifique',
      'traducteur',
      'illustrateur',
      'coordinateur',
      'responsable_institutionnel'
    ])
  );

-- ---------------------------------------------------------------------------
-- 2. LOCALISATION HIÉRARCHIQUE (locations)
--    Ajoute parent_id + type de niveau pour Bibliothèque→Salle→Section→Rayon→Étagère→Position
-- ---------------------------------------------------------------------------
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.locations(id) ON DELETE CASCADE;

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'bibliotheque'
    CHECK (level = ANY (ARRAY['bibliotheque','salle','section','rayon','etagere','position']));

ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS code integer;

COMMENT ON COLUMN public.locations.parent_id IS 'Parent dans la hiérarchie de localisation (NULL = racine).';

CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON public.locations(parent_id);

-- ---------------------------------------------------------------------------
-- 3. IDENTIFIANTS & MÉTADONNÉES DOCUMENT (colonnes optionnelles, non destructives)
-- ---------------------------------------------------------------------------
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS edition text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS volume text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS issn text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS doi text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS collection text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS num_report text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS institution text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS department text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS academic_year text;

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS dewey_code text REFERENCES public.dewey_classes(code) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 4. CLASSIFICATION DEWEY — versionnement / extensibilité
--    (dewey_classes conserve code, libelle, parent_code ; on ajoute méta)
-- ---------------------------------------------------------------------------
ALTER TABLE public.dewey_classes
  ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.dewey_classes
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status = ANY (ARRAY['active','deprecated','draft']));

ALTER TABLE public.dewey_classes
  ADD COLUMN IF NOT EXISTS source text;

ALTER TABLE public.dewey_classes
  ADD COLUMN IF NOT EXISTS level integer;

CREATE UNIQUE INDEX IF NOT EXISTS dewey_classes_code_unique ON public.dewey_classes(code);

-- ---------------------------------------------------------------------------
-- 5. CLASSIFICATION_LOG — audit des suggestions / validations Dewey
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'manual' CHECK (source = ANY (ARRAY['manual','ai','import'])),
  status text NOT NULL DEFAULT 'proposed'
    CHECK (status = ANY (ARRAY['proposed','validated','rejected','modified'])),
  proposed_code text,
  proposed_libelle text,
  confidence integer CHECK (confidence BETWEEN 0 AND 100),
  justification text,
  validated_code text,
  validated_by uuid REFERENCES public.members(id) ON DELETE SET NULL,
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classification_log_document_id ON public.classification_log(document_id);
CREATE INDEX IF NOT EXISTS idx_classification_log_status ON public.classification_log(status);

-- ---------------------------------------------------------------------------
-- 6. RLS — suivre le pattern existant (staff_write + lecture authentifiée)
-- ---------------------------------------------------------------------------
ALTER TABLE public.classification_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "classification_log_select_all" ON public.classification_log;
CREATE POLICY "classification_log_select_all"
  ON public.classification_log FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "classification_log_staff_write" ON public.classification_log;
CREATE POLICY "classification_log_staff_write"
  ON public.classification_log FOR ALL
  TO authenticated
  USING (public.is_staff_member())
  WITH CHECK (public.is_staff_member());

GRANT ALL PRIVILEGES ON TABLE public.classification_log TO anon, authenticated, service_role, postgres, authenticator;

-- ---------------------------------------------------------------------------
-- 7. SYNCHRONISATION DES COMPTEURS (exemplaires_disponibles / total_exemplaires)
--    Truc à la demande : recalcul déclenché par trigger sur exemplaires/prets.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_document_exemplaire_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target uuid;
BEGIN
  target := COALESCE(NEW.document_id, OLD.document_id);
  IF target IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.documents d
  SET total_exemplaires = (
        SELECT count(*) FROM public.exemplaires e WHERE e.document_id = d.id
      ),
      exemplaires_disponibles = (
        SELECT count(*) FROM public.exemplaires e
        WHERE e.document_id = d.id AND e.status = 'available'
      ),
      updated_at = now()
  WHERE d.id = target;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_exemplaires_sync_counts ON public.exemplaires;
CREATE TRIGGER trg_exemplaires_sync_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.exemplaires
  FOR EACH ROW EXECUTE FUNCTION public.sync_document_exemplaire_counts();
