begin;

-- The shared updated_at trigger uses transaction_timestamp(). DSA progress uses
-- updated_at as an edit revision, so it must advance even when multiple writes
-- are exercised inside one transaction and must not move backwards after lock
-- contention.
create or replace function public.set_dsa_question_progress_updated_at()
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

revoke all on function public.set_dsa_question_progress_updated_at() from public, anon, authenticated;

drop trigger if exists dsa_question_progress_set_updated_at on public.dsa_question_progress;
create trigger dsa_question_progress_set_updated_at
before update on public.dsa_question_progress
for each row execute function public.set_dsa_question_progress_updated_at();

create or replace function public.save_dsa_question_progress_if_revision(
  target_question_id text,
  target_expect_absent boolean,
  target_expected_updated_at timestamptz,
  target_status text,
  target_confidence text,
  target_bookmarked boolean,
  target_notes text
)
returns table(question_id text, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  practice_time timestamptz;
  normalized_notes text := nullif(btrim(target_notes), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.dsa_question_catalog where id = target_question_id) then
    raise exception 'Unknown canonical DSA question' using errcode = '23503';
  end if;
  if target_expect_absent is null
    or (target_expect_absent and target_expected_updated_at is not null)
    or (not target_expect_absent and target_expected_updated_at is null)
  then
    raise exception 'Expected DSA progress revision is invalid' using errcode = '23514';
  end if;
  if target_status is null or target_status not in ('not_started','attempted','solved','review') then
    raise exception 'Invalid DSA question status' using errcode = '23514';
  end if;
  if target_confidence is not null and target_confidence not in ('low','medium','high') then
    raise exception 'Invalid confidence' using errcode = '23514';
  end if;
  if target_bookmarked is null then
    raise exception 'Bookmark state is required' using errcode = '23514';
  end if;
  if char_length(coalesce(target_notes, '')) > 5000 then
    raise exception 'Notes are too long' using errcode = '22001';
  end if;

  -- Serialize full edits with the existing quick status/bookmark mutations for
  -- the same owner and canonical question.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(target_question_id)
  );
  practice_time := pg_catalog.clock_timestamp();

  if target_expect_absent then
    return query
    insert into public.dsa_question_progress (
      user_id,
      question_id,
      status,
      confidence,
      bookmarked,
      notes,
      first_attempted_at,
      last_practiced_at,
      solved_at
    ) values (
      current_user_id,
      target_question_id,
      target_status,
      target_confidence,
      target_bookmarked,
      normalized_notes,
      case when target_status = 'not_started' then null else practice_time end,
      case when target_status = 'not_started' and target_confidence is null and normalized_notes is null then null else practice_time end,
      case when target_status in ('solved','review') then practice_time else null end
    )
    on conflict on constraint dsa_question_progress_pkey do nothing
    returning dsa_question_progress.question_id, dsa_question_progress.updated_at;
    return;
  end if;

  return query
  update public.dsa_question_progress as progress
  set
    status = target_status,
    confidence = target_confidence,
    bookmarked = target_bookmarked,
    notes = normalized_notes,
    first_attempted_at = coalesce(
      progress.first_attempted_at,
      case when target_status = 'not_started' then null else practice_time end
    ),
    last_practiced_at = case
      when progress.status is distinct from target_status
        or progress.confidence is distinct from target_confidence
        or progress.notes is distinct from normalized_notes
      then practice_time
      else progress.last_practiced_at
    end,
    solved_at = coalesce(
      progress.solved_at,
      case when target_status in ('solved','review') then practice_time else null end
    )
  where progress.user_id = current_user_id
    and progress.question_id = target_question_id
    and progress.updated_at = target_expected_updated_at
  returning progress.question_id, progress.updated_at;
end;
$$;

revoke all on function public.save_dsa_question_progress_if_revision(text,boolean,timestamptz,text,text,boolean,text) from public, anon, authenticated;
grant execute on function public.save_dsa_question_progress_if_revision(text,boolean,timestamptz,text,text,boolean,text) to authenticated;

-- Preserve the old signature so migration-first deployments fail safely with a
-- stable response instead of allowing an old whole-row snapshot to overwrite a
-- newer field-level update.
create or replace function public.save_dsa_question_progress(
  target_question_id text,
  target_status text,
  target_confidence text,
  target_bookmarked boolean,
  target_notes text
)
returns setof public.dsa_question_progress
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform target_question_id, target_status, target_confidence, target_bookmarked, target_notes;
  raise exception 'Revision-checked DSA progress saving is required' using errcode = '0A000';
end;
$$;

revoke all on function public.save_dsa_question_progress(text,text,text,boolean,text) from public, anon, authenticated;
grant execute on function public.save_dsa_question_progress(text,text,text,boolean,text) to authenticated;

commit;
