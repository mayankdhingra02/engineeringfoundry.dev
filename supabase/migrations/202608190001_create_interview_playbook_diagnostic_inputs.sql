begin;

-- Phase 3B1: user-owned Interview Playbook diagnostic inputs. Four normalized
-- tables (never one opaque JSON blob) so each input class keeps its own
-- validation, ownership, and export shape. None of these columns are
-- performance evidence — that remains Phase 3B2 and later. Direct
-- authenticated writes are intentionally not granted; every save goes
-- through the single atomic RPC below so a partial save can never persist.

create table public.interview_playbook_diagnostic_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  available_hours_per_week numeric(5, 2),
  behavioral_stories_coverage text not null default 'unknown',
  project_deep_dive_coverage text not null default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_playbook_diagnostic_settings_hours check (
    available_hours_per_week is null
    or available_hours_per_week between 0 and 168
  ),
  constraint interview_playbook_diagnostic_settings_behavioral_coverage check (
    behavioral_stories_coverage in ('unknown', 'not-started', 'partial', 'covered')
  ),
  constraint interview_playbook_diagnostic_settings_pdd_coverage check (
    project_deep_dive_coverage in ('unknown', 'not-started', 'partial', 'covered')
  )
);

create table public.interview_playbook_confidence (
  user_id uuid not null references public.profiles(id) on delete cascade,
  area text not null,
  confidence text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, area),
  constraint interview_playbook_confidence_area check (
    area in (
      'algorithmic-coding', 'practical-coding', 'debugging', 'code-review', 'low-level-design',
      'system-design', 'ml-system-design', 'behavioral', 'project-deep-dive'
    )
  ),
  -- 'unknown' is never stored: a missing row already means unknown, which is
  -- what keeps an explicit self-report distinguishable from default absence.
  constraint interview_playbook_confidence_value check (
    confidence in ('low', 'medium', 'high')
  )
);

create table public.interview_playbook_priorities (
  user_id uuid not null references public.profiles(id) on delete cascade,
  area text not null,
  "position" smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, area),
  unique (user_id, "position"),
  constraint interview_playbook_priorities_area check (
    area in (
      'algorithmic-coding', 'practical-coding', 'debugging', 'code-review', 'low-level-design',
      'system-design', 'ml-system-design', 'behavioral', 'project-deep-dive'
    )
  ),
  constraint interview_playbook_priorities_position check (
    "position" between 1 and 9
  )
);

create table public.interview_playbook_constraints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  description text not null,
  "position" smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, "position"),
  constraint interview_playbook_constraints_category check (
    category in ('work', 'school', 'health', 'family', 'other')
  ),
  -- Planning context only: no severity, impact score, hours-lost, medical, disability, or productivity field.
  constraint interview_playbook_constraints_description check (
    btrim(description) <> '' and char_length(description) <= 500
  ),
  constraint interview_playbook_constraints_position check (
    "position" between 1 and 10
  )
);

create index interview_playbook_priorities_user_position_idx
  on public.interview_playbook_priorities (user_id, "position");
create index interview_playbook_constraints_user_position_idx
  on public.interview_playbook_constraints (user_id, "position");

create trigger interview_playbook_diagnostic_settings_set_updated_at
before update on public.interview_playbook_diagnostic_settings
for each row execute function public.set_updated_at();

create trigger interview_playbook_confidence_set_updated_at
before update on public.interview_playbook_confidence
for each row execute function public.set_updated_at();

create trigger interview_playbook_priorities_set_updated_at
before update on public.interview_playbook_priorities
for each row execute function public.set_updated_at();

create trigger interview_playbook_constraints_set_updated_at
before update on public.interview_playbook_constraints
for each row execute function public.set_updated_at();

