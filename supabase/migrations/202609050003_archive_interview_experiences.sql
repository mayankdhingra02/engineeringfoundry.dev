begin;

alter table public.admin_audit_events
  drop constraint admin_audit_events_action_type_check;
alter table public.admin_audit_events
  add constraint admin_audit_events_action_type_check check (
    action_type in (
      'feedback_status_changed',
      'feedback_note_updated',
      'experience_moderated',
      'experience_archived'
    )
  );

-- Moderation decisions operate on submitted content. Archival is a separate
-- removal action that can only hide the exact approved revision an operator
-- reviewed, and it requires a private rationale for the audit trail.
create or replace function public.moderate_interview_experience_if_revision(
  target_experience_id uuid,
  target_expected_updated_at timestamptz,
  target_status text,
  target_moderation_note text
)
returns table(experience_id uuid, status text, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  prior_status text;
  normalized_note text := nullif(pg_catalog.btrim(target_moderation_note), '');
  saved_experience_id uuid;
  saved_status text;
  saved_updated_at timestamptz;
begin
  if not public.is_current_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if target_experience_id is null
    or target_expected_updated_at is null
    or target_status is null
    or target_status not in ('needs_changes', 'approved', 'rejected', 'archived')
    or pg_catalog.char_length(coalesce(normalized_note, '')) > 1000
    or (target_status = 'archived' and normalized_note is null) then
    raise exception 'Invalid interview experience moderation input' using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('interview-experience:' || target_experience_id::text, 0)
  );

  select experience.status
  into prior_status
  from public.interview_experiences as experience
  where experience.id = target_experience_id
    and experience.updated_at = target_expected_updated_at
  for update;

  if not found
    or (
      target_status = 'archived'
      and prior_status <> 'approved'
    )
    or (
      target_status <> 'archived'
      and prior_status not in ('submitted', 'needs_changes')
    ) then
    return;
  end if;

  update public.interview_experiences as experience
  set status = target_status,
      review_note = normalized_note,
      reviewed_at = pg_catalog.transaction_timestamp()
  where experience.id = target_experience_id
    and experience.updated_at = target_expected_updated_at
  returning experience.id, experience.status, experience.updated_at
  into saved_experience_id, saved_status, saved_updated_at;

  if saved_experience_id is null then
    return;
  end if;

  insert into public.admin_audit_events (
    admin_actor_id,
    action_type,
    target_type,
    target_id,
    prior_status,
    new_status
  ) values (
    actor_id,
    case
      when saved_status = 'archived' then 'experience_archived'
      else 'experience_moderated'
    end,
    'interview_experience',
    saved_experience_id,
    prior_status,
    saved_status
  );

  return query select saved_experience_id, saved_status, saved_updated_at;
end;
$$;

revoke all on function public.moderate_interview_experience_if_revision(uuid,timestamptz,text,text)
  from public, anon, authenticated;
grant execute on function public.moderate_interview_experience_if_revision(uuid,timestamptz,text,text)
  to authenticated;

-- Resolve optional public attribution separately from the safe report
-- projection. A username is returned only while both the report choice and
-- the contributor's current public-profile choice permit it.
create or replace function public.list_public_interview_experience_authors(
  target_experience_ids uuid[]
)
returns table(experience_id uuid, username text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if target_experience_ids is null
    or coalesce(pg_catalog.array_length(target_experience_ids, 1), 0) not between 1 and 100
    or pg_catalog.array_position(target_experience_ids, null) is not null then
    raise exception 'Invalid public interview experience identifiers' using errcode = '23514';
  end if;

  return query
  select experience.id, profile.username
  from public.interview_experiences as experience
  join public.profiles as profile on profile.id = experience.author_id
  where experience.id = any(target_experience_ids)
    and experience.status = 'approved'
    and experience.publication_consent
    and experience.public_identity = 'username'
    and profile.is_public
    and profile.onboarding_complete
    and profile.username is not null
  order by experience.id;
end;
$$;

revoke all on function public.list_public_interview_experience_authors(uuid[])
  from public, anon, authenticated;
grant execute on function public.list_public_interview_experience_authors(uuid[])
  to anon, authenticated;

commit;
