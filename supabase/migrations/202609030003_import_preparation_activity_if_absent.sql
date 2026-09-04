begin;

-- Browser activity import is intentionally insert-only. A concurrent account
-- write wins the primary-key race and this function reports the existing row
-- without updating any of its richer progress fields.
create or replace function public.import_dsa_question_progress_if_absent(
  target_question_id text,
  target_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  activity_time timestamptz := statement_timestamp();
  inserted boolean;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.dsa_question_catalog where id = target_question_id) then
    raise exception 'Unknown canonical DSA question' using errcode = '23503';
  end if;
  if target_status is null or target_status not in ('attempted', 'review') then
    raise exception 'Invalid imported DSA question status' using errcode = '23514';
  end if;

  insert into public.dsa_question_progress (
    user_id,
    question_id,
    status,
    first_attempted_at,
    last_practiced_at,
    solved_at
  ) values (
    current_user_id,
    target_question_id,
    target_status,
    activity_time,
    activity_time,
    case when target_status = 'review' then activity_time else null end
  )
  on conflict (user_id, question_id) do nothing
  returning true into inserted;

  return coalesce(inserted, false);
end;
$$;

create or replace function public.import_system_design_item_progress_if_absent(
  target_item_id text,
  target_item_type text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  activity_time timestamptz := statement_timestamp();
  inserted boolean;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_item_type is null or target_item_type not in ('concept', 'design_problem') then
    raise exception 'Invalid System Design item type' using errcode = '23514';
  end if;
  if not exists (
    select 1
    from public.system_design_item_catalog
    where id = target_item_id and item_type = target_item_type
  ) then
    raise exception 'Unknown canonical System Design item' using errcode = '23503';
  end if;

  insert into public.system_design_item_progress (
    user_id,
    item_id,
    item_type,
    status,
    first_reviewed_at,
    last_practiced_at
  ) values (
    current_user_id,
    target_item_id,
    target_item_type,
    'reviewed',
    activity_time,
    activity_time
  )
  on conflict (user_id, item_type, item_id) do nothing
  returning true into inserted;

  return coalesce(inserted, false);
end;
$$;

create or replace function public.import_preparation_track_progress_if_absent(
  target_track text,
  target_item_id text,
  target_status text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  activity_time timestamptz := statement_timestamp();
  inserted boolean;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_track is null or target_track not in ('ml-design', 'behavioral') then
    raise exception 'Invalid imported preparation track' using errcode = '23514';
  end if;
  if target_item_id is null or target_item_id !~ '^[a-z0-9][a-z0-9:_-]{0,199}$' then
    raise exception 'Invalid imported preparation item' using errcode = '23514';
  end if;
  if target_status is null or target_status not in ('in-progress', 'completed') then
    raise exception 'Invalid imported preparation status' using errcode = '23514';
  end if;

  insert into public.preparation_track_progress (
    user_id,
    track,
    item_id,
    status,
    completed_at,
    last_interacted_at
  ) values (
    current_user_id,
    target_track,
    target_item_id,
    target_status,
    case when target_status = 'completed' then activity_time else null end,
    activity_time
  )
  on conflict (user_id, track, item_id) do nothing
  returning true into inserted;

  return coalesce(inserted, false);
end;
$$;

revoke all on function public.import_dsa_question_progress_if_absent(text, text) from public, anon;
revoke all on function public.import_system_design_item_progress_if_absent(text, text) from public, anon;
revoke all on function public.import_preparation_track_progress_if_absent(text, text, text) from public, anon;
grant execute on function public.import_dsa_question_progress_if_absent(text, text) to authenticated;
grant execute on function public.import_system_design_item_progress_if_absent(text, text) to authenticated;
grant execute on function public.import_preparation_track_progress_if_absent(text, text, text) to authenticated;

commit;
