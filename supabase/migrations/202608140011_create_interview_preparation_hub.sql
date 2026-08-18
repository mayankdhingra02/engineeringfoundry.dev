alter table public.interview_rounds
  add constraint interview_rounds_id_user_unique unique (id, user_id);

create table public.interview_preparations (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  private_notes text,
  completed_template_item_ids text[] not null default '{}',
  topics_asked text,
  went_well text,
  needs_improvement text,
  follow_up_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_preparations_round_owner_fkey foreign key (round_id, user_id)
    references public.interview_rounds(id, user_id) on delete cascade,
  constraint interview_preparations_round_unique unique (round_id),
  constraint interview_preparations_notes_length check (char_length(coalesce(private_notes, '')) <= 12000),
  constraint interview_preparations_reflection_length check (
    char_length(coalesce(topics_asked, '')) <= 8000 and
    char_length(coalesce(went_well, '')) <= 8000 and
    char_length(coalesce(needs_improvement, '')) <= 8000 and
    char_length(coalesce(follow_up_notes, '')) <= 8000
  ),
  constraint interview_preparations_checklist_bounded check (cardinality(completed_template_item_ids) <= 24),
  constraint interview_preparations_checklist_known check (completed_template_item_ids <@ array[
    'dsa-review-queue','dsa-company-set','dsa-explain','behavioral-story-set','behavioral-gaps','behavioral-questions',
    'system-design-attempt','system-design-concepts','system-design-narrate','company-research','logistics-confirm','logistics-environment'
  ]::text[])
);

create table public.interview_preparation_custom_tasks (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  completed boolean not null default false,
  position integer not null default 0 check (position between 0 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_preparation_tasks_round_owner_fkey foreign key (round_id, user_id)
    references public.interview_rounds(id, user_id) on delete cascade
);

create index interview_preparation_tasks_round_idx on public.interview_preparation_custom_tasks(user_id, round_id, position, created_at);
alter table public.interview_preparations enable row level security;
alter table public.interview_preparation_custom_tasks enable row level security;
create policy "Owners manage interview preparation" on public.interview_preparations for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners manage interview preparation tasks" on public.interview_preparation_custom_tasks for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.interview_preparations from anon, authenticated;
revoke all on public.interview_preparation_custom_tasks from anon, authenticated;
grant select on public.interview_preparations to authenticated;
grant select on public.interview_preparation_custom_tasks to authenticated;

create or replace function public.save_interview_preparation(
  target_round_id uuid,
  notes_value text default null,
  completed_ids_value text[] default null,
  topics_asked_value text default null,
  went_well_value text default null,
  needs_improvement_value text default null,
  follow_up_notes_value text default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); preparation_id uuid; round_status text;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select status into round_status from public.interview_rounds where id = target_round_id and user_id = current_user_id for update;
  if round_status is null then raise exception 'Interview round not found'; end if;
  if (topics_asked_value is not null or went_well_value is not null or needs_improvement_value is not null or follow_up_notes_value is not null)
    and round_status <> 'Completed' then raise exception 'Reflection is available after the round is completed'; end if;
  insert into public.interview_preparations(round_id, user_id, private_notes, completed_template_item_ids, topics_asked, went_well, needs_improvement, follow_up_notes)
  values (target_round_id, current_user_id, notes_value, coalesce(completed_ids_value, '{}'), topics_asked_value, went_well_value, needs_improvement_value, follow_up_notes_value)
  on conflict (round_id) do update set
    private_notes = coalesce(notes_value, public.interview_preparations.private_notes),
    completed_template_item_ids = coalesce(completed_ids_value, public.interview_preparations.completed_template_item_ids),
    topics_asked = coalesce(topics_asked_value, public.interview_preparations.topics_asked),
    went_well = coalesce(went_well_value, public.interview_preparations.went_well),
    needs_improvement = coalesce(needs_improvement_value, public.interview_preparations.needs_improvement),
    follow_up_notes = coalesce(follow_up_notes_value, public.interview_preparations.follow_up_notes),
    updated_at = statement_timestamp()
  returning id into preparation_id;
  return preparation_id;
end $$;

create or replace function public.add_interview_preparation_task(target_round_id uuid, title_value text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); task_id uuid; next_position integer;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if not exists(select 1 from public.interview_rounds where id = target_round_id and user_id = current_user_id) then raise exception 'Interview round not found'; end if;
  if (select count(*) from public.interview_preparation_custom_tasks where round_id = target_round_id and user_id = current_user_id) >= 12 then raise exception 'Custom task limit reached'; end if;
  select coalesce(max(position), -1) + 1 into next_position from public.interview_preparation_custom_tasks where round_id = target_round_id and user_id = current_user_id;
  insert into public.interview_preparation_custom_tasks(round_id, user_id, title, position) values (target_round_id, current_user_id, btrim(title_value), next_position) returning id into task_id;
  return task_id;
end $$;

create or replace function public.toggle_interview_preparation_task(target_task_id uuid)
returns boolean language sql security definer set search_path = '' as $$
  with changed as (update public.interview_preparation_custom_tasks set completed = not completed, updated_at = statement_timestamp() where id = target_task_id and user_id = auth.uid() returning 1)
  select exists(select 1 from changed)
$$;

create or replace function public.delete_interview_preparation_task(target_task_id uuid)
returns boolean language sql security definer set search_path = '' as $$
  with removed as (delete from public.interview_preparation_custom_tasks where id = target_task_id and user_id = auth.uid() returning 1)
  select exists(select 1 from removed)
$$;

revoke all on function public.save_interview_preparation(uuid,text,text[],text,text,text,text) from public;
revoke all on function public.add_interview_preparation_task(uuid,text) from public;
revoke all on function public.toggle_interview_preparation_task(uuid) from public;
revoke all on function public.delete_interview_preparation_task(uuid) from public;
grant execute on function public.save_interview_preparation(uuid,text,text[],text,text,text,text) to authenticated;
grant execute on function public.add_interview_preparation_task(uuid,text) to authenticated;
grant execute on function public.toggle_interview_preparation_task(uuid) to authenticated;
grant execute on function public.delete_interview_preparation_task(uuid) to authenticated;
