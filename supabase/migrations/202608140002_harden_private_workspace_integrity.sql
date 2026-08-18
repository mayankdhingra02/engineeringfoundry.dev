begin;

-- Composite keys let child records prove that their parent belongs to the same
-- user at the database boundary, rather than relying on application filters.
alter table public.applications
  add constraint applications_id_user_unique unique (id, user_id);

alter table public.behavioral_custom_questions
  add constraint behavioral_custom_questions_id_user_unique unique (id, user_id);

alter table public.behavioral_stories
  add constraint behavioral_stories_id_user_unique unique (id, user_id);

-- Existing rows are preserved, while every new or changed theme must use the
-- vocabulary accepted by StoryForm and the server validation boundary.
alter table public.behavioral_story_themes
  add constraint behavioral_story_themes_catalog check (
    theme in (
      'Leadership',
      'Ownership',
      'Conflict',
      'Failure',
      'Growth',
      'Ambiguity',
      'Influence',
      'Initiative',
      'Execution',
      'Collaboration',
      'Mentorship',
      'Technical challenge',
      'Technical judgment',
      'Customer',
      'Customer impact',
      'Incident response',
      'Cross-functional work'
    )
  ) not valid;

-- Legacy reorders were two independent updates and could leave duplicate or
-- gapped values after a partial failure. Preserve every row while assigning a
-- deterministic contiguous order before enforcing uniqueness.
with normalized_rounds as (
  select
    id,
    row_number() over (
      partition by application_id
      order by round_number, created_at, id
    )::integer as normalized_round_number
  from public.interview_rounds
)
update public.interview_rounds as rounds
set round_number = normalized.normalized_round_number
from normalized_rounds as normalized
where rounds.id = normalized.id
  and rounds.round_number is distinct from normalized.normalized_round_number;

alter table public.interview_rounds
  add constraint interview_rounds_application_owner_fkey
  foreign key (application_id, user_id)
  references public.applications (id, user_id)
  on delete cascade,
  add constraint interview_rounds_application_round_number_unique
  unique (application_id, round_number)
  deferrable initially immediate;

alter table public.behavioral_story_themes
  add constraint behavioral_story_themes_story_owner_fkey
  foreign key (story_id, user_id)
  references public.behavioral_stories (id, user_id)
  on delete cascade;

alter table public.behavioral_story_question_links
  add constraint behavioral_story_links_story_owner_fkey
  foreign key (story_id, user_id)
  references public.behavioral_stories (id, user_id)
  on delete cascade,
  add constraint behavioral_story_links_custom_question_owner_fkey
  foreign key (custom_question_id, user_id)
  references public.behavioral_custom_questions (id, user_id)
  on delete cascade;

alter table public.behavioral_answers
  add constraint behavioral_answers_custom_question_owner_fkey
  foreign key (custom_question_id, user_id)
  references public.behavioral_custom_questions (id, user_id)
  on delete cascade,
  add constraint behavioral_answers_story_owner_fkey
  foreign key (story_id, user_id)
  references public.behavioral_stories (id, user_id)
  on delete set null (story_id),
  add constraint behavioral_answers_application_owner_fkey
  foreign key (application_id, user_id)
  references public.applications (id, user_id)
  on delete set null (application_id);