-- Single atomic entry point for the whole diagnostic form. Ownership is
-- always derived from auth.uid() — the function never accepts a user id,
-- and every validation below is re-checked here even though the table
-- constraints already enforce it, because client input must never be
-- trusted to have already passed them.
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
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  saved public.interview_playbook_diagnostic_settings%rowtype;
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

  if behavioral_stories_coverage_value not in ('unknown', 'not-started', 'partial', 'covered') then
    raise exception 'Invalid Behavioral coverage value' using errcode = '22023';
  end if;
  if project_deep_dive_coverage_value not in ('unknown', 'not-started', 'partial', 'covered') then
    raise exception 'Invalid Project Deep Dive coverage value' using errcode = '22023';
  end if;
  if available_hours_per_week_value is not null
    and (available_hours_per_week_value < 0 or available_hours_per_week_value > 168) then
    raise exception 'Invalid available hours per week' using errcode = '22023';
  end if;

  if confidence_entries is null then
    confidence_entries := '[]'::jsonb;
  end if;
  if jsonb_typeof(confidence_entries) <> 'array' then
    raise exception 'Invalid confidence payload' using errcode = '22023';
  end if;
  if jsonb_array_length(confidence_entries) > 9 then
    raise exception 'Too many confidence entries' using errcode = '22023';
  end if;
  for entry in select * from jsonb_array_elements(confidence_entries)
  loop
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
    seen_areas := array_append(seen_areas, entry_area);
  end loop;

  if priority_areas is null then
    priority_areas := '{}';
  end if;
  if array_length(priority_areas, 1) is not null and array_length(priority_areas, 1) > 9 then
    raise exception 'Too many priority areas' using errcode = '22023';
  end if;
  seen_areas := '{}';
  for entry_area in select unnest(priority_areas)
  loop
    if entry_area not in (
      'algorithmic-coding', 'practical-coding', 'debugging', 'code-review', 'low-level-design',
      'system-design', 'ml-system-design', 'behavioral', 'project-deep-dive'
    ) then
      raise exception 'Invalid priority area' using errcode = '22023';
    end if;
    if entry_area = any (seen_areas) then
      raise exception 'Duplicate priority area' using errcode = '22023';
    end if;
    seen_areas := array_append(seen_areas, entry_area);
  end loop;

  if constraint_entries is null then
    constraint_entries := '[]'::jsonb;
  end if;
  if jsonb_typeof(constraint_entries) <> 'array' then
    raise exception 'Invalid constraints payload' using errcode = '22023';
  end if;
  if jsonb_array_length(constraint_entries) > 10 then
    raise exception 'Too many constraints' using errcode = '22023';
  end if;
  for entry in select * from jsonb_array_elements(constraint_entries)
  loop
    entry_category := entry ->> 'category';
    entry_description := btrim(coalesce(entry ->> 'description', ''));
    if entry_category is null or entry_category not in ('work', 'school', 'health', 'family', 'other') then
      raise exception 'Invalid constraint category' using errcode = '22023';
    end if;
    if entry_description = '' then
      raise exception 'Constraint description cannot be empty' using errcode = '22023';
    end if;
    if char_length(entry_description) > 500 then
      raise exception 'Constraint description too long' using errcode = '22023';
    end if;
  end loop;

  -- Everything below runs inside the same implicit function transaction: any
  -- exception above (or a constraint violation below) aborts the whole call,
  -- so a diagnostic save can never persist partially replaced.
  insert into public.interview_playbook_diagnostic_settings (
    user_id, available_hours_per_week, behavioral_stories_coverage, project_deep_dive_coverage
  ) values (
    current_user_id, available_hours_per_week_value, behavioral_stories_coverage_value, project_deep_dive_coverage_value
  )
  on conflict (user_id) do update set
    available_hours_per_week = excluded.available_hours_per_week,
    behavioral_stories_coverage = excluded.behavioral_stories_coverage,
    project_deep_dive_coverage = excluded.project_deep_dive_coverage
  returning * into saved;

  delete from public.interview_playbook_confidence where user_id = current_user_id;
  insert into public.interview_playbook_confidence (user_id, area, confidence)
  select current_user_id, entry_row ->> 'area', entry_row ->> 'confidence'
  from jsonb_array_elements(confidence_entries) as entry_row;

  delete from public.interview_playbook_priorities where user_id = current_user_id;
  insert into public.interview_playbook_priorities (user_id, area, "position")
  select current_user_id, ordered.area_value, ordered.ordinal::smallint
  from unnest(priority_areas) with ordinality as ordered(area_value, ordinal);

  delete from public.interview_playbook_constraints where user_id = current_user_id;
  insert into public.interview_playbook_constraints (user_id, category, description, "position")
  select current_user_id, ordered.entry_row ->> 'category', btrim(ordered.entry_row ->> 'description'), ordered.ordinal::smallint
  from jsonb_array_elements(constraint_entries) with ordinality as ordered(entry_row, ordinal);

  return saved;
end;
$$;

revoke all on function public.save_interview_playbook_diagnostic_inputs(numeric, jsonb, text[], jsonb, text, text) from public;
grant execute on function public.save_interview_playbook_diagnostic_inputs(numeric, jsonb, text[], jsonb, text, text) to authenticated;

alter table public.interview_playbook_diagnostic_settings enable row level security;
alter table public.interview_playbook_confidence enable row level security;
alter table public.interview_playbook_priorities enable row level security;
alter table public.interview_playbook_constraints enable row level security;

create policy "Owners read interview playbook diagnostic settings"
on public.interview_playbook_diagnostic_settings for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners read interview playbook confidence"
on public.interview_playbook_confidence for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners read interview playbook priorities"
on public.interview_playbook_priorities for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners read interview playbook constraints"
on public.interview_playbook_constraints for select to authenticated
using ((select auth.uid()) = user_id);

-- No direct authenticated INSERT/UPDATE/DELETE: every write goes through the
-- security-definer RPC above so a save is always all-or-nothing.
revoke all on table
  public.interview_playbook_diagnostic_settings,
  public.interview_playbook_confidence,
  public.interview_playbook_priorities,
  public.interview_playbook_constraints
from anon, authenticated;

grant select on table public.interview_playbook_diagnostic_settings to authenticated;
grant select on table public.interview_playbook_confidence to authenticated;
grant select on table public.interview_playbook_priorities to authenticated;
grant select on table public.interview_playbook_constraints to authenticated;

notify pgrst, 'reload schema';

commit;
