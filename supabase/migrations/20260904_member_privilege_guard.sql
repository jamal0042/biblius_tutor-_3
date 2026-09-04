-- Security hardening: prevent non-staff users from escalating their own
-- privileges when updating their own `members` row.
--
-- Reasoning:
--   * /premiere-connexion and /dashboard/parametres update their OWN row via a
--     raw UPDATE with an RLS policy:
--         users_update_own_member  USING (auth.uid()=id) WITH CHECK (auth.uid()=id)
--   * A `WITH CHECK (auth.uid()=id)` only guarantees the row belongs to the user;
--     it does NOT prevent the user from editing sensitive columns such as
--     `role`, `status`, `email`, or the loan limits -> privilege escalation.
--
-- The guard is deliberately restricted to: authenticated (non-service-role),
-- NON-staff users editing their OWN row. It must NOT block:
--   * service-role operations (auth.uid() is null), e.g. the invite API;
--   * staff (admin/librarian) edits of any member.

create or replace function public.prevent_member_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_uid uuid := auth.uid();
begin
  -- Only guard real authenticated, non-service-role self-edits.
  if acting_uid is null then
    return new;                      -- service role: allowed
  end if;

  if acting_uid <> old.id then
    return new;                      -- editing someone else: allowed (staff path)
  end if;

  -- Self-edit: block non-staff from escalating.
  if exists (
    select 1 from public.members
    where id = acting_uid
      and role = any (array['admin'::text, 'librarian'::text])
  ) then
    return new;                      -- staff editing self: allowed
  end if;

  -- Sensitive columns a non-staff user must NEVER change themselves.
  if new.role is distinct from old.role then
    raise exception 'Vous ne pouvez pas modifier votre rôle.';
  end if;

  if new.email is distinct from old.email then
    raise exception 'Vous ne pouvez pas modifier votre adresse email.';
  end if;

  if new.max_loans is distinct from old.max_loans
     or new.max_loans_duration is distinct from old.max_loans_duration
     or new.max_digital_loans is distinct from old.max_digital_loans then
    raise exception 'Vous ne pouvez pas modifier vos plafonds d''emprunt.';
  end if;

  -- status may only transition pending -> active AND only if the invitation is
  -- still pending (revoked/expired invites cannot be re-activated).
  if new.status is distinct from old.status then
    if not (old.status = 'pending' and new.status = 'active' and old.invite_status = 'pending') then
      raise exception 'Action non autorisée sur votre statut.';
    end if;
  end if;

  -- invite_status may only transition pending -> accepted (activation).
  if new.invite_status is distinct from old.invite_status then
    if not (old.invite_status = 'pending' and new.invite_status = 'accepted') then
      raise exception 'Action non autorisée sur votre invitation.';
    end if;
  end if;

  -- invited_by and invite_token_hash must not be editable by the user.
  if new.invited_by is distinct from old.invited_by
     or new.invite_token_hash is distinct from old.invite_token_hash then
    raise exception 'Modification non autorisée.';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_member_privilege_escalation() from public;
grant execute on function public.prevent_member_privilege_escalation() to authenticated;

drop trigger if exists trg_prevent_member_privilege_escalation on public.members;

create trigger trg_prevent_member_privilege_escalation
  before update on public.members
  for each row
  execute function public.prevent_member_privilege_escalation();
