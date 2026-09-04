begin;

-- Diagnostic settings are the aggregate revision for the settings row and
-- its three normalized child collections. Advance the revision monotonically
-- so rapid saves and lock waits can never reuse or move a successful revision
-- backwards.
create or replace function public.set_interview_playbook_diagnostic_settings_updated_at()
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

revoke all on function public.set_interview_playbook_diagnostic_settings_updated_at()
  from public, anon, authenticated;

drop trigger if exists interview_playbook_diagnostic_settings_set_updated_at
  on public.interview_playbook_diagnostic_settings;
create trigger interview_playbook_diagnostic_settings_set_updated_at
before update on public.interview_playbook_diagnostic_settings
for each row execute function public.set_interview_playbook_diagnostic_settings_updated_at();

-- Return exactly one owner-derived aggregate from one SQL statement. The
-- single statement snapshot prevents a caller from pairing a new settings
-- revision with child rows from an older aggregate. A missing settings row is
-- represented explicitly and never confused with a saved neutral form.
create or replace function public.get_interview_playbook_diagnostic_inputs_snapshot()
returns table(
  has_saved_inputs boolean,
  available_hours_per_week numeric,
  confidence_entries jsonb,
  priority_areas text[],
  constraint_entries jsonb,
  behavioral_stories_coverage text,
  project_deep_dive_coverage text,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  return query
  select
    settings.user_id is not null,
    settings.available_hours_per_week,
    coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'area', confidence.area,
          'confidence', confidence.confidence
        )
        order by case confidence.area
          when 'algorithmic-coding' then 1
          when 'practical-coding' then 2
          when 'debugging' then 3
          when 'code-review' then 4
          when 'low-level-design' then 5
          when 'system-design' then 6
          when 'ml-system-design' then 7
          when 'behavioral' then 8
          when 'project-deep-dive' then 9
          else 10
        end
      )
      from public.interview_playbook_confidence as confidence
      where confidence.user_id = current_user_id
    ), '[]'::jsonb),
    coalesce((
      select pg_catalog.array_agg(priority.area order by priority."position")
      from public.interview_playbook_priorities as priority
      where priority.user_id = current_user_id
    ), '{}'::text[]),
    coalesce((
      select pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
          'id', diagnostic_constraint.id,
          'category', diagnostic_constraint.category,
          'description', diagnostic_constraint.description
        )
        order by diagnostic_constraint."position"
      )
      from public.interview_playbook_constraints as diagnostic_constraint
      where diagnostic_constraint.user_id = current_user_id
    ), '[]'::jsonb),
    coalesce(settings.behavioral_stories_coverage, 'unknown'),
    coalesce(settings.project_deep_dive_coverage, 'unknown'),
    settings.updated_at
  from (select current_user_id as user_id) as owner
  left join public.interview_playbook_diagnostic_settings as settings
    on settings.user_id = owner.user_id;
end;
$$;

revoke all on function public.get_interview_playbook_diagnostic_inputs_snapshot()
  from public, anon, authenticated;
grant execute on function public.get_interview_playbook_diagnostic_inputs_snapshot()
  to authenticated;

