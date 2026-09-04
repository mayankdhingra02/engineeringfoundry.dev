begin;

alter table public.interview_preparations
  add column private_notes_updated_at timestamptz,
  add column reflection_updated_at timestamptz;

update public.interview_preparations
set private_notes_updated_at = updated_at
where private_notes is not null;

update public.interview_preparations
set reflection_updated_at = updated_at
where topics_asked is not null
   or went_well is not null
   or needs_improvement is not null
   or follow_up_notes is not null;

create or replace function public.save_interview_preparation_notes_if_revision(
  target_round_id uuid,
  target_expect_absent boolean,
  target_expected_updated_at timestamptz,
  target_notes text
)
returns table(round_id uuid, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  owned_round_id uuid;
  save_time timestamptz;
  saved_updated_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_expect_absent is null
    or (target_expect_absent and target_expected_updated_at is not null)
    or (not target_expect_absent and target_expected_updated_at is null) then
    raise exception 'Expected preparation notes revision is invalid'
      using errcode = '23514';
  end if;
  if target_notes is null then
    raise exception 'Preparation notes are required' using errcode = '23502';
  end if;
  if char_length(target_notes) > 12000 then
    raise exception 'Preparation notes are too long' using errcode = '22001';
  end if;

  select rounds.id
  into owned_round_id
  from public.interview_rounds as rounds
  where rounds.id = target_round_id
    and rounds.user_id = current_user_id
  for update;
  if not found then
    return;
  end if;

  insert into public.interview_preparations as preparations (
    round_id,
    user_id,
    completed_template_item_ids
  ) values (
    target_round_id,
    current_user_id,
    '{}'::text[]
  )
  on conflict on constraint interview_preparations_round_unique do nothing;

  save_time := pg_catalog.clock_timestamp();
  update public.interview_preparations as preparations
  set private_notes = target_notes,
      private_notes_updated_at = greatest(
        save_time,
        coalesce(preparations.private_notes_updated_at + interval '1 microsecond', '-infinity'::timestamptz),
        preparations.updated_at + interval '1 microsecond'
      ),
      updated_at = greatest(
        save_time,
        coalesce(preparations.private_notes_updated_at + interval '1 microsecond', '-infinity'::timestamptz),
        preparations.updated_at + interval '1 microsecond'
      )
  where preparations.round_id = target_round_id
    and preparations.user_id = current_user_id
    and (
      (target_expect_absent and preparations.private_notes_updated_at is null)
      or (
        not target_expect_absent
        and preparations.private_notes_updated_at = target_expected_updated_at
      )
    )
  returning preparations.private_notes_updated_at into saved_updated_at;

  if saved_updated_at is not null then
    return query select owned_round_id, saved_updated_at;
  end if;
end;
$$;

create or replace function public.save_interview_preparation_reflection_if_revision(
  target_round_id uuid,
  target_expect_absent boolean,
  target_expected_updated_at timestamptz,
  target_topics_asked text,
  target_went_well text,
  target_needs_improvement text,
  target_follow_up_notes text
)
returns table(round_id uuid, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  owned_round_id uuid;
  owned_round_status text;
  save_time timestamptz;
  saved_updated_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_expect_absent is null
    or (target_expect_absent and target_expected_updated_at is not null)
    or (not target_expect_absent and target_expected_updated_at is null) then
    raise exception 'Expected preparation reflection revision is invalid'
      using errcode = '23514';
  end if;
  if target_topics_asked is null
    or target_went_well is null
    or target_needs_improvement is null
    or target_follow_up_notes is null then
    raise exception 'Preparation reflection values are required' using errcode = '23502';
  end if;
  if char_length(target_topics_asked) > 8000
    or char_length(target_went_well) > 8000
    or char_length(target_needs_improvement) > 8000
    or char_length(target_follow_up_notes) > 8000 then
    raise exception 'Preparation reflection is too long' using errcode = '22001';
  end if;

  select rounds.id, rounds.status
  into owned_round_id, owned_round_status
  from public.interview_rounds as rounds
  where rounds.id = target_round_id
    and rounds.user_id = current_user_id
  for update;
  if not found then
    return;
  end if;
  if owned_round_status <> 'Completed' then
    raise exception 'Reflection is available after the round is completed'
      using errcode = '23514';
  end if;

  insert into public.interview_preparations as preparations (
    round_id,
    user_id,
    completed_template_item_ids
  ) values (
    target_round_id,
    current_user_id,
    '{}'::text[]
  )
  on conflict on constraint interview_preparations_round_unique do nothing;

  save_time := pg_catalog.clock_timestamp();
  update public.interview_preparations as preparations
  set topics_asked = target_topics_asked,
      went_well = target_went_well,
      needs_improvement = target_needs_improvement,
      follow_up_notes = target_follow_up_notes,
      reflection_updated_at = greatest(
        save_time,
        coalesce(preparations.reflection_updated_at + interval '1 microsecond', '-infinity'::timestamptz),
        preparations.updated_at + interval '1 microsecond'
      ),
      updated_at = greatest(
        save_time,
        coalesce(preparations.reflection_updated_at + interval '1 microsecond', '-infinity'::timestamptz),
        preparations.updated_at + interval '1 microsecond'
      )
  where preparations.round_id = target_round_id
    and preparations.user_id = current_user_id
    and (
      (target_expect_absent and preparations.reflection_updated_at is null)
      or (
        not target_expect_absent
        and preparations.reflection_updated_at = target_expected_updated_at
      )
    )
  returning preparations.reflection_updated_at into saved_updated_at;

  if saved_updated_at is not null then
    return query select owned_round_id, saved_updated_at;
  end if;
end;
$$;

create or replace function public.save_interview_preparation(
  target_round_id uuid,
  notes_value text default null,
  completed_ids_value text[] default null,
  topics_asked_value text default null,
  went_well_value text default null,
  needs_improvement_value text default null,
  follow_up_notes_value text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  raise exception 'Revision-checked preparation text saving is required'
    using errcode = '0A000';
end;
$$;

revoke all on function public.save_interview_preparation_notes_if_revision(uuid,boolean,timestamptz,text) from public, anon, authenticated;
grant execute on function public.save_interview_preparation_notes_if_revision(uuid,boolean,timestamptz,text) to authenticated;

revoke all on function public.save_interview_preparation_reflection_if_revision(uuid,boolean,timestamptz,text,text,text,text) from public, anon, authenticated;
grant execute on function public.save_interview_preparation_reflection_if_revision(uuid,boolean,timestamptz,text,text,text,text) to authenticated;

revoke all on function public.save_interview_preparation(uuid,text,text[],text,text,text,text) from public, anon, authenticated;
grant execute on function public.save_interview_preparation(uuid,text,text[],text,text,text,text) to authenticated;

commit;
