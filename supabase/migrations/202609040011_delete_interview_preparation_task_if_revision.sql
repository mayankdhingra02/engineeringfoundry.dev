begin;

create or replace function public.set_interview_preparation_task_completed(
  target_round_id uuid,
  target_task_id uuid,
  target_completed boolean
)
returns table(
  task_id uuid,
  round_id uuid,
  application_id uuid,
  completed boolean
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_completed boolean;
  owned_application_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_round_id is null or target_task_id is null then
    raise exception 'Invalid preparation task target' using errcode = '23514';
  end if;
  if target_completed is null then
    raise exception 'Task completion state is required' using errcode = '23502';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(target_task_id::text)
  );

  select tasks.completed, rounds.application_id
  into current_completed, owned_application_id
  from public.interview_preparation_custom_tasks as tasks
  join public.interview_rounds as rounds
    on rounds.id = tasks.round_id
    and rounds.user_id = current_user_id
  where tasks.id = target_task_id
    and tasks.round_id = target_round_id
    and tasks.user_id = current_user_id
  for update of tasks;

  if not found then
    return;
  end if;

  if current_completed is distinct from target_completed then
    update public.interview_preparation_custom_tasks as tasks
    set
      completed = target_completed,
      updated_at = greatest(
        pg_catalog.clock_timestamp(),
        tasks.updated_at + interval '1 microsecond'
      )
    where tasks.id = target_task_id
      and tasks.round_id = target_round_id
      and tasks.user_id = current_user_id;
  end if;

  return query
  select
    target_task_id,
    target_round_id,
    owned_application_id,
    target_completed;
end;
$$;

create or replace function public.delete_interview_preparation_task_if_revision(
  target_round_id uuid,
  target_task_id uuid,
  target_expected_updated_at timestamptz
)
returns table(
  task_id uuid,
  round_id uuid,
  application_id uuid
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_round_id is null or target_task_id is null or target_expected_updated_at is null then
    raise exception 'Expected preparation task revision is required' using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(target_task_id::text)
  );

  return query
  delete from public.interview_preparation_custom_tasks as tasks
  using public.interview_rounds as rounds
  where tasks.id = target_task_id
    and tasks.round_id = target_round_id
    and tasks.user_id = current_user_id
    and tasks.updated_at = target_expected_updated_at
    and rounds.id = tasks.round_id
    and rounds.user_id = current_user_id
  returning tasks.id, tasks.round_id, rounds.application_id;
end;
$$;

create or replace function public.delete_interview_preparation_task(
  target_task_id uuid
)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  raise exception 'Revision-checked preparation task deletion is required'
    using errcode = '0A000';
end;
$$;

revoke all on function public.set_interview_preparation_task_completed(uuid,uuid,boolean)
  from public, anon, authenticated;
revoke all on function public.delete_interview_preparation_task_if_revision(uuid,uuid,timestamptz)
  from public, anon, authenticated;
revoke all on function public.delete_interview_preparation_task(uuid)
  from public, anon, authenticated;

grant execute on function public.set_interview_preparation_task_completed(uuid,uuid,boolean)
  to authenticated;
grant execute on function public.delete_interview_preparation_task_if_revision(uuid,uuid,timestamptz)
  to authenticated;
grant execute on function public.delete_interview_preparation_task(uuid)
  to authenticated;

-- Migration-first deployment makes already-loaded task-delete clients fail
-- with the stable legacy error before revision-bound deletion ships.

commit;
