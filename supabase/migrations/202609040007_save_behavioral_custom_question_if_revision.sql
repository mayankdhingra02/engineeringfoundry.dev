begin;

-- Custom Behavioral questions use updated_at as an edit and delete revision.
-- Advance the token monotonically after same-key lock contention.
create or replace function public.set_behavioral_custom_question_updated_at()
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

revoke all on function public.set_behavioral_custom_question_updated_at()
  from public, anon, authenticated;

drop trigger if exists behavioral_custom_questions_set_updated_at
  on public.behavioral_custom_questions;
create trigger behavioral_custom_questions_set_updated_at
before update on public.behavioral_custom_questions
for each row execute function public.set_behavioral_custom_question_updated_at();

create or replace function public.save_behavioral_custom_question_if_revision(
  target_question_id uuid,
  target_expect_absent boolean,
  target_expected_updated_at timestamptz,
  target_question_text text,
  target_description text,
  target_category text,
  target_company_slug text,
  target_notes text
)
returns table(question_id uuid, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_question_text text := pg_catalog.btrim(target_question_text);
  normalized_description text := nullif(pg_catalog.btrim(target_description), '');
  normalized_category text := coalesce(nullif(pg_catalog.btrim(target_category), ''), 'Other');
  normalized_notes text := nullif(pg_catalog.btrim(target_notes), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_question_id is null
    or target_expect_absent is null
    or (target_expect_absent and target_expected_updated_at is not null)
    or (not target_expect_absent and target_expected_updated_at is null) then
    raise exception 'Expected Behavioral question revision is invalid'
      using errcode = '23514';
  end if;
  if normalized_question_text is null
    or pg_catalog.char_length(normalized_question_text) not between 5 and 1000
    or pg_catalog.regexp_replace(normalized_question_text, E'[\\t\\n\\r]', '', 'g') ~ '[[:cntrl:]]' then
    raise exception 'Invalid Behavioral question text' using errcode = '23514';
  end if;
  if pg_catalog.char_length(normalized_category) not between 1 and 100
    or normalized_category ~ '[[:cntrl:]]' then
    raise exception 'Invalid Behavioral question category' using errcode = '23514';
  end if;
  if target_company_slug is not null
    and target_company_slug !~ '^[a-z0-9][a-z0-9-]{0,79}$' then
    raise exception 'Invalid Behavioral question company' using errcode = '23514';
  end if;
  if pg_catalog.char_length(coalesce(normalized_description, '')) > 5000
    or pg_catalog.regexp_replace(coalesce(normalized_description, ''), E'[\\t\\n\\r]', '', 'g') ~ '[[:cntrl:]]' then
    raise exception 'Behavioral question description is invalid' using errcode = '23514';
  end if;
  if pg_catalog.char_length(coalesce(normalized_notes, '')) > 20000
    or pg_catalog.regexp_replace(coalesce(normalized_notes, ''), E'[\\t\\n\\r]', '', 'g') ~ '[[:cntrl:]]' then
    raise exception 'Behavioral question notes are invalid' using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext('behavioral-question:' || target_question_id::text)
  );

  if target_expect_absent then
    return query
    insert into public.behavioral_custom_questions as question (
      id,
      user_id,
      question_text,
      description,
      category,
      company_slug,
      notes
    ) values (
      target_question_id,
      current_user_id,
      normalized_question_text,
      normalized_description,
      normalized_category,
      target_company_slug,
      normalized_notes
    )
    on conflict on constraint behavioral_custom_questions_pkey do nothing
    returning question.id, question.updated_at;
    return;
  end if;

  return query
  update public.behavioral_custom_questions as question
  set
    question_text = normalized_question_text,
    description = normalized_description,
    category = normalized_category,
    company_slug = target_company_slug,
    notes = normalized_notes
  where question.id = target_question_id
    and question.user_id = current_user_id
    and question.updated_at = target_expected_updated_at
  returning question.id, question.updated_at;
end;
$$;

create or replace function public.delete_behavioral_custom_question_if_revision(
  target_question_id uuid,
  target_expected_updated_at timestamptz
)
returns table(question_id uuid)
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
  if target_question_id is null or target_expected_updated_at is null then
    raise exception 'Expected Behavioral question revision is required'
      using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext(current_user_id::text),
    pg_catalog.hashtext('behavioral-question:' || target_question_id::text)
  );

  return query
  delete from public.behavioral_custom_questions as question
  where question.id = target_question_id
    and question.user_id = current_user_id
    and question.updated_at = target_expected_updated_at
  returning question.id;
end;
$$;

-- These owner-derived RPCs are the only authenticated mutation boundary.
-- Already-loaded direct writers fail safely with 42501 after migration-first
-- deployment.
revoke insert, update, delete on table public.behavioral_custom_questions
  from authenticated;
revoke insert (
  id,
  user_id,
  question_text,
  description,
  category,
  company_slug,
  notes
) on public.behavioral_custom_questions from authenticated;
revoke update (
  question_text,
  description,
  category,
  company_slug,
  notes
) on public.behavioral_custom_questions from authenticated;

revoke all on function public.save_behavioral_custom_question_if_revision(
  uuid,boolean,timestamptz,text,text,text,text,text
) from public, anon, authenticated;
revoke all on function public.delete_behavioral_custom_question_if_revision(
  uuid,timestamptz
) from public, anon, authenticated;
grant execute on function public.save_behavioral_custom_question_if_revision(
  uuid,boolean,timestamptz,text,text,text,text,text
) to authenticated;
grant execute on function public.delete_behavioral_custom_question_if_revision(
  uuid,timestamptz
) to authenticated;

commit;
