    CREATE TABLE public.prets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id uuid REFERENCES public.members(id),
    document_id uuid REFERENCES public.documents(id),
    exemplaire_id uuid REFERENCES public.exemplaires(id),
    loan_date date NOT NULL DEFAULT now(),
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'active',
    notified_overdue boolean DEFAULT false
    );