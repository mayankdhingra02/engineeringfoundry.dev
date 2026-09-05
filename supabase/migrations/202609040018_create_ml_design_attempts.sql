begin;

create table public.ml_design_problem_catalog (
  problem_id text not null,
  problem_version integer not null,
  primary key (problem_id, problem_version),
  constraint ml_design_problem_catalog_id check (problem_id ~ '^[a-z0-9][a-z0-9-]{0,199}$'),
  constraint ml_design_problem_catalog_version check (problem_version > 0)
);

insert into public.ml_design_problem_catalog (problem_id, problem_version)
select problem_id, 1 from unnest(array[
  'personalized-recommendation',
  'social-content-feed-ranking',
  'search-ranking-retrieval',
  'autocomplete-query-suggestions',
  'ads-retrieval-ranking',
  'real-time-payment-fraud',
  'trust-safety-decision-system',
  'eta-prediction',
  'demand-forecasting',
  'feature-store',
  'ml-training-deployment-platform',
  'scalable-online-inference-service',
  'production-rag-assistant'
]) as problem_id;

create or replace function public.ml_design_attempt_document_valid(document jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  item text;
  entry_key text;
  entry_value jsonb;
  allowed_stages constant text[] := array['define','establish','construct','integrate','derisk','evolve'];
  allowed_dimensions constant text[] := array[
    'problem-framing','data-and-labels','metrics','architecture','ml-judgment',
    'production-engineering','experimentation','reliability-and-evolution',
    'risk-and-responsibility','communication'
  ];
  allowed_bands constant text[] := array['Needs development','Acceptable','Strong','Exceptional'];
begin
  if document is null
    or jsonb_typeof(document) <> 'object'
    or octet_length(document::text) > 200000
    or not (document ?& array[
      'assumptions','design_notes','completed_decide_sections','hints_used',
      'self_review','dimension_evidence','follow_up_actions','fresh_exposure'
    ])
    or document - array[
      'assumptions','design_notes','completed_decide_sections','hints_used',
      'self_review','dimension_evidence','follow_up_actions','fresh_exposure'
    ] <> '{}'::jsonb
    or jsonb_typeof(document->'assumptions') <> 'string'
    or length(document->>'assumptions') > 16000
    or jsonb_typeof(document->'design_notes') <> 'string'
    or length(document->>'design_notes') > 50000
    or jsonb_typeof(document->'completed_decide_sections') <> 'array'
    or jsonb_array_length(document->'completed_decide_sections') > 6
    or jsonb_typeof(document->'hints_used') <> 'number'
    or (document->>'hints_used') !~ '^\d+$'
    or (document->>'hints_used')::integer > 6
    or jsonb_typeof(document->'self_review') <> 'object'
    or jsonb_typeof(document->'dimension_evidence') <> 'object'
    or jsonb_typeof(document->'follow_up_actions') <> 'array'
    or jsonb_array_length(document->'follow_up_actions') > 20
    or jsonb_typeof(document->'fresh_exposure') <> 'boolean'
  then
    return false;
  end if;

  if (select count(*) from jsonb_array_elements_text(document->'completed_decide_sections'))
    <> (select count(distinct value) from jsonb_array_elements_text(document->'completed_decide_sections'))
  then
    return false;
  end if;
  for item in select value from jsonb_array_elements_text(document->'completed_decide_sections') loop
    if not item = any(allowed_stages) then return false; end if;
  end loop;

  for entry_key, entry_value in select key, value from jsonb_each(document->'self_review') loop
    if not entry_key = any(allowed_dimensions)
      or jsonb_typeof(entry_value) <> 'string'
      or not trim(both '"' from entry_value::text) = any(allowed_bands)
    then return false; end if;
  end loop;
  for entry_key, entry_value in select key, value from jsonb_each(document->'dimension_evidence') loop
    if not entry_key = any(allowed_dimensions)
      or jsonb_typeof(entry_value) <> 'string'
      or length(trim(both '"' from entry_value::text)) > 5000
    then return false; end if;
  end loop;
  for entry_value in select value from jsonb_array_elements(document->'follow_up_actions') loop
    if jsonb_typeof(entry_value) <> 'string' or length(entry_value #>> '{}') > 1000 then return false; end if;
  end loop;
  return true;
exception when others then
  return false;
end;
$$;

create table public.ml_design_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id text not null,
  problem_version integer not null,
  title text not null,
  status text not null default 'draft',
  mode text not null,
  duration_minutes integer,
  document jsonb not null,
  revision bigint not null default 1,
  first_practiced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ml_design_attempts_catalog_fkey foreign key (problem_id, problem_version)
    references public.ml_design_problem_catalog(problem_id, problem_version) on update cascade on delete restrict,
  constraint ml_design_attempts_title check (char_length(btrim(title)) between 1 and 160),
  constraint ml_design_attempts_status check (status in ('draft','practiced','review')),
  constraint ml_design_attempts_mode check (mode in ('guided','untimed','timed')),
  constraint ml_design_attempts_duration check (
    (mode = 'timed' and duration_minutes in (30,45,60))
    or (mode <> 'timed' and duration_minutes is null)
  ),
  constraint ml_design_attempts_document check (public.ml_design_attempt_document_valid(document)),
  constraint ml_design_attempts_revision check (revision > 0)
);

create index ml_design_attempts_user_recent_idx on public.ml_design_attempts (user_id, updated_at desc);
create index ml_design_attempts_user_problem_idx on public.ml_design_attempts (user_id, problem_id, updated_at desc);

create trigger ml_design_attempts_set_updated_at before update on public.ml_design_attempts
for each row execute function public.set_updated_at();

alter table public.ml_design_attempts enable row level security;

create policy "Owners can read ML Design attempts" on public.ml_design_attempts
for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.create_ml_design_attempt(
  target_problem_id text,
  target_problem_version integer,
  target_title text,
  target_mode text,
  target_duration_minutes integer,
  target_document jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  new_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not exists (
    select 1 from public.ml_design_problem_catalog
    where problem_id = target_problem_id and problem_version = target_problem_version
  ) then raise exception 'Unknown canonical ML Design problem version' using errcode = '23503'; end if;
  if char_length(btrim(coalesce(target_title,''))) not between 1 and 160 then raise exception 'Invalid title' using errcode = '23514'; end if;
  if target_mode not in ('guided','untimed','timed') then raise exception 'Invalid practice mode' using errcode = '23514'; end if;
  if not ((target_mode = 'timed' and target_duration_minutes in (30,45,60)) or (target_mode <> 'timed' and target_duration_minutes is null)) then
    raise exception 'Invalid practice duration' using errcode = '23514';
  end if;
  if not public.ml_design_attempt_document_valid(target_document) then raise exception 'Invalid ML Design attempt document' using errcode = '23514'; end if;

  insert into public.ml_design_attempts (
    user_id, problem_id, problem_version, title, mode, duration_minutes, document
  ) values (
    current_user_id, target_problem_id, target_problem_version, btrim(target_title),
    target_mode, target_duration_minutes, target_document
  ) returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.save_ml_design_attempt(
  target_attempt_id uuid,
  target_expected_revision bigint,
  target_title text,
  target_status text,
  target_mode text,
  target_duration_minutes integer,
  target_document jsonb
)
returns setof public.ml_design_attempts
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  practice_time timestamptz;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if target_attempt_id is null or target_expected_revision is null or target_expected_revision < 1 then raise exception 'Expected ML Design attempt revision is required' using errcode = '23514'; end if;
  if char_length(btrim(coalesce(target_title,''))) not between 1 and 160 then raise exception 'Invalid title' using errcode = '23514'; end if;
  if target_status not in ('draft','practiced','review') then raise exception 'Invalid attempt status' using errcode = '23514'; end if;
  if target_mode not in ('guided','untimed','timed') then raise exception 'Invalid practice mode' using errcode = '23514'; end if;
  if not ((target_mode = 'timed' and target_duration_minutes in (30,45,60)) or (target_mode <> 'timed' and target_duration_minutes is null)) then raise exception 'Invalid practice duration' using errcode = '23514'; end if;
  if not public.ml_design_attempt_document_valid(target_document) then raise exception 'Invalid ML Design attempt document' using errcode = '23514'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(current_user_id::text), pg_catalog.hashtext(target_attempt_id::text));
  practice_time := pg_catalog.clock_timestamp();
  return query update public.ml_design_attempts as attempt set
    title = btrim(target_title),
    status = target_status,
    mode = target_mode,
    duration_minutes = target_duration_minutes,
    document = target_document,
    revision = attempt.revision + 1,
    first_practiced_at = coalesce(attempt.first_practiced_at, case when target_status <> 'draft' then practice_time end)
  where attempt.id = target_attempt_id
    and attempt.user_id = current_user_id
    and attempt.revision = target_expected_revision
  returning attempt.*;
end;
$$;

create or replace function public.delete_ml_design_attempt_if_revision(
  target_attempt_id uuid,
  target_problem_id text,
  target_expected_revision bigint
)
returns table(attempt_id uuid)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if target_attempt_id is null or target_expected_revision is null or target_expected_revision < 1 then raise exception 'Expected ML Design attempt revision is required' using errcode = '23514'; end if;
  if not exists (select 1 from public.ml_design_problem_catalog where problem_id = target_problem_id) then raise exception 'Unknown canonical ML Design problem' using errcode = '23503'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(current_user_id::text), pg_catalog.hashtext(target_attempt_id::text));
  return query delete from public.ml_design_attempts as attempt
  where attempt.id = target_attempt_id
    and attempt.user_id = current_user_id
    and attempt.problem_id = target_problem_id
    and attempt.revision = target_expected_revision
  returning attempt.id;
end;
$$;

revoke all on table public.ml_design_problem_catalog, public.ml_design_attempts from anon, authenticated;
grant select on table public.ml_design_problem_catalog to anon, authenticated;
grant select on table public.ml_design_attempts to authenticated;
revoke all on function public.ml_design_attempt_document_valid(jsonb) from public, anon, authenticated;
revoke all on function public.create_ml_design_attempt(text,integer,text,text,integer,jsonb) from public, anon, authenticated;
revoke all on function public.save_ml_design_attempt(uuid,bigint,text,text,text,integer,jsonb) from public, anon, authenticated;
revoke all on function public.delete_ml_design_attempt_if_revision(uuid,text,bigint) from public, anon, authenticated;
grant execute on function public.create_ml_design_attempt(text,integer,text,text,integer,jsonb) to authenticated;
grant execute on function public.save_ml_design_attempt(uuid,bigint,text,text,text,integer,jsonb) to authenticated;
grant execute on function public.delete_ml_design_attempt_if_revision(uuid,text,bigint) to authenticated;

commit;