create or replace function public.save_interview_playbook_diagnostic_inputs_if_revision(
  target_expect_absent boolean,
  target_expected_updated_at timestamptz,
  available_hours_per_week_value numeric,
  confidence_entries jsonb,
  priority_areas text[],
  constraint_entries jsonb,
  behavioral_stories_coverage_value text,
  project_deep_dive_coverage_value text
)
returns table(updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_updated_at timestamptz;
  entry jsonb;
  entry_area text;
  entry_confidence text;
  entry_category text;
  entry_description text;
  seen_areas text[] := '{}'::text[];
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if target_expect_absent is null
    or (target_expect_absent and target_expected_updated_at is not null)
    or (not target_expect_absent and target_expected_updated_at is null) then
    raise exception 'Exactly one Interview Playbook diagnostic revision state is required'
      using errcode = '23514';
  end if;

  if behavioral_stories_coverage_value is null
    or behavioral_stories_coverage_value not in ('unknown', 'not-started', 'partial', 'covered') then
    raise exception 'Invalid Behavioral coverage value' using errcode = '22023';
  end if;
  if project_deep_dive_coverage_value is null
    or project_deep_dive_coverage_value not in ('unknown', 'not-started', 'partial', 'covered') then
    raise exception 'Invalid Project Deep Dive coverage value' using errcode = '22023';
  end if;
  if available_hours_per_week_value is not null
    and (available_hours_per_week_value < 0 or available_hours_per_week_value > 168) then
    raise exception 'Invalid available hours per week' using errcode = '22023';
  end if;

  if confidence_entries is null or pg_catalog.jsonb_typeof(confidence_entries) <> 'array' then
    raise exception 'Invalid confidence payload' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_array_length(confidence_entries) > 9 then
    raise exception 'Too many confidence entries' using errcode = '22023';
  end if;
  for entry in select * from pg_catalog.jsonb_array_elements(confidence_entries)
  loop
    if pg_catalog.jsonb_typeof(entry) <> 'object'
      or not (entry ? 'area')
      or not (entry ? 'confidence')
      or entry - 'area' - 'confidence' <> '{}'::jsonb then
      raise exception 'Invalid confidence entry shape' using errcode = '22023';
    end if;
    entry_area := entry ->> 'area';
    entry_confidence := entry ->> 'confidence';
    if entry_area is null or entry_area not in (
      'algorithmic-coding', 'practical-coding', 'debugging', 'code-review', 'low-level-design',
      'system-design', 'ml-system-design', 'behavioral', 'project-deep-dive'
    ) then
      raise exception 'Invalid confidence area' using errcode = '22023';
    end if;
    if entry_confidence is null or entry_confidence not in ('low', 'medium', 'high') then
      raise exception 'Invalid confidence value' using errcode = '22023';
    end if;
    if entry_area = any (seen_areas) then
      raise exception 'Duplicate confidence area' using errcode = '22023';
    end if;
    seen_areas := pg_catalog.array_append(seen_areas, entry_area);
  end loop;

  if priority_areas is null then
    raise exception 'Invalid priority payload' using errcode = '22023';
  end if;
  if pg_catalog.cardinality(priority_areas) > 9 then
    raise exception 'Too many priority areas' using errcode = '22023';
  end if;
  seen_areas := '{}'::text[];
  for entry_area in select pg_catalog.unnest(priority_areas)
  loop
    if entry_area is null or entry_area not in (
      'algorithmic-coding', 'practical-coding', 'debugging', 'code-review', 'low-level-design',
      'system-design', 'ml-system-design', 'behavioral', 'project-deep-dive'
    ) then
      raise exception 'Invalid priority area' using errcode = '22023';
    end if;
    if entry_area = any (seen_areas) then
      raise exception 'Duplicate priority area' using errcode = '22023';
    end if;
    seen_areas := pg_catalog.array_append(seen_areas, entry_area);
  end loop;

  if constraint_entries is null or pg_catalog.jsonb_typeof(constraint_entries) <> 'array' then
    raise exception 'Invalid constraints payload' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_array_length(constraint_entries) > 10 then
    raise exception 'Too many constraints' using errcode = '22023';
  end if;
  for entry in select * from pg_catalog.jsonb_array_elements(constraint_entries)
  loop
    if pg_catalog.jsonb_typeof(entry) <> 'object'
      or not (entry ? 'category')
      or not (entry ? 'description')
      or entry - 'category' - 'description' <> '{}'::jsonb then
      raise exception 'Invalid constraint entry shape' using errcode = '22023';
    end if;
    entry_category := entry ->> 'category';
    entry_description := pg_catalog.btrim(entry ->> 'description');
    if entry_category is null or entry_category not in ('work', 'school', 'health', 'family', 'other') then
      raise exception 'Invalid constraint category' using errcode = '22023';
    end if;
    if entry_description is null or entry_description = '' then
      raise exception 'Constraint description cannot be empty' using errcode = '22023';
    end if;
    if pg_catalog.char_length(entry_description) > 500 then
      raise exception 'Constraint description too long' using errcode = '22023';
    end if;
  end loop;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('interview-playbook-diagnostic-owner:' || current_user_id::text, 0)
  );

  if target_expect_absent then
    insert into public.interview_playbook_diagnostic_settings as settings (
      user_id,
      available_hours_per_week,
      behavioral_stories_coverage,
      project_deep_dive_coverage
    ) values (
      current_user_id,
      available_hours_per_week_value,
      behavioral_stories_coverage_value,
      project_deep_dive_coverage_value
    )
    on conflict (user_id) do nothing
    returning settings.updated_at into saved_updated_at;
  else
    update public.interview_playbook_diagnostic_settings as settings
    set available_hours_per_week = available_hours_per_week_value,
        behavioral_stories_coverage = behavioral_stories_coverage_value,
        project_deep_dive_coverage = project_deep_dive_coverage_value
    where settings.user_id = current_user_id
      and settings.updated_at = target_expected_updated_at
    returning settings.updated_at into saved_updated_at;
  end if;

  if saved_updated_at is null then
    return;
  end if;

  delete from public.interview_playbook_confidence
  where user_id = current_user_id;
  insert into public.interview_playbook_confidence (user_id, area, confidence)
  select current_user_id, entry_row ->> 'area', entry_row ->> 'confidence'
  from pg_catalog.jsonb_array_elements(confidence_entries) as entry_row;

  delete from public.interview_playbook_priorities
  where user_id = current_user_id;
  insert into public.interview_playbook_priorities (user_id, area, "position")
  select current_user_id, ordered.area_value, ordered.ordinal::smallint
  from pg_catalog.unnest(priority_areas) with ordinality as ordered(area_value, ordinal);

  delete from public.interview_playbook_constraints
  where user_id = current_user_id;
  insert into public.interview_playbook_constraints (user_id, category, description, "position")
  select
    current_user_id,
    ordered.entry_row ->> 'category',
    pg_catalog.btrim(ordered.entry_row ->> 'description'),
    ordered.ordinal::smallint
  from pg_catalog.jsonb_array_elements(constraint_entries)
    with ordinality as ordered(entry_row, ordinal);

  return query select saved_updated_at;
