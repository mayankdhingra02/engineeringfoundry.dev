begin;

create or replace function public.save_system_design_attempt(
  target_attempt_id uuid,
  target_expected_revision bigint,
  target_title text,
  target_status text,
  target_confidence text,
  target_application_id uuid,
  target_document jsonb
)
returns setof public.system_design_attempts
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  practice_time timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_attempt_id is null or target_expected_revision is null or target_expected_revision < 1 then
    raise exception 'Expected System Design attempt revision is required' using errcode = '23514';
  end if;
  if target_status not in ('draft','practiced','review') then
    raise exception 'Invalid attempt status' using errcode = '23514';
  end if;
  if target_confidence is not null and target_confidence not in ('low','medium','high') then
    raise exception 'Invalid confidence' using errcode = '23514';
  end if;
  if char_length(btrim(coalesce(target_title,''))) not between 1 and 160 then
    raise exception 'Invalid title' using errcode = '23514';
  end if;
  if not public.system_design_attempt_document_valid(target_document) then
    raise exception 'Invalid attempt document' using errcode = '23514';
  end if;
  if target_application_id is not null and not exists (
    select 1 from public.applications
    where id = target_application_id and user_id = current_user_id
  ) then
    raise exception 'Application is not owned by current user' using errcode = '23503';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(target_attempt_id::text)
  );
  practice_time := pg_catalog.clock_timestamp();

  return query
  update public.system_design_attempts as attempt set
    title = btrim(target_title),
    status = target_status,
    confidence = nullif(target_confidence,''),
    application_id = target_application_id,
    document = target_document,
    revision = attempt.revision + 1,
    first_practiced_at = coalesce(
      attempt.first_practiced_at,
      case when target_status <> 'draft' then practice_time end
    ),
    last_practiced_at = case
      when target_status <> 'draft' then practice_time
      else attempt.last_practiced_at
    end
  where attempt.id = target_attempt_id
    and attempt.user_id = current_user_id
    and attempt.revision = target_expected_revision
  returning attempt.*;
end;
$$;

create or replace function public.delete_system_design_attempt_if_revision(
  target_attempt_id uuid,
  target_problem_id text,
  target_expected_revision bigint
)
returns table(attempt_id uuid)
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
  if target_attempt_id is null or target_expected_revision is null or target_expected_revision < 1 then
    raise exception 'Expected System Design attempt revision is required' using errcode = '23514';
  end if;
  if target_problem_id is null or not exists (
    select 1 from public.system_design_item_catalog as catalog
    where catalog.id = target_problem_id
      and catalog.item_type = 'design_problem'
  ) then
    raise exception 'Unknown canonical System Design problem' using errcode = '23503';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(target_attempt_id::text)
  );

  return query
  delete from public.system_design_attempts as attempt
  where attempt.id = target_attempt_id
    and attempt.user_id = current_user_id
    and attempt.problem_id = target_problem_id
    and attempt.revision = target_expected_revision
  returning attempt.id;
end;
$$;

create or replace function public.delete_system_design_attempt(target_attempt_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  raise exception 'Revision-checked System Design attempt deletion is required'
    using errcode = '0A000';
end;
$$;

revoke all on function public.save_system_design_attempt(uuid,bigint,text,text,text,uuid,jsonb) from public, anon, authenticated;
revoke all on function public.delete_system_design_attempt_if_revision(uuid,text,bigint) from public, anon, authenticated;
revoke all on function public.delete_system_design_attempt(uuid) from public, anon, authenticated;
grant execute on function public.save_system_design_attempt(uuid,bigint,text,text,text,uuid,jsonb) to authenticated;
grant execute on function public.delete_system_design_attempt_if_revision(uuid,text,bigint) to authenticated;
grant execute on function public.delete_system_design_attempt(uuid) to authenticated;

-- Migration-first deployment makes already-loaded delete clients fail with the
-- stable legacy error before the revision-bound application action ships.

commit;
