begin;

create or replace function public.delete_behavioral_story_if_revision(
  target_story_id uuid,
  target_expected_updated_at timestamptz
)
returns table(story_id uuid)
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
  if target_story_id is null or target_expected_updated_at is null then
    raise exception 'Expected Behavioral story revision is required' using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(target_story_id::text)
  );

  return query
  delete from public.behavioral_stories as story
  where story.id = target_story_id
    and story.user_id = current_user_id
    and story.updated_at = target_expected_updated_at
  returning story.id;
end;
$$;

create or replace function public.delete_behavioral_answer_if_revision(
  target_answer_id uuid,
  target_expected_updated_at timestamptz,
  target_custom_question_id uuid,
  target_curated_question_id text
)
returns table(answer_id uuid)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  question_lock_key text;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_answer_id is null or target_expected_updated_at is null then
    raise exception 'Expected Behavioral answer revision is required' using errcode = '23514';
  end if;
  if (target_custom_question_id is null) = (target_curated_question_id is null) then
    raise exception 'Exactly one Behavioral question identity is required' using errcode = '23514';
  end if;
  if target_curated_question_id is not null
    and target_curated_question_id !~ '^beh-[a-z0-9-]+$'
  then
    raise exception 'Invalid curated Behavioral question identity' using errcode = '23514';
  end if;

  question_lock_key := case
    when target_curated_question_id is not null then 'curated:' || target_curated_question_id
    else 'custom:' || target_custom_question_id::text
  end;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext(question_lock_key)
  );

  return query
  delete from public.behavioral_answers as answer
  where answer.id = target_answer_id
    and answer.user_id = current_user_id
    and answer.custom_question_id is not distinct from target_custom_question_id
    and answer.curated_question_id is not distinct from target_curated_question_id
    and answer.updated_at = target_expected_updated_at
  returning answer.id;
end;
$$;

revoke all on function public.delete_behavioral_story_if_revision(uuid,timestamptz) from public, anon, authenticated;
revoke all on function public.delete_behavioral_answer_if_revision(uuid,timestamptz,uuid,text) from public, anon, authenticated;
grant execute on function public.delete_behavioral_story_if_revision(uuid,timestamptz) to authenticated;
grant execute on function public.delete_behavioral_answer_if_revision(uuid,timestamptz,uuid,text) to authenticated;

-- Migration-first deployment closes already-loaded direct-delete clients before
-- the revision-bound application actions ship. Owner-scoped reads remain direct.
revoke delete on table public.behavioral_stories from authenticated;
revoke delete on table public.behavioral_answers from authenticated;

commit;