create or replace function public.replace_behavioral_story_themes(
  target_story_id uuid,
  theme_values text[]
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_themes text[];
begin
  if current_user_id is null or target_story_id is null then
    return false;
  end if;

  if exists (
    select 1
    from unnest(coalesce(theme_values, array[]::text[])) as supplied(theme)
    where supplied.theme is null
      or char_length(btrim(supplied.theme)) not between 1 and 80
      or btrim(supplied.theme) not in (
        'Leadership',
        'Ownership',
        'Conflict',
        'Failure',
        'Growth',
        'Ambiguity',
        'Influence',
        'Initiative',
        'Execution',
        'Collaboration',
        'Mentorship',
        'Technical challenge',
        'Technical judgment',
        'Customer',
        'Customer impact',
        'Incident response',
        'Cross-functional work'
      )
  ) then
    return false;
  end if;

  select coalesce(array_agg(normalized.theme order by normalized.theme), array[]::text[])
  into normalized_themes
  from (
    select distinct btrim(supplied.theme) as theme
    from unnest(coalesce(theme_values, array[]::text[])) as supplied(theme)
  ) as normalized;

  if cardinality(normalized_themes) > 20 then
    return false;
  end if;

  perform 1
  from public.behavioral_stories
  where id = target_story_id
    and user_id = current_user_id
  for update;

  if not found then
    return false;
  end if;

  delete from public.behavioral_story_themes
  where story_id = target_story_id
    and user_id = current_user_id;

  insert into public.behavioral_story_themes (user_id, story_id, theme)
  select current_user_id, target_story_id, normalized.theme
  from unnest(normalized_themes) as normalized(theme);

  return true;
end;
$$;

create or replace function public.move_interview_round(
  target_application_id uuid,
  target_round_id uuid,
  move_direction text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_round_number integer;
  adjacent_round_id uuid;
  adjacent_round_number integer;
  moved_row_count integer;
begin
  if current_user_id is null
    or target_application_id is null
    or target_round_id is null
    or move_direction not in ('up', 'down') then
    return false;
  end if;

  perform 1
  from public.applications
  where id = target_application_id
    and user_id = current_user_id;

  if not found then
    return false;
  end if;

  -- Lock siblings in a stable order so concurrent moves cannot interleave.
  perform 1
  from public.interview_rounds
  where application_id = target_application_id
    and user_id = current_user_id
  order by round_number, created_at, id
  for update;

  select round_number
  into current_round_number
  from public.interview_rounds
  where id = target_round_id
    and application_id = target_application_id
    and user_id = current_user_id;

  if not found then
    return false;
  end if;

  if move_direction = 'up' then
    select id, round_number
    into adjacent_round_id, adjacent_round_number
    from public.interview_rounds
    where application_id = target_application_id
      and user_id = current_user_id
      and round_number < current_round_number
    order by round_number desc, created_at desc, id desc
    limit 1;
  else
    select id, round_number
    into adjacent_round_id, adjacent_round_number
    from public.interview_rounds
    where application_id = target_application_id
      and user_id = current_user_id
      and round_number > current_round_number
    order by round_number, created_at, id
    limit 1;
  end if;

  if adjacent_round_id is null then
    return false;
  end if;

  set constraints public.interview_rounds_application_round_number_unique deferred;

  update public.interview_rounds
  set round_number = case
    when id = target_round_id then adjacent_round_number
    when id = adjacent_round_id then current_round_number
    else round_number
  end
  where id in (target_round_id, adjacent_round_id)
    and application_id = target_application_id
    and user_id = current_user_id;

  get diagnostics moved_row_count = row_count;
  set constraints public.interview_rounds_application_round_number_unique immediate;

  return moved_row_count = 2;
end;
$$;

revoke all on function public.replace_behavioral_story_themes(uuid, text[]) from public;
revoke all on function public.move_interview_round(uuid, uuid, text) from public;
grant execute on function public.replace_behavioral_story_themes(uuid, text[]) to authenticated;
grant execute on function public.move_interview_round(uuid, uuid, text) to authenticated;

-- Keep generated fields and ownership/reference columns out of generic update
-- payloads. RLS remains the final owner check for all permitted columns.
revoke insert, update on table public.applications from authenticated;
grant insert (
  user_id,
  company_name,
  company_slug,
  role_title,
  role_level,
  location,
  job_url,
  application_date,
  source,
  status,
  recruiter_name,
  recruiter_email,
  notes
) on public.applications to authenticated;
grant update (
  company_name,
  company_slug,
  role_title,
  role_level,
  location,
  job_url,
  application_date,
  source,
  status,
  recruiter_name,
  recruiter_email,
  notes
) on public.applications to authenticated;

revoke insert, update on table public.interview_rounds from authenticated;
grant insert (
  application_id,
  user_id,
  round_number,
  round_name,
  round_type,
  scheduled_at,
  duration_minutes,
  timezone,
  interviewer_name,
  interviewer_role,
  meeting_link,
  location,
  status,
  result,
  notes
) on public.interview_rounds to authenticated;
grant update (
  round_number,
  round_name,
  round_type,
  scheduled_at,
  duration_minutes,
  timezone,
  interviewer_name,
  interviewer_role,
  meeting_link,
  location,
  status,
  result,
  notes
) on public.interview_rounds to authenticated;

revoke insert, update on table public.behavioral_custom_questions from authenticated;
grant insert (
  user_id,
  question_text,
  description,
  category,
  company_slug,
  notes
) on public.behavioral_custom_questions to authenticated;
grant update (
  question_text,
  description,
  category,
  company_slug,
  notes
) on public.behavioral_custom_questions to authenticated;

revoke insert, update on table public.behavioral_stories from authenticated;
grant insert (
  user_id,
  title,
  company_or_context,
  role,
  approximate_period,
  project,
  situation,
  task,
  action,
  result,
  reflection,
  short_summary,
  status,
  notes
) on public.behavioral_stories to authenticated;
grant update (
  title,
  company_or_context,
  role,
  approximate_period,
  project,
  situation,
  task,
  action,
  result,
  reflection,
  short_summary,
  status,
  notes
) on public.behavioral_stories to authenticated;

revoke insert, update on table public.behavioral_story_themes from authenticated;
grant insert (
  user_id,
  story_id,
  theme
) on public.behavioral_story_themes to authenticated;

revoke insert, update on table public.behavioral_story_question_links from authenticated;
grant insert (
  user_id,
  story_id,
  custom_question_id,
  curated_question_id,
  relevance,
  notes
) on public.behavioral_story_question_links to authenticated;

revoke insert, update on table public.behavioral_answers from authenticated;
grant insert (
  user_id,
  custom_question_id,
  curated_question_id,
  story_id,
  company_slug,
  application_id,
  title,
  answer_text,
  notes,
  status
) on public.behavioral_answers to authenticated;
grant update (
  story_id,
  company_slug,
  application_id,
  title,
  answer_text,
  notes,
  status
) on public.behavioral_answers to authenticated;

commit;
