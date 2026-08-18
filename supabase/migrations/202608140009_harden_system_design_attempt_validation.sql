begin;

alter table public.system_design_attempts
  add column if not exists revision bigint not null default 1;

alter table public.system_design_attempts
  drop constraint if exists system_design_attempts_revision,
  add constraint system_design_attempts_revision check (revision > 0);

create or replace function public.system_design_attempt_document_valid(document jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(document is not null
    and jsonb_typeof(document) = 'object'
    and octet_length(document::text) <= 200000
    and jsonb_typeof(document->'functional_requirements') = 'array'
    and jsonb_typeof(document->'non_functional_requirements') = 'array'
    and jsonb_typeof(document->'capacity') = 'object'
    and jsonb_typeof(document->'capacity'->'assumptions') = 'array'
    and jsonb_typeof(document->'capacity'->'calculations') = 'array'
    and jsonb_typeof(document->'apis') = 'array'
    and jsonb_typeof(document->'data_models') = 'array'
    and jsonb_typeof(document->'high_level_design') = 'string'
    and jsonb_typeof(document->'deep_dives') = 'array'
    and jsonb_typeof(document->'bottlenecks') = 'array'
    and jsonb_typeof(document->'failure_modes') = 'array'
    and jsonb_typeof(document->'tradeoffs') = 'array'
    and jsonb_typeof(document->'follow_ups') = 'array'
    and jsonb_typeof(document->'final_review_notes') = 'string', false);
$$;

drop function if exists public.save_system_design_attempt(uuid,timestamptz,text,text,text,uuid,jsonb);

create or replace function public.save_system_design_attempt(
  target_attempt_id uuid,
  target_expected_revision bigint,
  target_title text,
  target_status text,
  target_confidence text,
  target_application_id uuid,
  target_document jsonb
)
returns setof public.system_design_attempts
language plpgsql security definer set search_path = ''
as $$
declare current_user_id uuid := auth.uid(); practice_time timestamptz := statement_timestamp();
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if target_status not in ('draft','practiced','review') then raise exception 'Invalid attempt status' using errcode = '23514'; end if;
  if target_confidence is not null and target_confidence not in ('low','medium','high') then raise exception 'Invalid confidence' using errcode = '23514'; end if;
  if char_length(btrim(coalesce(target_title,''))) not between 1 and 160 then raise exception 'Invalid title' using errcode = '23514'; end if;
  if not public.system_design_attempt_document_valid(target_document) then raise exception 'Invalid attempt document' using errcode = '23514'; end if;
  if target_application_id is not null and not exists (
    select 1 from public.applications where id = target_application_id and user_id = current_user_id
  ) then raise exception 'Application is not owned by current user' using errcode = '23503'; end if;

  return query update public.system_design_attempts set
    title = btrim(target_title), status = target_status, confidence = nullif(target_confidence,''),
    application_id = target_application_id, document = target_document, revision = public.system_design_attempts.revision + 1,
    first_practiced_at = coalesce(first_practiced_at, case when target_status <> 'draft' then practice_time end),
    last_practiced_at = case when target_status <> 'draft' then practice_time else last_practiced_at end
  where id = target_attempt_id and user_id = current_user_id and revision = target_expected_revision
  returning *;
end;
$$;

revoke all on function public.system_design_attempt_document_valid(jsonb) from public;
revoke all on function public.save_system_design_attempt(uuid,bigint,text,text,text,uuid,jsonb) from public;
grant execute on function public.save_system_design_attempt(uuid,bigint,text,text,text,uuid,jsonb) to authenticated;

commit;
