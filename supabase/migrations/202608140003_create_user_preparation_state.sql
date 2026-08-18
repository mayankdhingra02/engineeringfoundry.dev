begin;

create table public.user_preparation_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dsa_level text,
  dsa_plan_id text,
  dsa_company_slug text,
  dsa_preferred_language_slug text,
  dsa_interview_date date,
  system_design_level text,
  system_design_preparation_window text,
  system_design_role text,
  system_design_minutes_per_day integer,
  local_system_design_import_version integer,
  local_system_design_imported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_preparation_preferences_dsa_level check (
    dsa_level is null or dsa_level in ('sde1', 'sde2', 'sde3plus')
  ),
  constraint user_preparation_preferences_dsa_plan check (
    dsa_plan_id is null or dsa_plan_id in ('two-week', '30d', '60d', '90d', 'no-deadline')
  ),
  constraint user_preparation_preferences_dsa_company check (
    dsa_company_slug is null or dsa_company_slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'
  ),
  constraint user_preparation_preferences_dsa_language check (
    dsa_preferred_language_slug is null or dsa_preferred_language_slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'
  ),
  constraint user_preparation_preferences_system_design_level check (
    system_design_level is null or system_design_level in ('sde1', 'sde2', 'senior', 'staff')
  ),
  constraint user_preparation_preferences_system_design_window check (
    system_design_preparation_window is null
      or system_design_preparation_window in ('3-days', '1-week', '2-weeks', '1-month', '2-plus-months')
  ),
  constraint user_preparation_preferences_system_design_role check (
    system_design_role is null or system_design_role in ('backend', 'fullstack', 'infrastructure', 'data', 'ml')
  ),
  constraint user_preparation_preferences_system_design_minutes check (
    system_design_minutes_per_day is null or system_design_minutes_per_day in (30, 60, 120, 180)
  ),
  constraint user_preparation_preferences_import_version check (
    local_system_design_import_version is null
      or local_system_design_import_version between 1 and 2147483647
  ),
  constraint user_preparation_preferences_import_marker check (
    (local_system_design_import_version is null) = (local_system_design_imported_at is null)
  )
);

create table public.dsa_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_kind text not null,
  item_id text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_kind, item_id),
  constraint dsa_progress_item_kind check (
    item_kind in ('problem', 'roadmap-task', 'mixed-set', 'timed-practice')
  ),
  constraint dsa_progress_item_id check (
    item_id ~ '^[a-z0-9][a-z0-9:_-]{0,199}$'
  ),
  constraint dsa_progress_status_by_kind check (
    (item_kind = 'problem' and status in ('attempted', 'solved', 'review', 'comfortable'))
    or (item_kind = 'roadmap-task' and status in ('in-progress', 'completed'))
    or (item_kind = 'mixed-set' and status in ('attempted', 'completed'))
    or (item_kind = 'timed-practice' and status in ('attempted', 'completed'))
  )
);

create table public.system_design_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_kind text not null,
  item_id text not null,
  status text not null,
  completed_at timestamptz,
  last_interacted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_kind, item_id),
  constraint system_design_progress_item_kind check (
    item_kind in ('topic', 'practice', 'review', 'simulation')
  ),
  constraint system_design_progress_item_id check (
    item_id ~ '^[a-z0-9][a-z0-9:_-]{0,199}$'
  ),
  constraint system_design_progress_status check (
    status in ('in-progress', 'completed')
  ),
  constraint system_design_progress_completion check (
    (status = 'completed' and completed_at is not null)
      or (status = 'in-progress' and completed_at is null)
  )
);

create table public.behavioral_saved_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  custom_question_id uuid,
  curated_question_id text,
  created_at timestamptz not null default now(),
  constraint behavioral_saved_questions_kind check (
    (custom_question_id is null) <> (curated_question_id is null)
  ),
  constraint behavioral_saved_questions_curated_key check (
    curated_question_id is null or curated_question_id ~ '^beh-[a-z0-9-]+$'
  ),
  constraint behavioral_saved_questions_custom_owner_fkey
    foreign key (custom_question_id, user_id)
    references public.behavioral_custom_questions (id, user_id)
    on delete cascade
);

create index dsa_progress_user_updated_idx
  on public.dsa_progress (user_id, updated_at desc);
create index dsa_progress_user_status_idx
  on public.dsa_progress (user_id, status, updated_at desc);
create index system_design_progress_user_interaction_idx
  on public.system_design_progress (user_id, last_interacted_at desc);
create index system_design_progress_user_status_idx
  on public.system_design_progress (user_id, status, updated_at desc);
