begin;

create or replace function public.set_dsa_question_quick_progress(
  target_question_id text,
  target_status text,
  target_bookmarked boolean
)
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  practice_time timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.dsa_question_catalog where id = target_question_id) then
    raise exception 'Unknown canonical DSA question' using errcode = '23503';
  end if;
  if (target_status is null) = (target_bookmarked is null) then
    raise exception 'Exactly one quick progress value is required' using errcode = '23514';
  end if;
  if target_status is not null and target_status not in ('not_started','attempted','solved','review') then
    raise exception 'Invalid DSA question status' using errcode = '23514';
  end if;

  -- A progress row does not exist to lock yet on first use. Serialize quick
  -- mutations for this owner/question pair so concurrent desired status and
  -- bookmark writes commute regardless of which one creates the row.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(target_question_id)
  );
  practice_time := pg_catalog.clock_timestamp();

  if target_status is not null then
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
      case when target_status = 'not_started' then null else practice_time end,
      case when target_status = 'not_started' then null else practice_time end,
      case when target_status in ('solved','review') then practice_time else null end
    )
    on conflict (user_id, question_id) do update set
      status = excluded.status,
      first_attempted_at = coalesce(
        public.dsa_question_progress.first_attempted_at,
        case when excluded.status = 'not_started' then null else practice_time end
      ),
      last_practiced_at = practice_time,
      solved_at = coalesce(
        public.dsa_question_progress.solved_at,
        case when excluded.status in ('solved','review') then practice_time else null end
      )
    where public.dsa_question_progress.status is distinct from excluded.status;
  elsif target_bookmarked then
    insert into public.dsa_question_progress (user_id, question_id, bookmarked)
    values (current_user_id, target_question_id, true)
    on conflict (user_id, question_id) do update set
      bookmarked = true
    where public.dsa_question_progress.bookmarked is distinct from true;
  else
    -- Removing a bookmark is a successful no-op when no progress row exists.
    update public.dsa_question_progress
    set bookmarked = false
    where user_id = current_user_id
      and question_id = target_question_id
      and bookmarked is distinct from false;
  end if;

  return target_question_id;
end;
$$;

revoke all on function public.set_dsa_question_quick_progress(text,text,boolean) from public, anon, authenticated;
grant execute on function public.set_dsa_question_quick_progress(text,text,boolean) to authenticated;

commit;
