alter table public.digital_resources
add column if not exists downloadable boolean not null default true;

alter table public.digital_resources
add column if not exists author_id uuid references public.auteurs(id) on delete set null;