create unique index behavioral_saved_questions_user_curated_unique
  on public.behavioral_saved_questions (user_id, curated_question_id)
  where curated_question_id is not null;
create unique index behavioral_saved_questions_user_custom_unique
  on public.behavioral_saved_questions (user_id, custom_question_id)
  where custom_question_id is not null;

create trigger user_preparation_preferences_set_updated_at
before update on public.user_preparation_preferences
for each row execute function public.set_updated_at();

create trigger dsa_progress_set_updated_at
before update on public.dsa_progress
for each row execute function public.set_updated_at();

create trigger system_design_progress_set_updated_at
before update on public.system_design_progress
for each row execute function public.set_updated_at();

create or replace function public.record_local_system_design_import(import_version integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_import_version integer;
begin
  if current_user_id is null or import_version is null or import_version < 1 then
    return false;
  end if;

  insert into public.user_preparation_preferences (
    user_id,
    local_system_design_import_version,
    local_system_design_imported_at
  )
  values (current_user_id, import_version, statement_timestamp())
  on conflict (user_id) do nothing;

  if found then
    return true;
  end if;

  select local_system_design_import_version
  into current_import_version
  from public.user_preparation_preferences
  where user_id = current_user_id
  for update;

  if current_import_version is not null and import_version < current_import_version then
    return false;
  end if;

  if current_import_version = import_version then
    return true;
  end if;

  update public.user_preparation_preferences
  set
    local_system_design_import_version = import_version,
    local_system_design_imported_at = statement_timestamp()
  where user_id = current_user_id;

  return found;
end;
$$;

revoke all on function public.record_local_system_design_import(integer) from public;
grant execute on function public.record_local_system_design_import(integer) to authenticated;

alter table public.user_preparation_preferences enable row level security;
alter table public.dsa_progress enable row level security;
alter table public.system_design_progress enable row level security;
alter table public.behavioral_saved_questions enable row level security;

create policy "Owners can read preparation preferences"
on public.user_preparation_preferences for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Owners can create preparation preferences"
on public.user_preparation_preferences for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Owners can update preparation preferences"
on public.user_preparation_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Owners can delete preparation preferences"
on public.user_preparation_preferences for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners can read DSA progress"
on public.dsa_progress for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Owners can create DSA progress"
on public.dsa_progress for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Owners can update DSA progress"
on public.dsa_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Owners can delete DSA progress"
on public.dsa_progress for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners can read System Design progress"
on public.system_design_progress for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Owners can create System Design progress"
on public.system_design_progress for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Owners can update System Design progress"
on public.system_design_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
create policy "Owners can delete System Design progress"
on public.system_design_progress for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners can read saved behavioral questions"
on public.behavioral_saved_questions for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Owners can save behavioral questions"
on public.behavioral_saved_questions for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Owners can delete saved behavioral questions"
on public.behavioral_saved_questions for delete to authenticated
using ((select auth.uid()) = user_id);

revoke all on table
  public.user_preparation_preferences,
  public.dsa_progress,
  public.system_design_progress,
  public.behavioral_saved_questions
from anon;

grant select, delete on table public.user_preparation_preferences to authenticated;
grant insert (
  user_id,
  dsa_level,
  dsa_plan_id,
  dsa_company_slug,
  dsa_preferred_language_slug,
  dsa_interview_date,
  system_design_level,
  system_design_preparation_window,
  system_design_role,
  system_design_minutes_per_day
) on public.user_preparation_preferences to authenticated;
grant update (
  dsa_level,
  dsa_plan_id,
  dsa_company_slug,
  dsa_preferred_language_slug,
  dsa_interview_date,
  system_design_level,
  system_design_preparation_window,
  system_design_role,
  system_design_minutes_per_day
) on public.user_preparation_preferences to authenticated;

grant select, delete on table public.dsa_progress to authenticated;
grant insert (user_id, item_kind, item_id, status)
on public.dsa_progress to authenticated;
grant update (status)
on public.dsa_progress to authenticated;

grant select, delete on table public.system_design_progress to authenticated;
grant insert (
  user_id,
  item_kind,
  item_id,
  status,
  completed_at,
  last_interacted_at
) on public.system_design_progress to authenticated;
grant update (status, completed_at, last_interacted_at)
on public.system_design_progress to authenticated;

grant select, delete on table public.behavioral_saved_questions to authenticated;
grant insert (user_id, custom_question_id, curated_question_id)
on public.behavioral_saved_questions to authenticated;

commit;
