-- Fix 42P17: infinite recursion in the "members" SELECT policy.
--
-- The previous "staff_select_all_members" policy was:
--   USING (EXISTS (SELECT 1 FROM members m WHERE m.id = auth.uid() AND m.role = ANY (ARRAY['admin','librarian'])))
--
-- This self-references "members", so Postgres re-evaluates RLS on the inner
-- SELECT, which re-triggers the policy -> infinite recursion -> 42P17.
--
-- Fix: move the check into a SECURITY DEFINER function. The function body runs
-- with the privileges of its owner (which bypasses RLS), so the inner SELECT
-- no longer re-triggers the recursive policy.

create or replace function public.is_staff_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.members
    where id = auth.uid()
      and role = any (array['admin'::text, 'librarian'::text])
  );
$$;

revoke all on function public.is_staff_member() from public;
grant execute on function public.is_staff_member() to authenticated;

drop policy if exists "staff_select_all_members" on public.members;

create policy "staff_select_all_members"
  on public.members
  for select
  to authenticated
  using (public.is_staff_member());
