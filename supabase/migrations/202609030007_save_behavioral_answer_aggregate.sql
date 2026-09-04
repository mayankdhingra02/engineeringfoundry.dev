begin;

-- Behavioral answer edits use updated_at as their aggregate revision. Advance
-- it monotonically so lock waits and rapid successive writes cannot reuse or
-- move a revision backwards.
create or replace function public.set_behavioral_answer_updated_at()
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

revoke all on function public.set_behavioral_answer_updated_at() from public, anon, authenticated;

drop trigger if exists behavioral_answers_set_updated_at on public.behavioral_answers;
create trigger behavioral_answers_set_updated_at
before update on public.behavioral_answers
for each row execute function public.set_behavioral_answer_updated_at();

create or replace function public.create_behavioral_answer_aggregate(
  target_custom_question_id uuid,
  target_curated_question_id text,
  target_story_id uuid,
  target_company_slug text,
  target_application_id uuid,
  target_title text,
  target_answer_text text,
  target_opening_framing text,
  target_details_to_emphasize text,
  target_details_to_avoid text,
  target_notes text,
  target_status text,
  target_make_primary boolean
)
returns table(answer_id uuid, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  question_lock_key text;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if (target_custom_question_id is null) = (target_curated_question_id is null) then
    raise exception 'Exactly one Behavioral question identifier is required' using errcode = '23514';
  end if;
  if target_curated_question_id is not null and not exists (
    select 1 from public.behavioral_curated_questions as question
    where question.id = target_curated_question_id
  ) then
    raise exception 'Behavioral answer relationship is unavailable' using errcode = '23503';
  end if;
  if target_custom_question_id is not null and not exists (
    select 1 from public.behavioral_custom_questions as question
    where question.id = target_custom_question_id
      and question.user_id = current_user_id
  ) then
    raise exception 'Behavioral answer relationship is unavailable' using errcode = '23503';
  end if;
  if target_story_id is null or not exists (
    select 1 from public.behavioral_stories as story
    where story.id = target_story_id
      and story.user_id = current_user_id
  ) then
    raise exception 'Behavioral answer relationship is unavailable' using errcode = '23503';
  end if;
  if target_application_id is not null and not exists (
    select 1 from public.applications as application
    where application.id = target_application_id
      and application.user_id = current_user_id
  ) then
    raise exception 'Behavioral answer relationship is unavailable' using errcode = '23503';
  end if;
  if target_make_primary is null then
    raise exception 'Primary answer state is required' using errcode = '23514';
  end if;
  if target_status is null or target_status not in ('Draft', 'Needs Work', 'Ready', 'Retired') then
    raise exception 'Invalid Behavioral answer status' using errcode = '23514';
  end if;
  if char_length(btrim(coalesce(target_title, ''))) not between 1 and 200 then
    raise exception 'Invalid Behavioral answer title' using errcode = '23514';
  end if;
  if char_length(btrim(coalesce(target_answer_text, ''))) > 50000
    or char_length(btrim(coalesce(target_opening_framing, ''))) > 10000
    or char_length(btrim(coalesce(target_details_to_emphasize, ''))) > 20000
    or char_length(btrim(coalesce(target_details_to_avoid, ''))) > 20000
    or char_length(btrim(coalesce(target_notes, ''))) > 50000
  then
    raise exception 'Behavioral answer text is too long' using errcode = '22001';
  end if;
  if target_application_id is null
    and nullif(btrim(target_company_slug), '') is not null
    and nullif(btrim(target_company_slug), '') !~ '^[a-z0-9][a-z0-9-]{0,79}$'
  then
    raise exception 'Invalid Behavioral answer company' using errcode = '23514';
  end if;

  question_lock_key := case
    when target_curated_question_id is not null then 'curated:' || target_curated_question_id
    else 'custom:' || target_custom_question_id::text
  end;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(question_lock_key)
  );

  if target_make_primary then
    update public.behavioral_answers as answer
    set is_primary = false
    where answer.user_id = current_user_id
      and answer.is_primary
      and answer.custom_question_id is not distinct from target_custom_question_id
      and answer.curated_question_id is not distinct from target_curated_question_id;
  end if;

  return query
  insert into public.behavioral_answers (
    user_id,
    custom_question_id,
    curated_question_id,
    story_id,
    company_slug,
    application_id,
    title,
    answer_text,
    opening_framing,
    details_to_emphasize,
    details_to_avoid,
    notes,
    status,
    is_primary
  ) values (
    current_user_id,
    target_custom_question_id,
    target_curated_question_id,
    target_story_id,
    nullif(btrim(target_company_slug), ''),
    target_application_id,
    btrim(target_title),
    btrim(coalesce(target_answer_text, '')),
    nullif(btrim(target_opening_framing), ''),
    nullif(btrim(target_details_to_emphasize), ''),
    nullif(btrim(target_details_to_avoid), ''),
    nullif(btrim(target_notes), ''),
    target_status,
    target_make_primary
  )
  returning behavioral_answers.id, behavioral_answers.updated_at;
