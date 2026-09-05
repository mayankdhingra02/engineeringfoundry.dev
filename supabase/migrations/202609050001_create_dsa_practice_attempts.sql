begin;

create or replace function public.dsa_practice_attempt_document_valid(document jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  item text;
  entry_key text;
  entry_value jsonb;
  allowed_checkpoints constant text[] := array['clarified','brute_force','plan_before_code','implemented','tested','complexity'];
  allowed_dimensions constant text[] := array[
    'problem-recognition','problem-framing-clarification','brute-force-reasoning',
    'algorithm-data-structure-choice','correctness','implementation-fluency',
    'complexity-analysis','testing-edge-cases','communication','hint-dependence',
    'error-recovery','transfer-to-unseen'
  ];
  allowed_bands constant text[] := array['needs_evidence','developing','strong'];
begin
  if document is null
    or jsonb_typeof(document) <> 'object'
    or octet_length(document::text) > 120000
    or not (document ?& array[
      'clarification_notes','brute_force_notes','approach_notes','implementation_notes',
      'test_notes','complexity_notes','reflection','completed_checkpoints','hints_used',
      'error_recovery','self_review','dimension_evidence','follow_up'
    ])
    or document - array[
      'clarification_notes','brute_force_notes','approach_notes','implementation_notes',
      'test_notes','complexity_notes','reflection','completed_checkpoints','hints_used',
      'error_recovery','self_review','dimension_evidence','follow_up'
    ] <> '{}'::jsonb
    or jsonb_typeof(document->'clarification_notes') <> 'string' or length(document->>'clarification_notes') > 8000
    or jsonb_typeof(document->'brute_force_notes') <> 'string' or length(document->>'brute_force_notes') > 8000
    or jsonb_typeof(document->'approach_notes') <> 'string' or length(document->>'approach_notes') > 8000
    or jsonb_typeof(document->'implementation_notes') <> 'string' or length(document->>'implementation_notes') > 30000
    or jsonb_typeof(document->'test_notes') <> 'string' or length(document->>'test_notes') > 8000
    or jsonb_typeof(document->'complexity_notes') <> 'string' or length(document->>'complexity_notes') > 8000
    or jsonb_typeof(document->'reflection') <> 'string' or length(document->>'reflection') > 8000
    or jsonb_typeof(document->'follow_up') <> 'string' or length(document->>'follow_up') > 8000
    or jsonb_typeof(document->'completed_checkpoints') <> 'array'
    or jsonb_array_length(document->'completed_checkpoints') > 6
    or jsonb_typeof(document->'hints_used') <> 'number'
    or (document->>'hints_used') !~ '^\d+$'
    or (document->>'hints_used')::integer > 20
    or jsonb_typeof(document->'error_recovery') <> 'string'
    or document->>'error_recovery' not in ('not_needed','recovered','unresolved')
    or jsonb_typeof(document->'self_review') <> 'object'
    or jsonb_typeof(document->'dimension_evidence') <> 'object'
  then return false; end if;

  if (select count(*) from jsonb_array_elements_text(document->'completed_checkpoints'))
    <> (select count(distinct value) from jsonb_array_elements_text(document->'completed_checkpoints'))
  then return false; end if;
  for item in select value from jsonb_array_elements_text(document->'completed_checkpoints') loop
    if item is null or not item = any(allowed_checkpoints) then return false; end if;
  end loop;
  for entry_key, entry_value in select key, value from jsonb_each(document->'self_review') loop
    if not entry_key = any(allowed_dimensions) or jsonb_typeof(entry_value) <> 'string'
      or not trim(both '"' from entry_value::text) = any(allowed_bands)
    then return false; end if;
  end loop;
  for entry_key, entry_value in select key, value from jsonb_each(document->'dimension_evidence') loop
    if not entry_key = any(allowed_dimensions) or jsonb_typeof(entry_value) <> 'string'
      or length(entry_value #>> '{}') > 4000
    then return false; end if;
  end loop;
  return true;
exception when others then return false;
end;
$$;

create table public.dsa_practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.dsa_question_catalog(id) on update cascade on delete restrict,
  catalog_version integer not null default 1,
  title text not null,
  status text not null default 'draft',
  mode text not null,
  duration_minutes integer,
  prior_exposure text not null,
  elapsed_seconds integer not null default 0,
  review_reason text,
  document jsonb not null,
  revision bigint not null default 1,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dsa_practice_attempts_catalog_version check (catalog_version = 1),
  constraint dsa_practice_attempts_title check (char_length(btrim(title)) between 1 and 160),
  constraint dsa_practice_attempts_status check (status in ('draft','completed','review')),
  constraint dsa_practice_attempts_mode check (mode in ('learn','recognition','untimed','timed','mixed','review')),
  constraint dsa_practice_attempts_duration check (
    (mode = 'timed' and duration_minutes between 10 and 120)
    or (mode <> 'timed' and duration_minutes is null)
  ),
  constraint dsa_practice_attempts_prior_exposure check (prior_exposure in ('unseen','prompt_seen','solution_seen','solved_before')),
  constraint dsa_practice_attempts_elapsed check (elapsed_seconds between 0 and 86400),
  constraint dsa_practice_attempts_review_reason check (review_reason is null or review_reason in ('error','elapsed','manual')),
  constraint dsa_practice_attempts_document check (public.dsa_practice_attempt_document_valid(document)),
  constraint dsa_practice_attempts_revision check (revision > 0),
  constraint dsa_practice_attempts_completed check (
    (status = 'draft' and completed_at is null)
    or (status in ('completed','review') and completed_at is not null)
  )
);

create index dsa_practice_attempts_user_recent_idx on public.dsa_practice_attempts (user_id, updated_at desc);
create index dsa_practice_attempts_user_question_idx on public.dsa_practice_attempts (user_id, question_id, updated_at desc);
create index dsa_practice_attempts_review_idx on public.dsa_practice_attempts (user_id, status, updated_at) where status = 'review';

create trigger dsa_practice_attempts_set_updated_at before update on public.dsa_practice_attempts
for each row execute function public.set_updated_at();

alter table public.dsa_practice_attempts enable row level security;
create policy "Owners can read DSA practice attempts" on public.dsa_practice_attempts
for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.create_dsa_practice_attempt(
  target_question_id text,
  target_catalog_version integer,
  target_title text,
  target_mode text,
  target_duration_minutes integer,
  target_prior_exposure text,
  target_document jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare current_user_id uuid := auth.uid(); new_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not exists (select 1 from public.dsa_question_catalog where id = target_question_id) or target_catalog_version <> 1
    then raise exception 'Unknown canonical DSA question version' using errcode = '23503'; end if;
  if char_length(btrim(coalesce(target_title,''))) not between 1 and 160 then raise exception 'Invalid title' using errcode = '23514'; end if;
  if target_mode not in ('learn','recognition','untimed','timed','mixed','review') then raise exception 'Invalid practice mode' using errcode = '23514'; end if;
  if not ((target_mode = 'timed' and target_duration_minutes between 10 and 120) or (target_mode <> 'timed' and target_duration_minutes is null))
    then raise exception 'Invalid practice duration' using errcode = '23514'; end if;
  if target_prior_exposure not in ('unseen','prompt_seen','solution_seen','solved_before') then raise exception 'Invalid prior exposure' using errcode = '23514'; end if;
  if not public.dsa_practice_attempt_document_valid(target_document) then raise exception 'Invalid DSA practice document' using errcode = '23514'; end if;
  insert into public.dsa_practice_attempts (user_id,question_id,catalog_version,title,mode,duration_minutes,prior_exposure,document)
  values (current_user_id,target_question_id,target_catalog_version,btrim(target_title),target_mode,target_duration_minutes,target_prior_exposure,target_document)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.save_dsa_practice_attempt(
  target_attempt_id uuid,
  target_expected_revision bigint,
  target_title text,
  target_status text,
  target_mode text,
  target_duration_minutes integer,
  target_prior_exposure text,
  target_elapsed_seconds integer,
  target_document jsonb
)
returns setof public.dsa_practice_attempts
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare current_user_id uuid := auth.uid(); completion_time timestamptz;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if target_attempt_id is null or target_expected_revision is null or target_expected_revision < 1 then raise exception 'Expected revision required' using errcode = '23514'; end if;
  if char_length(btrim(coalesce(target_title,''))) not between 1 and 160 then raise exception 'Invalid title' using errcode = '23514'; end if;
  if target_status not in ('draft','completed','review') then raise exception 'Invalid status' using errcode = '23514'; end if;
  if target_mode not in ('learn','recognition','untimed','timed','mixed','review') then raise exception 'Invalid practice mode' using errcode = '23514'; end if;
  if not ((target_mode = 'timed' and target_duration_minutes between 10 and 120) or (target_mode <> 'timed' and target_duration_minutes is null)) then raise exception 'Invalid practice duration' using errcode = '23514'; end if;
  if target_prior_exposure not in ('unseen','prompt_seen','solution_seen','solved_before') then raise exception 'Invalid prior exposure' using errcode = '23514'; end if;
  if target_elapsed_seconds is null or target_elapsed_seconds not between 0 and 86400 then raise exception 'Invalid elapsed time' using errcode = '23514'; end if;
  if not public.dsa_practice_attempt_document_valid(target_document) then raise exception 'Invalid DSA practice document' using errcode = '23514'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(current_user_id::text), pg_catalog.hashtext(target_attempt_id::text));
  completion_time := pg_catalog.clock_timestamp();
  return query update public.dsa_practice_attempts as attempt set
    title=btrim(target_title), status=target_status, mode=target_mode, duration_minutes=target_duration_minutes,
    prior_exposure=target_prior_exposure, elapsed_seconds=target_elapsed_seconds, document=target_document,
    review_reason=case
      when target_document->>'error_recovery' = 'unresolved' then 'error'
      when target_mode = 'timed' and target_elapsed_seconds > target_duration_minutes * 60 then 'elapsed'
      when target_status = 'review' then 'manual'
      else null
    end,
    revision=attempt.revision+1,
    completed_at=case when target_status in ('completed','review') then coalesce(attempt.completed_at,completion_time) else null end
  where attempt.id=target_attempt_id and attempt.user_id=current_user_id and attempt.revision=target_expected_revision
  returning attempt.*;
end;
$$;

revoke all on table public.dsa_practice_attempts from anon, authenticated;
grant select on table public.dsa_practice_attempts to authenticated;
revoke all on function public.dsa_practice_attempt_document_valid(jsonb) from public, anon, authenticated;
revoke all on function public.create_dsa_practice_attempt(text,integer,text,text,integer,text,jsonb) from public, anon, authenticated;
revoke all on function public.save_dsa_practice_attempt(uuid,bigint,text,text,text,integer,text,integer,jsonb) from public, anon, authenticated;
grant execute on function public.create_dsa_practice_attempt(text,integer,text,text,integer,text,jsonb) to authenticated;
grant execute on function public.save_dsa_practice_attempt(uuid,bigint,text,text,text,integer,text,integer,jsonb) to authenticated;

commit;
