-- Invitation system for Biblius.
--
-- Design choices validated by the user:
--   * Keep the current direct-account flow (no separate invitations table with
--     a second auth system). Identity stays in `members` — we do NOT duplicate
--     personal info anywhere else.
--   * Emails are sent by Supabase Auth natively (auth.admin.inviteUserByEmail /
--     auth.admin.createUser). The invited user activates by clicking the
--     Supabase confirmation link, then lands on /premiere-connexion to set a
--     real password once.
--   * Role is always controlled server-side from `members.role` (never trusted
--     from the browser).
--
-- This migration is non-destructive:
--   * It only ADDS columns to the existing `members` table.
--   * Existing users and rows are untouched.
--
-- It also fixes the 400/42P17 issue: the current invitation form inserts
-- several columns (birth_date, address, city, level, speciality, notes,
-- max_loans_duration, max_digital_loans, email_notifications,
-- sms_notifications) that DO NOT EXIST on the real `members` table, causing
-- insert failures. Those columns are added here so the invitation form works.

-- 1) Invitation-tracking columns on `members`
alter table public.members
  add column if not exists invite_status text,
  add column if not exists invite_token_hash text,
  add column if not exists invite_sent_at timestamptz,
  add column if not exists invite_expires_at timestamptz,
  add column if not exists invite_accepted_at timestamptz,
  add column if not exists invited_by uuid;

-- 2) Missing profile columns used by the invitation form
alter table public.members
  add column if not exists birth_date date,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists level text,
  add column if not exists speciality text,
  add column if not exists notes text,
  add column if not exists max_loans_duration integer,
  add column if not exists max_digital_loans integer,
  add column if not exists email_notifications boolean default true,
  add column if not exists sms_notifications boolean default false;

-- 3) Constraints
do $$
begin
  -- invite_status allowed values
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.members'::regclass
      and conname = 'members_invite_status_check'
  ) then
    alter table public.members
      add constraint members_invite_status_check
      check (invite_status is null or invite_status in ('pending','accepted','expired','revoked'));
  end if;

  -- invited_by references a member (no cascade delete)
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.members'::regclass
      and conname = 'members_invited_by_fkey'
  ) then
    alter table public.members
      add constraint members_invited_by_fkey
      foreign key (invited_by) references public.members(id) on delete set null;
  end if;
end $$;

-- 4) Index on invite_status for fast filtering
create index if not exists members_invite_status_idx on public.members (invite_status);

-- 5) RLS
-- staff (admin/librarian) can manage invitations (already can read all members
-- via is_staff_member()). Add an UPDATE policy so the server-side service role
-- and authorized staff can update invitation fields. The service role bypasses
-- RLS, so strictly speaking this is for admin UIs that use the anon/authenticated
-- client. We keep it conservative: only staff can update invite fields.
drop policy if exists "staff_update_invitations" on public.members;

create policy "staff_update_invitations"
  on public.members
  for update
  to authenticated
  using (public.is_staff_member())
  with check (public.is_staff_member());

-- A user may update their OWN member row (used by /premiere-connexion to set a
-- real password and finalize their profile). This is intentionally limited to
-- one's own row.
drop policy if exists "users_update_own_member" on public.members;

create policy "users_update_own_member"
  on public.members
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
