begin;

-- System Design item progress uses updated_at as an edit revision. Advance it
-- monotonically even for multiple writes in one transaction and after lock
-- contention.
create or replace function public.set_system_design_item_progress_updated_at()
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

revoke all on function public.set_system_design_item_progress_updated_at() from public, anon, authenticated;

drop trigger if exists system_design_item_progress_set_updated_at on public.system_design_item_progress;
create trigger system_design_item_progress_set_updated_at
before update on public.system_design_item_progress
for each row execute function public.set_system_design_item_progress_updated_at();

create or replace function public.save_system_design_item_progress_if_revision(
  target_item_id text,
  target_item_type text,
  target_expect_absent boolean,
  target_expected_updated_at timestamptz,
  target_status text,
  target_confidence text,
  target_bookmarked boolean,
  target_notes text
)
returns table(item_id text, item_type text, updated_at timestamptz)
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
  if target_item_type is null or target_item_type not in ('concept', 'design_problem') then
    raise exception 'Invalid System Design item type' using errcode = '23514';
  end if;
  if not exists (
    select 1
    from public.system_design_item_catalog as catalog
    where catalog.id = target_item_id and catalog.item_type = target_item_type
  ) then
    raise exception 'Unknown canonical System Design item' using errcode = '23503';
  end if;
  if target_expect_absent is null
    or (target_expect_absent and target_expected_updated_at is not null)
    or (not target_expect_absent and target_expected_updated_at is null)
  then
    raise exception 'Expected System Design progress revision is invalid' using errcode = '23514';
  end if;
  if target_status is null or target_status not in ('not_started', 'reviewed', 'review', 'comfortable') then
    raise exception 'Invalid System Design progress status' using errcode = '23514';
  end if;
  if target_confidence is not null and target_confidence not in ('low', 'medium', 'high') then
    raise exception 'Invalid System Design confidence' using errcode = '23514';
  end if;
  if target_bookmarked is null then
    raise exception 'System Design bookmark state is required' using errcode = '23514';
  end if;
  if char_length(coalesce(target_notes, '')) > 10000 then
    raise exception 'System Design progress notes are too long' using errcode = '22001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(target_item_type || ':' || target_item_id)
  );
  practice_time := pg_catalog.clock_timestamp();

  if target_expect_absent then
    return query
    insert into public.system_design_item_progress (
      user_id,
      item_id,
      item_type,
      status,
      confidence,
      bookmarked,
      notes,
      first_reviewed_at,
      last_practiced_at
    ) values (
      current_user_id,
      target_item_id,
      target_item_type,
      target_status,
      target_confidence,
      target_bookmarked,
      normalized_notes,
      case when target_status = 'not_started' then null else practice_time end,
      case
        when target_status = 'not_started' and target_confidence is null and normalized_notes is null
        then null
        else practice_time
      end
    )
    on conflict on constraint system_design_item_progress_pkey do nothing
    returning
      system_design_item_progress.item_id,
      system_design_item_progress.item_type,
      system_design_item_progress.updated_at;
    return;
  end if;

  return query
  update public.system_design_item_progress as progress
  set
    status = target_status,
    confidence = target_confidence,
    bookmarked = target_bookmarked,
    notes = normalized_notes,
    first_reviewed_at = coalesce(
      progress.first_reviewed_at,
      case when target_status = 'not_started' then null else practice_time end
    ),
    last_practiced_at = case
      when progress.status is distinct from target_status
        or progress.confidence is distinct from target_confidence
        or progress.notes is distinct from normalized_notes
      then practice_time
      else progress.last_practiced_at
    end
  where progress.user_id = current_user_id
    and progress.item_id = target_item_id
    and progress.item_type = target_item_type
    and progress.updated_at = target_expected_updated_at
  returning progress.item_id, progress.item_type, progress.updated_at;
end;
$$;

create or replace function public.set_system_design_item_quick_progress(
  target_item_id text,
  target_item_type text,
  target_status text
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
  if target_item_type is null or target_item_type not in ('concept', 'design_problem') then
    raise exception 'Invalid System Design item type' using errcode = '23514';
  end if;
  if not exists (
    select 1
    from public.system_design_item_catalog as catalog
    where catalog.id = target_item_id and catalog.item_type = target_item_type
  ) then
    raise exception 'Unknown canonical System Design item' using errcode = '23503';
  end if;
  if target_status is null or target_status not in ('not_started', 'reviewed', 'review', 'comfortable') then
    raise exception 'Invalid System Design progress status' using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(target_item_type || ':' || target_item_id)
  );
  practice_time := pg_catalog.clock_timestamp();

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
    target_status,
    case when target_status = 'not_started' then null else practice_time end,
    case when target_status = 'not_started' then null else practice_time end
  )
  on conflict (user_id, item_type, item_id) do update set
    status = excluded.status,
    first_reviewed_at = coalesce(
      public.system_design_item_progress.first_reviewed_at,
      case when excluded.status = 'not_started' then null else practice_time end
    ),
    last_practiced_at = practice_time
  where public.system_design_item_progress.status is distinct from excluded.status;

  return target_item_id;
end;
$$;

revoke all on function public.save_system_design_item_progress_if_revision(text,text,boolean,timestamptz,text,text,boolean,text) from public, anon, authenticated;
grant execute on function public.save_system_design_item_progress_if_revision(text,text,boolean,timestamptz,text,text,boolean,text) to authenticated;

revoke all on function public.set_system_design_item_quick_progress(text,text,text) from public, anon, authenticated;
grant execute on function public.set_system_design_item_quick_progress(text,text,text) to authenticated;

-- Keep the legacy signature callable by authenticated clients only so a
-- migration-first rollout makes already-loaded clients fail safely without a
-- destructive whole-row write.
create or replace function public.save_system_design_item_progress(
  target_item_id text,
  target_item_type text,
  target_status text,
  target_confidence text,
  target_bookmarked boolean,
  target_notes text
)
returns setof public.system_design_item_progress
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  perform target_item_id, target_item_type, target_status, target_confidence, target_bookmarked, target_notes;
  raise exception 'Revision-checked System Design progress saving is required' using errcode = '0A000';
end;
$$;

revoke all on function public.save_system_design_item_progress(text,text,text,text,boolean,text) from public, anon, authenticated;
grant execute on function public.save_system_design_item_progress(text,text,text,text,boolean,text) to authenticated;

commit;
