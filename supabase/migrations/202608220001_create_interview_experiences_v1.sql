begin;

create table public.interview_experiences (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft','submitted','needs_changes','approved','rejected','archived','withdrawn')),
  company_name text not null default '' check (char_length(company_name) <= 120),
  role_title text not null default '' check (char_length(role_title) <= 160),
  role_level text check (role_level in ('Entry','Mid','Senior','Staff+','Management','Prefer not to say')),
  region text check (char_length(region) <= 120),
  interview_date date,
  summary text not null default '' check (char_length(summary) <= 4000),
  preparation_lessons text check (char_length(preparation_lessons) <= 3000),
  public_identity text not null default 'anonymous' check (public_identity in ('anonymous','username')),
  publication_consent boolean not null default false,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  review_note text check (char_length(review_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_experiences_submission_complete check (
    status not in ('submitted','needs_changes','approved','rejected','archived')
    or (char_length(trim(company_name)) > 0 and char_length(trim(role_title)) > 0 and char_length(trim(summary)) >= 40 and publication_consent)
  )
);

create table public.interview_experience_rounds (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.interview_experiences(id) on delete cascade,
  position smallint not null check (position between 1 and 20),
  round_type text not null check (char_length(round_type) between 1 and 80),
  topic_labels text[] not null default '{}' check (cardinality(topic_labels) <= 12),
  process_notes text check (char_length(process_notes) <= 1500),
  unique (experience_id, position)
);

create index interview_experiences_public_directory_idx on public.interview_experiences (company_name, interview_date desc, created_at desc) where status = 'approved' and publication_consent;
create index interview_experiences_author_idx on public.interview_experiences (author_id, updated_at desc);
create index interview_experience_rounds_experience_idx on public.interview_experience_rounds (experience_id, position);

create trigger interview_experiences_set_updated_at before update on public.interview_experiences for each row execute function public.set_updated_at();

alter table public.interview_experiences enable row level security;
alter table public.interview_experience_rounds enable row level security;

create policy "approved experiences are publicly readable" on public.interview_experiences for select using (status = 'approved' and publication_consent);
create policy "authors read own experiences" on public.interview_experiences for select to authenticated using (author_id = auth.uid());
create policy "approved experience rounds are publicly readable" on public.interview_experience_rounds for select using (exists (select 1 from public.interview_experiences e where e.id = experience_id and e.status = 'approved' and e.publication_consent));
create policy "authors read own experience rounds" on public.interview_experience_rounds for select to authenticated using (exists (select 1 from public.interview_experiences e where e.id = experience_id and e.author_id = auth.uid()));

revoke all on public.interview_experiences, public.interview_experience_rounds from anon;
revoke insert, update, delete on public.interview_experiences, public.interview_experience_rounds from authenticated;
grant select on public.interview_experiences, public.interview_experience_rounds to anon, authenticated;

create or replace function public.save_interview_experience_draft(target_id uuid, payload jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid(); saved_id uuid; item jsonb; item_index integer := 0;
  company text := left(trim(coalesce(payload->>'company_name','')), 120);
  role text := left(trim(coalesce(payload->>'role_title','')), 160);
  level text := nullif(payload->>'role_level',''); region_value text := nullif(left(trim(coalesce(payload->>'region','')),120),'');
  summary_value text := left(trim(coalesce(payload->>'summary','')),4000);
  lessons text := nullif(left(trim(coalesce(payload->>'preparation_lessons','')),3000),'');
  identity text := coalesce(payload->>'public_identity','anonymous');
  consent boolean := coalesce((payload->>'publication_consent')::boolean, false);
  date_value date := nullif(payload->>'interview_date','')::date;
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if level is not null and level not in ('Entry','Mid','Senior','Staff+','Management','Prefer not to say') then raise exception 'Invalid level' using errcode='23514'; end if;
  if identity not in ('anonymous','username') then raise exception 'Invalid public identity choice' using errcode='23514'; end if;
  if jsonb_typeof(coalesce(payload->'rounds','[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(payload->'rounds','[]'::jsonb)) > 20 then raise exception 'Invalid rounds' using errcode='23514'; end if;
  if target_id is not null and not exists (select 1 from public.interview_experiences where id = target_id and author_id = uid and status in ('draft','needs_changes','withdrawn')) then raise exception 'Experience cannot be edited' using errcode='42501'; end if;
  insert into public.interview_experiences(id,author_id,company_name,role_title,role_level,region,interview_date,summary,preparation_lessons,public_identity,publication_consent,status)
  values (coalesce(target_id,gen_random_uuid()),uid,company,role,level,region_value,date_value,summary_value,lessons,identity,consent,'draft')
  on conflict (id) do update set company_name=excluded.company_name, role_title=excluded.role_title, role_level=excluded.role_level, region=excluded.region, interview_date=excluded.interview_date, summary=excluded.summary, preparation_lessons=excluded.preparation_lessons, public_identity=excluded.public_identity, publication_consent=excluded.publication_consent, status='draft', submitted_at=null
  returning id into saved_id;
  delete from public.interview_experience_rounds where experience_id = saved_id;
  for item in select value from jsonb_array_elements(coalesce(payload->'rounds','[]'::jsonb)) loop
    item_index := item_index + 1;
    if nullif(trim(item->>'round_type'),'') is null or char_length(item->>'round_type') > 80 or jsonb_typeof(coalesce(item->'topic_labels','[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(item->'topic_labels','[]'::jsonb)) > 12 then raise exception 'Invalid round' using errcode='23514'; end if;
    insert into public.interview_experience_rounds(experience_id,position,round_type,topic_labels,process_notes)
    values (saved_id,item_index,left(trim(item->>'round_type'),80),array(select left(value,80) from jsonb_array_elements_text(coalesce(item->'topic_labels','[]'::jsonb)) value),nullif(left(trim(coalesce(item->>'process_notes','')),1500),''));
  end loop;
  return saved_id;
end $$;

create or replace function public.submit_interview_experience(target_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  update public.interview_experiences set status='submitted', submitted_at=transaction_timestamp(), review_note=null
  where id=target_id and author_id=uid and status in ('draft','needs_changes','withdrawn');
  if not found then raise exception 'Experience cannot be submitted' using errcode='42501'; end if;
  return true;
end $$;

create or replace function public.withdraw_interview_experience(target_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  update public.interview_experiences set status='withdrawn' where id=target_id and author_id=uid and status in ('draft','submitted','needs_changes','approved');
  if not found then raise exception 'Experience cannot be withdrawn' using errcode='42501'; end if;
  return true;
end $$;

create or replace function public.delete_interview_experience(target_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  delete from public.interview_experiences where id=target_id and author_id=uid and status in ('draft','withdrawn','rejected');
  if not found then raise exception 'Experience cannot be deleted' using errcode='42501'; end if;
  return true;
end $$;

revoke all on function public.save_interview_experience_draft(uuid,jsonb), public.submit_interview_experience(uuid), public.withdraw_interview_experience(uuid), public.delete_interview_experience(uuid) from public;
grant execute on function public.save_interview_experience_draft(uuid,jsonb), public.submit_interview_experience(uuid), public.withdraw_interview_experience(uuid), public.delete_interview_experience(uuid) to authenticated;

commit;
