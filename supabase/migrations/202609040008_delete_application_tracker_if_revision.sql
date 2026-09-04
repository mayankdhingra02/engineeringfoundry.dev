begin;

create or replace function public.delete_application_if_revision(
  target_application_id uuid,
  target_expected_updated_at timestamptz
)
returns table(application_id uuid)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_application_id is null or target_expected_updated_at is null then
    raise exception 'Expected application revision is required'
      using errcode = '23514';
  end if;

  return query
  delete from public.applications as application
  where application.id = target_application_id
    and application.user_id = current_user_id
    and application.updated_at = target_expected_updated_at
  returning application.id;
end;
$$;

create or replace function public.delete_interview_round_if_revision(
  target_application_id uuid,
  target_round_id uuid,
  target_expected_updated_at timestamptz
)
returns table(round_id uuid)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_application_id is null
    or target_round_id is null
    or target_expected_updated_at is null then
    raise exception 'Expected interview round revision is required'
      using errcode = '23514';
  end if;

  return query
  delete from public.interview_rounds as round
  where round.id = target_round_id
    and round.application_id = target_application_id
    and round.user_id = current_user_id
    and round.updated_at = target_expected_updated_at
  returning round.id;
end;
$$;

-- Revision-checked owner RPCs are the only authenticated delete boundary.
-- Already-loaded direct-delete clients fail safely with 42501 after a
-- migration-first deployment.
revoke delete on table public.applications from authenticated;
revoke delete on table public.interview_rounds from authenticated;

revoke all on function public.delete_application_if_revision(uuid,timestamptz)
  from public, anon, authenticated;
revoke all on function public.delete_interview_round_if_revision(
  uuid,uuid,timestamptz
) from public, anon, authenticated;
grant execute on function public.delete_application_if_revision(
  uuid,timestamptz
) to authenticated;
grant execute on function public.delete_interview_round_if_revision(
  uuid,uuid,timestamptz
) to authenticated;

commit;