end;
$$;

create or replace function public.update_behavioral_answer_aggregate_if_revision(
  target_answer_id uuid,
  target_expected_updated_at timestamptz,
  target_custom_question_id uuid,
  target_curated_question_id text,
  target_story_id uuid,
  target_company_slug text,
  target_application_id uuid,
  target_title text,
  target_answer_text text,
  target_opening_framing text,
  target_details_to_emphasize text,
  target_details_to_avoid text,
  target_notes text,
  target_status text,
  target_make_primary boolean
)
returns table(answer_id uuid, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  question_lock_key text;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_answer_id is null or target_expected_updated_at is null then
    raise exception 'Expected Behavioral answer revision is required' using errcode = '23514';
  end if;
  if (target_custom_question_id is null) = (target_curated_question_id is null) then
    raise exception 'Exactly one Behavioral question identifier is required' using errcode = '23514';
  end if;
  if target_curated_question_id is not null and not exists (
    select 1 from public.behavioral_curated_questions as question
    where question.id = target_curated_question_id
  ) then
    raise exception 'Behavioral answer relationship is unavailable' using errcode = '23503';
  end if;
  if target_custom_question_id is not null and not exists (
    select 1 from public.behavioral_custom_questions as question
    where question.id = target_custom_question_id
      and question.user_id = current_user_id
  ) then
    raise exception 'Behavioral answer relationship is unavailable' using errcode = '23503';
  end if;
  if target_story_id is null or not exists (
    select 1 from public.behavioral_stories as story
    where story.id = target_story_id
      and story.user_id = current_user_id
  ) then
    raise exception 'Behavioral answer relationship is unavailable' using errcode = '23503';
  end if;
  if target_application_id is not null and not exists (
    select 1 from public.applications as application
    where application.id = target_application_id
      and application.user_id = current_user_id
  ) then
    raise exception 'Behavioral answer relationship is unavailable' using errcode = '23503';
  end if;
  if target_make_primary is null then
    raise exception 'Primary answer state is required' using errcode = '23514';
  end if;
  if target_status is null or target_status not in ('Draft', 'Needs Work', 'Ready', 'Retired') then
    raise exception 'Invalid Behavioral answer status' using errcode = '23514';
  end if;
  if char_length(btrim(coalesce(target_title, ''))) not between 1 and 200 then
    raise exception 'Invalid Behavioral answer title' using errcode = '23514';
  end if;
  if char_length(btrim(coalesce(target_answer_text, ''))) > 50000
    or char_length(btrim(coalesce(target_opening_framing, ''))) > 10000
    or char_length(btrim(coalesce(target_details_to_emphasize, ''))) > 20000
    or char_length(btrim(coalesce(target_details_to_avoid, ''))) > 20000
    or char_length(btrim(coalesce(target_notes, ''))) > 50000
  then
    raise exception 'Behavioral answer text is too long' using errcode = '22001';
  end if;
  if target_application_id is null
    and nullif(btrim(target_company_slug), '') is not null
    and nullif(btrim(target_company_slug), '') !~ '^[a-z0-9][a-z0-9-]{0,79}$'
  then
    raise exception 'Invalid Behavioral answer company' using errcode = '23514';
  end if;

  question_lock_key := case
    when target_curated_question_id is not null then 'curated:' || target_curated_question_id
    else 'custom:' || target_custom_question_id::text
  end;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(question_lock_key)
  );

  perform 1
  from public.behavioral_answers as answer
  where answer.id = target_answer_id
    and answer.user_id = current_user_id
    and answer.custom_question_id is not distinct from target_custom_question_id
    and answer.curated_question_id is not distinct from target_curated_question_id
    and answer.updated_at = target_expected_updated_at
  for update;
  if not found then
    return;
  end if;

  if target_make_primary then
    update public.behavioral_answers as answer
    set is_primary = false
    where answer.user_id = current_user_id
      and answer.id <> target_answer_id
      and answer.is_primary
      and answer.custom_question_id is not distinct from target_custom_question_id
      and answer.curated_question_id is not distinct from target_curated_question_id;
  end if;

  return query
  update public.behavioral_answers as answer
  set
    story_id = target_story_id,
    company_slug = nullif(btrim(target_company_slug), ''),
    application_id = target_application_id,
    title = btrim(target_title),
    answer_text = btrim(coalesce(target_answer_text, '')),
    opening_framing = nullif(btrim(target_opening_framing), ''),
    details_to_emphasize = nullif(btrim(target_details_to_emphasize), ''),
    details_to_avoid = nullif(btrim(target_details_to_avoid), ''),
    notes = nullif(btrim(target_notes), ''),
    status = target_status,
    is_primary = target_make_primary
  where answer.id = target_answer_id
    and answer.user_id = current_user_id
    and answer.custom_question_id is not distinct from target_custom_question_id
    and answer.curated_question_id is not distinct from target_curated_question_id
    and answer.updated_at = target_expected_updated_at
  returning answer.id, answer.updated_at;
