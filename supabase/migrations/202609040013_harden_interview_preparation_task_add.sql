create or replace function public.add_interview_preparation_task(
  target_round_id uuid,
  title_value text
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_title text;
  task_id uuid;
  next_position integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_round_id is null or title_value is null then
    raise exception 'Invalid preparation task' using errcode = '23514';
  end if;

  normalized_title := btrim(title_value);
  if normalized_title = ''
    or char_length(normalized_title) > 160
    or normalized_title ~ '[[:cntrl:]]'
  then
    raise exception 'Invalid preparation task' using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(target_round_id::text)
  );

  perform 1
  from public.interview_rounds
  where id = target_round_id
    and user_id = current_user_id
  for update;
  if not found then
    raise exception 'Interview round not found' using errcode = 'P0002';
  end if;

  if (
    select count(*)
    from public.interview_preparation_custom_tasks
    where round_id = target_round_id
      and user_id = current_user_id
  ) >= 12 then
    raise exception 'Custom task limit reached' using errcode = 'P0001';
  end if;

  select coalesce(max(tasks.position), -1) + 1
  into next_position
  from public.interview_preparation_custom_tasks as tasks
  where tasks.round_id = target_round_id
    and tasks.user_id = current_user_id;

  insert into public.interview_preparation_custom_tasks (
    round_id,
    user_id,
    title,
    position
  ) values (
    target_round_id,
    current_user_id,
    normalized_title,
    next_position
  )
  returning id into task_id;

  return task_id;
end;
$$;

revoke all on function public.add_interview_preparation_task(uuid, text)
  from public, anon, authenticated;
grant execute on function public.add_interview_preparation_task(uuid, text)
  to authenticated;
