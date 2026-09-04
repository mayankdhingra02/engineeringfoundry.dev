begin;

-- Story edits use updated_at as an aggregate revision. Advance it monotonically
-- even when multiple writes occur inside one transaction or after lock waits.
create or replace function public.set_behavioral_story_updated_at()
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

revoke all on function public.set_behavioral_story_updated_at() from public, anon, authenticated;

drop trigger if exists behavioral_stories_set_updated_at on public.behavioral_stories;
create trigger behavioral_stories_set_updated_at
before update on public.behavioral_stories
for each row execute function public.set_behavioral_story_updated_at();

create or replace function public.normalize_behavioral_story_themes(theme_values text[])
returns text[]
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  normalized_themes text[];
begin
  if theme_values is null then
    raise exception 'Story themes are required' using errcode = '23514';
  end if;
  if cardinality(theme_values) > 20 then
    raise exception 'Too many story themes' using errcode = '23514';
  end if;

  if exists (
    select 1
    from unnest(theme_values) as supplied(theme)
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
    raise exception 'Story themes are invalid' using errcode = '23514';
  end if;

  select coalesce(
    array_agg(distinct btrim(supplied.theme) order by btrim(supplied.theme)),
    array[]::text[]
  )
  into normalized_themes
  from unnest(theme_values) as supplied(theme);

  if cardinality(normalized_themes) > 20 then
    raise exception 'Too many story themes' using errcode = '23514';
  end if;

  return normalized_themes;
end;
$$;

revoke all on function public.normalize_behavioral_story_themes(text[]) from public, anon, authenticated;

create or replace function public.create_behavioral_story_with_themes(
  target_title text,
  target_company_or_context text,
  target_role text,
  target_approximate_period text,
  target_project text,
  target_situation text,
  target_task text,
  target_action text,
  target_result text,
  target_reflection text,
  target_short_summary text,
  target_notes text,
  target_themes text[]
)
returns table(story_id uuid, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_themes text[];
  saved_story_id uuid;
  saved_updated_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  normalized_themes := public.normalize_behavioral_story_themes(target_themes);

  insert into public.behavioral_stories (
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
    notes
  ) values (
    current_user_id,
    btrim(target_title),
    nullif(btrim(target_company_or_context), ''),
    nullif(btrim(target_role), ''),
    nullif(btrim(target_approximate_period), ''),
    nullif(btrim(target_project), ''),
    nullif(btrim(target_situation), ''),
    nullif(btrim(target_task), ''),
    nullif(btrim(target_action), ''),
    nullif(btrim(target_result), ''),
    nullif(btrim(target_reflection), ''),
    nullif(btrim(target_short_summary), ''),
    nullif(btrim(target_notes), '')
  )
  returning behavioral_stories.id, behavioral_stories.updated_at
  into saved_story_id, saved_updated_at;

  insert into public.behavioral_story_themes (user_id, story_id, theme)
  select current_user_id, saved_story_id, supplied.theme
  from unnest(normalized_themes) as supplied(theme);

  story_id := saved_story_id;
  updated_at := saved_updated_at;
  return next;
end;
$$;

create or replace function public.update_behavioral_story_with_themes_if_revision(
  target_story_id uuid,
  target_expected_updated_at timestamptz,
  target_title text,
  target_company_or_context text,
  target_role text,
  target_approximate_period text,
  target_project text,
  target_situation text,
  target_task text,
  target_action text,
  target_result text,
  target_reflection text,
  target_short_summary text,
  target_notes text,
  target_themes text[]
)
returns table(story_id uuid, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_themes text[];
  saved_story_id uuid;
  saved_updated_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_story_id is null or target_expected_updated_at is null then
    raise exception 'Expected story revision is required' using errcode = '23514';
  end if;

  normalized_themes := public.normalize_behavioral_story_themes(target_themes);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(target_story_id::text)
  );

  update public.behavioral_stories as story
  set
    title = btrim(target_title),
    company_or_context = nullif(btrim(target_company_or_context), ''),
    role = nullif(btrim(target_role), ''),
    approximate_period = nullif(btrim(target_approximate_period), ''),
    project = nullif(btrim(target_project), ''),
    situation = nullif(btrim(target_situation), ''),
    task = nullif(btrim(target_task), ''),
    action = nullif(btrim(target_action), ''),
    result = nullif(btrim(target_result), ''),
    reflection = nullif(btrim(target_reflection), ''),
    short_summary = nullif(btrim(target_short_summary), ''),
    notes = nullif(btrim(target_notes), '')
  where story.id = target_story_id
    and story.user_id = current_user_id
    and story.updated_at = target_expected_updated_at
  returning story.id, story.updated_at
  into saved_story_id, saved_updated_at;

  if saved_story_id is null then
    return;
  end if;

  delete from public.behavioral_story_themes as theme
  where theme.story_id = saved_story_id
    and theme.user_id = current_user_id;

  insert into public.behavioral_story_themes (user_id, story_id, theme)
  select current_user_id, saved_story_id, supplied.theme
  from unnest(normalized_themes) as supplied(theme);

  story_id := saved_story_id;
  updated_at := saved_updated_at;
  return next;
end;
$$;

create or replace function public.duplicate_behavioral_story_with_themes(
  target_story_id uuid
)
returns table(story_id uuid, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  source_story public.behavioral_stories%rowtype;
  saved_story_id uuid;
  saved_updated_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_story_id is null then
    raise exception 'Story identifier is required' using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(target_story_id::text)
  );

  select story.*
  into source_story
  from public.behavioral_stories as story
  where story.id = target_story_id
    and story.user_id = current_user_id
  for update;

  if not found then
    return;
  end if;

  insert into public.behavioral_stories (
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
    notes
  ) values (
    current_user_id,
    left(source_story.title, 193) || ' (copy)',
    source_story.company_or_context,
    source_story.role,
    source_story.approximate_period,
    source_story.project,
    source_story.situation,
    source_story.task,
    source_story.action,
    source_story.result,
    source_story.reflection,
    source_story.short_summary,
    source_story.notes
  )
  returning behavioral_stories.id, behavioral_stories.updated_at
  into saved_story_id, saved_updated_at;

  insert into public.behavioral_story_themes (user_id, story_id, theme)
  select current_user_id, saved_story_id, source_theme.theme
  from public.behavioral_story_themes as source_theme
  where source_theme.story_id = target_story_id
    and source_theme.user_id = current_user_id;

  story_id := saved_story_id;
  updated_at := saved_updated_at;
  return next;
end;
$$;

revoke all on function public.create_behavioral_story_with_themes(text,text,text,text,text,text,text,text,text,text,text,text,text[]) from public, anon, authenticated;
revoke all on function public.update_behavioral_story_with_themes_if_revision(uuid,timestamptz,text,text,text,text,text,text,text,text,text,text,text,text,text[]) from public, anon, authenticated;
revoke all on function public.duplicate_behavioral_story_with_themes(uuid) from public, anon, authenticated;
grant execute on function public.create_behavioral_story_with_themes(text,text,text,text,text,text,text,text,text,text,text,text,text[]) to authenticated;
grant execute on function public.update_behavioral_story_with_themes_if_revision(uuid,timestamptz,text,text,text,text,text,text,text,text,text,text,text,text,text[]) to authenticated;
grant execute on function public.duplicate_behavioral_story_with_themes(uuid) to authenticated;

-- Migration-first deployments make old create/update/duplicate clients fail
-- before a parent row can be partially written. Story deletion remains a
-- direct owner-scoped operation for the unchanged delete action.
revoke insert, update on table public.behavioral_stories from authenticated;
revoke insert (
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
) on public.behavioral_stories from authenticated;
revoke update (
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
) on public.behavioral_stories from authenticated;

revoke insert, update, delete on table public.behavioral_story_themes from authenticated;
revoke insert (user_id, story_id, theme) on public.behavioral_story_themes from authenticated;

-- Keep the legacy signature callable by authenticated old clients, but make it
-- a stable no-mutation failure rather than an aggregate-bypassing theme write.
create or replace function public.replace_behavioral_story_themes(
  target_story_id uuid,
  theme_values text[]
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform target_story_id, theme_values;
  raise exception 'Atomic Behavioral story saving is required' using errcode = '0A000';
end;
$$;

revoke all on function public.replace_behavioral_story_themes(uuid,text[]) from public, anon, authenticated;
grant execute on function public.replace_behavioral_story_themes(uuid,text[]) to authenticated;

commit;