end;
$$;

revoke all on function public.create_behavioral_answer_aggregate(uuid,text,uuid,text,uuid,text,text,text,text,text,text,text,boolean) from public, anon, authenticated;
revoke all on function public.update_behavioral_answer_aggregate_if_revision(uuid,timestamptz,uuid,text,uuid,text,uuid,text,text,text,text,text,text,text,boolean) from public, anon, authenticated;
grant execute on function public.create_behavioral_answer_aggregate(uuid,text,uuid,text,uuid,text,text,text,text,text,text,text,boolean) to authenticated;
grant execute on function public.update_behavioral_answer_aggregate_if_revision(uuid,timestamptz,uuid,text,uuid,text,uuid,text,text,text,text,text,text,text,boolean) to authenticated;

-- Migration-first deployments make old create/update clients fail before an
-- answer row can be partially written. Owner-scoped SELECT and DELETE remain
-- available for the unchanged read and delete paths.
revoke insert, update on table public.behavioral_answers from authenticated;
revoke insert (
  user_id,
  custom_question_id,
  curated_question_id,
  story_id,
  company_slug,
  application_id,
  title,
  answer_text,
  opening_framing,
  details_to_emphasize,
  details_to_avoid,
  notes,
  status
) on public.behavioral_answers from authenticated;
revoke update (
  story_id,
  company_slug,
  application_id,
  title,
  answer_text,
  opening_framing,
  details_to_emphasize,
  details_to_avoid,
  notes,
  status
) on public.behavioral_answers from authenticated;

-- Keep the legacy signature callable by authenticated old clients, but make it
-- a stable no-mutation failure rather than an aggregate-bypassing primary write.
create or replace function public.set_behavioral_primary_answer(
  target_answer_id uuid,
  make_primary boolean default true
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform target_answer_id, make_primary;
  raise exception 'Atomic Behavioral answer saving is required' using errcode = '0A000';
end;
$$;

revoke all on function public.set_behavioral_primary_answer(uuid,boolean) from public, anon, authenticated;
grant execute on function public.set_behavioral_primary_answer(uuid,boolean) to authenticated;

commit;
