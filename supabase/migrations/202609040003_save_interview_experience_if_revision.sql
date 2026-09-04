begin;

-- The parent row is the revision for the report and its ordered round snapshot.
-- Advance it monotonically so rapid saves and lock waits cannot reuse a revision.
create or replace function public.set_interview_experience_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := greatest(
    pg_catalog.clock_timestamp(),
    old.updated_at + interval '1 microsecond'
  );
  return new;
end;
$$;

revoke all on function public.set_interview_experience_updated_at()
  from public, anon, authenticated;

drop trigger if exists interview_experiences_set_updated_at
  on public.interview_experiences;
create trigger interview_experiences_set_updated_at
before update on public.interview_experiences
for each row execute function public.set_interview_experience_updated_at();

create or replace function public.normalize_interview_experience_rounds(target_rounds jsonb)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  round_item jsonb;
  topic_item jsonb;
  normalized_topics jsonb;
  normalized_rounds jsonb := '[]'::jsonb;
  normalized_round_type text;
  normalized_process_notes text;
begin
  if target_rounds is null
    or pg_catalog.jsonb_typeof(target_rounds) <> 'array'
    or pg_catalog.jsonb_array_length(target_rounds) > 20 then
    raise exception 'Invalid interview experience rounds' using errcode = '23514';
  end if;

  for round_item in select value from pg_catalog.jsonb_array_elements(target_rounds)
  loop
    if pg_catalog.jsonb_typeof(round_item) <> 'object'
      or not (round_item ? 'round_type')
      or not (round_item ? 'topic_labels')
      or round_item - 'round_type' - 'topic_labels' - 'process_notes' <> '{}'::jsonb
      or pg_catalog.jsonb_typeof(round_item -> 'round_type') <> 'string'
      or pg_catalog.jsonb_typeof(round_item -> 'topic_labels') <> 'array'
      or pg_catalog.jsonb_array_length(round_item -> 'topic_labels') > 12
      or (
        round_item ? 'process_notes'
        and pg_catalog.jsonb_typeof(round_item -> 'process_notes') not in ('string', 'null')
      ) then
      raise exception 'Invalid interview experience round' using errcode = '23514';
    end if;

    normalized_round_type := pg_catalog.btrim(round_item ->> 'round_type');
    normalized_process_notes := nullif(pg_catalog.btrim(round_item ->> 'process_notes'), '');
    if pg_catalog.char_length(normalized_round_type) not between 1 and 80
      or pg_catalog.char_length(coalesce(normalized_process_notes, '')) > 1500 then
      raise exception 'Invalid interview experience round' using errcode = '23514';
    end if;

    normalized_topics := '[]'::jsonb;
    for topic_item in select value from pg_catalog.jsonb_array_elements(round_item -> 'topic_labels')
    loop
      if pg_catalog.jsonb_typeof(topic_item) <> 'string'
        or pg_catalog.char_length(pg_catalog.btrim(topic_item #>> '{}')) not between 1 and 80 then
        raise exception 'Invalid interview experience topic' using errcode = '23514';
      end if;
      normalized_topics := normalized_topics || pg_catalog.jsonb_build_array(pg_catalog.btrim(topic_item #>> '{}'));
    end loop;

    normalized_rounds := normalized_rounds || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'round_type', normalized_round_type,
        'topic_labels', normalized_topics,
        'process_notes', normalized_process_notes
      )
    );
  end loop;

  return normalized_rounds;
end;
$$;

revoke all on function public.normalize_interview_experience_rounds(jsonb)
  from public, anon, authenticated;

create or replace function public.save_interview_experience_if_revision(
  target_experience_id uuid,
  target_expect_absent boolean,
  target_expected_updated_at timestamptz,
  target_submit boolean,
  target_company_name text,
  target_role_title text,
  target_role_level text,
  target_region text,
  target_interview_date date,
  target_summary text,
  target_preparation_lessons text,
  target_public_identity text,
  target_publication_consent boolean,
  target_rounds jsonb
)
returns table(experience_id uuid, status text, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_rounds jsonb;
  normalized_company_name text := pg_catalog.btrim(target_company_name);
  normalized_role_title text := pg_catalog.btrim(target_role_title);
  normalized_role_level text := nullif(pg_catalog.btrim(target_role_level), '');
  normalized_region text := nullif(pg_catalog.btrim(target_region), '');
  normalized_summary text := pg_catalog.btrim(target_summary);
  normalized_lessons text := nullif(pg_catalog.btrim(target_preparation_lessons), '');
  desired_status text;
  saved_experience_id uuid;
  saved_status text;
  saved_updated_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_experience_id is null
    or target_expect_absent is null
    or target_submit is null
    or (target_expect_absent and target_expected_updated_at is not null)
    or (not target_expect_absent and target_expected_updated_at is null) then
    raise exception 'Exactly one interview experience revision state is required'
      using errcode = '23514';
  end if;
  if normalized_company_name is null
    or normalized_role_title is null
    or normalized_summary is null
    or pg_catalog.char_length(normalized_company_name) not between 1 and 120
    or pg_catalog.char_length(normalized_role_title) not between 1 and 160
    or pg_catalog.char_length(coalesce(normalized_region, '')) > 120
    or pg_catalog.char_length(normalized_summary) > 4000
    or pg_catalog.char_length(coalesce(normalized_lessons, '')) > 3000 then
    raise exception 'Invalid interview experience text' using errcode = '23514';
  end if;
  if normalized_role_level is not null
    and normalized_role_level not in ('Entry', 'Mid', 'Senior', 'Staff+', 'Management', 'Prefer not to say') then
    raise exception 'Invalid interview experience role level' using errcode = '23514';
  end if;
  if target_public_identity is null or target_public_identity not in ('anonymous', 'username') then
    raise exception 'Invalid interview experience public identity' using errcode = '23514';
  end if;
  if target_publication_consent is null then
    raise exception 'Interview experience publication consent is required' using errcode = '23514';
  end if;
  if target_interview_date is not null and target_interview_date < date '0001-01-01' then
    raise exception 'Invalid interview experience date' using errcode = '23514';
  end if;
  if target_submit and (
    pg_catalog.char_length(normalized_summary) < 40
    or not target_publication_consent
  ) then
    raise exception 'Submitted interview experience is incomplete' using errcode = '23514';
  end if;

  normalized_rounds := public.normalize_interview_experience_rounds(target_rounds);
  desired_status := case when target_submit then 'submitted' else 'draft' end;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('interview-experience:' || target_experience_id::text, 0)
  );

  if target_expect_absent then
    insert into public.interview_experiences as experience (
      id,
      author_id,
      status,
      company_name,
      role_title,
      role_level,
      region,
      interview_date,
      summary,
      preparation_lessons,
      public_identity,
      publication_consent,
      submitted_at,
      review_note
    ) values (
      target_experience_id,
      current_user_id,
      desired_status,
      normalized_company_name,
      normalized_role_title,
      normalized_role_level,
      normalized_region,
      target_interview_date,
      normalized_summary,
      normalized_lessons,
      target_public_identity,
      target_publication_consent,
      case when target_submit then pg_catalog.transaction_timestamp() else null end,
      null
    )
    on conflict (id) do nothing
    returning experience.id, experience.status, experience.updated_at
    into saved_experience_id, saved_status, saved_updated_at;
  else
    update public.interview_experiences as experience
    set status = desired_status,
        company_name = normalized_company_name,
        role_title = normalized_role_title,
        role_level = normalized_role_level,
        region = normalized_region,
        interview_date = target_interview_date,
        summary = normalized_summary,
        preparation_lessons = normalized_lessons,
        public_identity = target_public_identity,
        publication_consent = target_publication_consent,
        submitted_at = case when target_submit then pg_catalog.transaction_timestamp() else null end,
        review_note = case when target_submit then null else experience.review_note end
    where experience.id = target_experience_id
      and experience.author_id = current_user_id
      and experience.updated_at = target_expected_updated_at
      and experience.status in ('draft', 'needs_changes', 'withdrawn')
    returning experience.id, experience.status, experience.updated_at
    into saved_experience_id, saved_status, saved_updated_at;
  end if;

  if saved_experience_id is null then
    return;
  end if;

  delete from public.interview_experience_rounds as round_item
  where round_item.experience_id = saved_experience_id;

  insert into public.interview_experience_rounds (
    experience_id,
    "position",
    round_type,
    topic_labels,
    process_notes
  )
  select
    saved_experience_id,
    ordered.ordinal::smallint,
    ordered.round_item ->> 'round_type',
    array(
      select topic_item #>> '{}'
      from pg_catalog.jsonb_array_elements(ordered.round_item -> 'topic_labels') as topic_item
    ),
    nullif(ordered.round_item ->> 'process_notes', '')
  from pg_catalog.jsonb_array_elements(normalized_rounds)
    with ordinality as ordered(round_item, ordinal);

  return query select saved_experience_id, saved_status, saved_updated_at;
end;
$$;

create or replace function public.manage_interview_experience_if_revision(
  target_experience_id uuid,
  target_expected_updated_at timestamptz,
  target_action text
)
returns table(experience_id uuid, status text, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_experience_id uuid;
  saved_status text;
  saved_updated_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_experience_id is null or target_expected_updated_at is null
    or target_action is null or target_action not in ('withdraw', 'delete') then
    raise exception 'Invalid interview experience management input' using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('interview-experience:' || target_experience_id::text, 0)
  );

  if target_action = 'withdraw' then
    update public.interview_experiences as experience
    set status = 'withdrawn'
    where experience.id = target_experience_id
      and experience.author_id = current_user_id
      and experience.updated_at = target_expected_updated_at
      and experience.status in ('draft', 'submitted', 'needs_changes', 'approved')
    returning experience.id, experience.status, experience.updated_at
    into saved_experience_id, saved_status, saved_updated_at;
  else
    delete from public.interview_experiences as experience
    where experience.id = target_experience_id
      and experience.author_id = current_user_id
      and experience.updated_at = target_expected_updated_at
      and experience.status in ('draft', 'withdrawn', 'rejected')
    returning experience.id, 'deleted', experience.updated_at
    into saved_experience_id, saved_status, saved_updated_at;
  end if;

  if saved_experience_id is null then
    return;
  end if;
  return query select saved_experience_id, saved_status, saved_updated_at;
end;
$$;

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
  if target_experience_id is null or target_expected_updated_at is null
    or target_status is null or target_status not in ('needs_changes', 'approved', 'rejected')
    or pg_catalog.char_length(coalesce(normalized_note, '')) > 1000 then
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

  if not found or prior_status not in ('submitted', 'needs_changes') then
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
    'experience_moderated',
    'interview_experience',
    saved_experience_id,
    prior_status,
    saved_status
  );

  return query select saved_experience_id, saved_status, saved_updated_at;
end;
$$;

revoke all on function public.save_interview_experience_if_revision(uuid,boolean,timestamptz,boolean,text,text,text,text,date,text,text,text,boolean,jsonb)
  from public, anon, authenticated;
revoke all on function public.manage_interview_experience_if_revision(uuid,timestamptz,text)
  from public, anon, authenticated;
revoke all on function public.moderate_interview_experience_if_revision(uuid,timestamptz,text,text)
  from public, anon, authenticated;
grant execute on function public.save_interview_experience_if_revision(uuid,boolean,timestamptz,boolean,text,text,text,text,date,text,text,text,boolean,jsonb)
  to authenticated;
grant execute on function public.manage_interview_experience_if_revision(uuid,timestamptz,text)
  to authenticated;
grant execute on function public.moderate_interview_experience_if_revision(uuid,timestamptz,text,text)
  to authenticated;

-- Migration-first rollout: all already-loaded clients retain callable legacy
-- signatures but fail before mutating report content or lifecycle state.
create or replace function public.save_interview_experience_draft(target_id uuid, payload jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform target_id, payload;
  raise exception 'Revision-checked interview experience saving is required'
    using errcode = '0A000';
end;
$$;

create or replace function public.submit_interview_experience(target_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform target_id;
  raise exception 'Revision-checked interview experience submission is required'
    using errcode = '0A000';
end;
$$;

create or replace function public.withdraw_interview_experience(target_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform target_id;
  raise exception 'Revision-checked interview experience management is required'
    using errcode = '0A000';
end;
$$;

create or replace function public.delete_interview_experience(target_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform target_id;
  raise exception 'Revision-checked interview experience management is required'
    using errcode = '0A000';
end;
$$;

create or replace function public.moderate_interview_experience(
  target_id uuid,
  next_status text,
  moderation_note text default null
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform target_id, next_status, moderation_note;
  raise exception 'Revision-checked interview experience moderation is required'
    using errcode = '0A000';
end;
$$;

revoke all on function public.save_interview_experience_draft(uuid,jsonb)
  from public, anon, authenticated;
revoke all on function public.submit_interview_experience(uuid)
  from public, anon, authenticated;
revoke all on function public.withdraw_interview_experience(uuid)
  from public, anon, authenticated;
revoke all on function public.delete_interview_experience(uuid)
  from public, anon, authenticated;
revoke all on function public.moderate_interview_experience(uuid,text,text)
  from public, anon, authenticated;
grant execute on function public.save_interview_experience_draft(uuid,jsonb) to authenticated;
grant execute on function public.submit_interview_experience(uuid) to authenticated;
grant execute on function public.withdraw_interview_experience(uuid) to authenticated;
grant execute on function public.delete_interview_experience(uuid) to authenticated;
grant execute on function public.moderate_interview_experience(uuid,text,text) to authenticated;

notify pgrst, 'reload schema';

commit;
