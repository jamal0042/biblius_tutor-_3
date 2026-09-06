-- Add uploaded_by column to digital_resources so "Mes publications" works.

ALTER TABLE public.digital_resources
  ADD COLUMN IF NOT EXISTS uploaded_by uuid
    REFERENCES public.members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_digital_resources_uploaded_by
  ON public.digital_resources(uploaded_by);