end;
$$;

revoke all on function public.save_interview_playbook_diagnostic_inputs_if_revision(boolean,timestamptz,numeric,jsonb,text[],jsonb,text,text)
  from public, anon, authenticated;
grant execute on function public.save_interview_playbook_diagnostic_inputs_if_revision(boolean,timestamptz,numeric,jsonb,text[],jsonb,text,text)
  to authenticated;

-- Migration-first rollout: already-loaded clients retain a callable legacy
-- signature but fail before mutating any part of the aggregate.
create or replace function public.save_interview_playbook_diagnostic_inputs(
  available_hours_per_week_value numeric,
  confidence_entries jsonb,
  priority_areas text[],
  constraint_entries jsonb,
  behavioral_stories_coverage_value text,
  project_deep_dive_coverage_value text
)
returns public.interview_playbook_diagnostic_settings
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform
    available_hours_per_week_value,
    confidence_entries,
    priority_areas,
    constraint_entries,
    behavioral_stories_coverage_value,
    project_deep_dive_coverage_value;
  raise exception 'Revision-checked Interview Playbook diagnostic saving is required'
    using errcode = '0A000';
end;
$$;

revoke all on function public.save_interview_playbook_diagnostic_inputs(numeric,jsonb,text[],jsonb,text,text)
  from public, anon, authenticated;
grant execute on function public.save_interview_playbook_diagnostic_inputs(numeric,jsonb,text[],jsonb,text,text)
  to authenticated;

notify pgrst, 'reload schema';

commit;
