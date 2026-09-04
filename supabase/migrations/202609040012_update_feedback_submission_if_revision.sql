begin;

create or replace function public.update_feedback_submission_if_revision(
  target_feedback_id uuid,
  target_expected_updated_at timestamptz,
  target_status text,
  target_admin_note text
)
returns table(
  feedback_id uuid,
  status text,
  updated_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_status text;
  current_admin_note text;
  current_updated_at timestamptz;
  normalized_note text := nullif(pg_catalog.btrim(target_admin_note), '');
  saved_status text;
  saved_updated_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not public.is_current_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if target_feedback_id is null or target_expected_updated_at is null then
    raise exception 'Expected feedback revision is required' using errcode = '23514';
  end if;
  if target_status is null or target_status not in ('new', 'triaged', 'planned', 'resolved', 'closed', 'spam') then
    raise exception 'Invalid feedback status' using errcode = '23514';
  end if;
  if pg_catalog.char_length(normalized_note) > 2000 then
    raise exception 'Private operator note is too long' using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('feedback_submission'),
    pg_catalog.hashtext(target_feedback_id::text)
  );

  select submissions.status, submissions.admin_note, submissions.updated_at
  into current_status, current_admin_note, current_updated_at
  from public.feedback_submissions as submissions
  where submissions.id = target_feedback_id
  for update;

  if not found or current_updated_at is distinct from target_expected_updated_at then
    return;
  end if;

  if current_status is not distinct from target_status
    and current_admin_note is not distinct from normalized_note then
    return query select target_feedback_id, current_status, current_updated_at;
    return;
  end if;

  update public.feedback_submissions as submissions
  set
    status = target_status,
    admin_note = normalized_note,
    updated_at = greatest(
      pg_catalog.clock_timestamp(),
      current_updated_at + interval '1 microsecond'
    )
  where submissions.id = target_feedback_id
  returning submissions.status, submissions.updated_at
  into saved_status, saved_updated_at;

  insert into public.admin_audit_events (
    admin_actor_id,
    action_type,
    target_type,
    target_id,
    prior_status,
    new_status
  )
  values (
    current_user_id,
    case
      when current_status is distinct from target_status then 'feedback_status_changed'
      else 'feedback_note_updated'
    end,
    'feedback_submission',
    target_feedback_id,
    current_status,
    saved_status
  );

  return query select target_feedback_id, saved_status, saved_updated_at;
end;
$$;

create or replace function public.update_feedback_submission(
  target_id uuid,
  next_status text,
  next_note text default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  raise exception 'Revision-checked feedback triage is required'
    using errcode = '0A000';
end;
$$;

revoke all on function public.update_feedback_submission_if_revision(uuid,timestamptz,text,text)
  from public, anon, authenticated;
revoke all on function public.update_feedback_submission(uuid,text,text)
  from public, anon, authenticated;

grant execute on function public.update_feedback_submission_if_revision(uuid,timestamptz,text,text)
  to authenticated;
grant execute on function public.update_feedback_submission(uuid,text,text)
  to authenticated;

-- Migration-first deployment makes already-loaded feedback triage clients fail
-- with the stable legacy error before revision-bound triage ships.

commit;
