begin;

create table public.system_design_item_catalog (
  id text not null,
  item_type text not null,
  primary key (id, item_type),
  constraint system_design_item_catalog_id check (id ~ '^[a-z0-9][a-z0-9-]{0,199}$'),
  constraint system_design_item_catalog_type check (item_type in ('concept', 'design_problem'))
);

insert into public.system_design_item_catalog (id, item_type)
select id, 'concept' from unnest(array[
  'introduction','interview-framework','requirements','estimation','core-system-properties','request-path','dns','http','rest','pagination','idempotent-apis','grpc','graphql','realtime-communication','reverse-proxies','load-balancing','api-gateway','service-discovery','cdn','rate-limiting','data-modeling','sql-vs-nosql','sql-databases','key-value-stores','document-databases','wide-column-databases','database-indexes','transactions','isolation-levels','replication','sharding','consistent-hashing','consistency-models','cap-theorem','pacelc','denormalization','unique-id-generation','object-storage','large-file-uploads','time-series-databases','caching','cache-placement','cache-aside','read-through','write-through','write-behind','cache-ttl','cache-eviction','cache-invalidation','cache-stampedes','hot-keys','cache-penetration','cache-warming','distributed-caching','cache-failure-modes','redis-caching','sync-vs-async','message-queues','producers-consumers','queue-vs-pubsub','pub-sub','event-streaming','queue-vs-stream','partitions','consumer-groups','message-ordering','delivery-semantics','idempotent-consumers','message-retries','dead-letter-queues','deduplication','backpressure','event-driven-architecture','event-sourcing','transactional-outbox','change-data-capture','kafka','kafka-partitions-replication','kafka-consumer-groups-offsets','kafka-delivery-guarantees','kafka-vs-queues','rabbitmq-sqs','flink','failure-thinking','timeouts','retries','exponential-backoff-jitter','idempotency','circuit-breaker','bulkheads','graceful-degradation','load-shedding','backpressure-reliability','health-checks','failover','distributed-locks','leases-fencing-tokens','leader-election','quorums','distributed-consensus','raft','distributed-transactions','two-phase-commit','saga','multi-region','active-passive-active-active','disaster-recovery','rpo-rto','partial-failure','full-text-search','inverted-indexes','search-engine-concepts','search-autocomplete','tries-prefix-search','geospatial-search','geohashing','quadtrees','notification-delivery','job-schedulers','leaderboards','distributed-counters','web-crawling','media-processing','bloom-filters','hyperloglog','count-min-sketch','collaborative-editing','operational-transformation','crdts','vector-search','embeddings-infrastructure','model-serving','feature-stores','choosing-specialized-blocks','redis','kafka-deep-dive','postgresql','dynamodb','elasticsearch','s3','cassandra','rabbitmq','sqs','zookeeper','etcd','flink-deep-dive'
]) as id;

insert into public.system_design_item_catalog (id, item_type)
select id, 'design_problem' from unnest(array[
  'url-shortener','rate-limiter','pastebin','leaderboard','notification-service','search-autocomplete','chat-system','news-feed','job-scheduler','web-crawler','cloud-file-storage','video-streaming','ride-sharing','nearby-search','ticketmaster','payment-system','metrics-platform','distributed-cache','distributed-queue','key-value-store','kafka-platform','search-engine','collaborative-editor','event-analytics','ml-inference-service','feature-store','vector-search'
]) as id;

create table public.system_design_item_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  item_type text not null,
  status text not null default 'not_started',
  confidence text,
  bookmarked boolean not null default false,
  notes text,
  first_reviewed_at timestamptz,
  last_practiced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id),
  constraint system_design_item_progress_catalog_fkey foreign key (item_id, item_type)
    references public.system_design_item_catalog(id, item_type) on update cascade on delete restrict,
  constraint system_design_item_progress_status check (status in ('not_started','reviewed','review','comfortable')),
  constraint system_design_item_progress_confidence check (confidence is null or confidence in ('low','medium','high')),
  constraint system_design_item_progress_notes check (notes is null or char_length(notes) <= 10000),
  constraint system_design_item_progress_first_review check (status = 'not_started' or first_reviewed_at is not null)
);

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

create table public.system_design_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  problem_id text not null,
  catalog_item_type text not null default 'design_problem',
  application_id uuid,
  title text not null,
  status text not null default 'draft',
  confidence text,
  document jsonb not null,
  revision bigint not null default 1,
  first_practiced_at timestamptz,
  last_practiced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint system_design_attempts_application_owner_fkey foreign key (application_id, user_id)
    references public.applications(id, user_id) on delete set null (application_id),
  constraint system_design_attempts_catalog_fkey foreign key (problem_id, catalog_item_type)
    references public.system_design_item_catalog(id, item_type) on update cascade on delete restrict,
  constraint system_design_attempts_catalog_type check (catalog_item_type = 'design_problem'),
  constraint system_design_attempts_title check (char_length(btrim(title)) between 1 and 160),
  constraint system_design_attempts_status check (status in ('draft','practiced','review')),
  constraint system_design_attempts_confidence check (confidence is null or confidence in ('low','medium','high')),
  constraint system_design_attempts_document check (public.system_design_attempt_document_valid(document))
  ,constraint system_design_attempts_revision check (revision > 0)
);

create index system_design_progress_user_status_idx_v2 on public.system_design_item_progress (user_id, status, updated_at desc);
create index system_design_progress_user_recent_idx_v2 on public.system_design_item_progress (user_id, last_practiced_at desc nulls last);
create index system_design_progress_user_bookmarked_idx_v2 on public.system_design_item_progress (user_id, bookmarked) where bookmarked;
create index system_design_attempts_user_recent_idx on public.system_design_attempts (user_id, updated_at desc);
create index system_design_attempts_user_problem_idx on public.system_design_attempts (user_id, problem_id, updated_at desc);
create index system_design_attempts_user_application_idx on public.system_design_attempts (user_id, application_id, updated_at desc) where application_id is not null;

create trigger system_design_item_progress_set_updated_at before update on public.system_design_item_progress
for each row execute function public.set_updated_at();
create trigger system_design_attempts_set_updated_at before update on public.system_design_attempts
for each row execute function public.set_updated_at();

alter table public.system_design_item_progress enable row level security;
alter table public.system_design_attempts enable row level security;

create policy "Owners can read System Design item progress" on public.system_design_item_progress
for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners can delete System Design item progress" on public.system_design_item_progress
for delete to authenticated using ((select auth.uid()) = user_id);
create policy "Owners can read System Design attempts" on public.system_design_attempts
for select to authenticated using ((select auth.uid()) = user_id);

create or replace function public.save_system_design_item_progress(
  target_item_id text,
  target_item_type text,
  target_status text,
  target_confidence text,
  target_bookmarked boolean,
  target_notes text
)
returns setof public.system_design_item_progress
language plpgsql security definer set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  practice_time timestamptz := statement_timestamp();
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if target_item_type not in ('concept','design_problem') then raise exception 'Invalid item type' using errcode = '23514'; end if;
  if not exists (select 1 from public.system_design_item_catalog where id = target_item_id and item_type = target_item_type) then
    raise exception 'Unknown canonical System Design item' using errcode = '23503';
  end if;
  if target_status not in ('not_started','reviewed','review','comfortable') then raise exception 'Invalid status' using errcode = '23514'; end if;
  if target_confidence is not null and target_confidence not in ('low','medium','high') then raise exception 'Invalid confidence' using errcode = '23514'; end if;
  if char_length(coalesce(target_notes, '')) > 10000 then raise exception 'Notes are too long' using errcode = '22001'; end if;

  return query insert into public.system_design_item_progress (
    user_id,item_id,item_type,status,confidence,bookmarked,notes,first_reviewed_at,last_practiced_at
  ) values (
    current_user_id,target_item_id,target_item_type,target_status,nullif(target_confidence,''),target_bookmarked,nullif(btrim(target_notes),''),
    case when target_status = 'not_started' then null else practice_time end,
    case when target_status = 'not_started' and target_confidence is null and nullif(btrim(target_notes),'') is null then null else practice_time end
  ) on conflict (user_id,item_type,item_id) do update set
    status = excluded.status,
    confidence = excluded.confidence,
    bookmarked = excluded.bookmarked,
    notes = excluded.notes,
    first_reviewed_at = coalesce(public.system_design_item_progress.first_reviewed_at, case when excluded.status = 'not_started' then null else practice_time end),
    last_practiced_at = case when
      public.system_design_item_progress.status is distinct from excluded.status or
      public.system_design_item_progress.confidence is distinct from excluded.confidence or
      public.system_design_item_progress.notes is distinct from excluded.notes
      then practice_time else public.system_design_item_progress.last_practiced_at end
  returning *;
end;
$$;

create or replace function public.create_system_design_attempt(
  target_problem_id text,
  target_application_id uuid,
  target_title text,
  target_document jsonb
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare current_user_id uuid := auth.uid(); new_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if not exists (select 1 from public.system_design_item_catalog where id = target_problem_id and item_type = 'design_problem') then
    raise exception 'Unknown canonical System Design problem' using errcode = '23503';
  end if;
  if target_application_id is not null and not exists (
    select 1 from public.applications where id = target_application_id and user_id = current_user_id
  ) then raise exception 'Application is not owned by current user' using errcode = '23503'; end if;
  if char_length(btrim(coalesce(target_title,''))) not between 1 and 160 then raise exception 'Invalid title' using errcode = '23514'; end if;
  if not public.system_design_attempt_document_valid(target_document) then raise exception 'Invalid attempt document' using errcode = '23514'; end if;
  insert into public.system_design_attempts (user_id,problem_id,application_id,title,document)
  values (current_user_id,target_problem_id,target_application_id,btrim(target_title),target_document)
  returning id into new_id;
  return new_id;
end;
$$;

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

create or replace function public.delete_system_design_attempt(target_attempt_id uuid)
returns boolean language sql security definer set search_path = ''
as $$
  with deleted as (
    delete from public.system_design_attempts where id = target_attempt_id and user_id = auth.uid() returning 1
  ) select exists(select 1 from deleted);
$$;

revoke all on table public.system_design_item_catalog, public.system_design_item_progress, public.system_design_attempts from anon, authenticated;
grant select on table public.system_design_item_catalog to anon, authenticated;
grant select, delete on table public.system_design_item_progress to authenticated;
grant select on table public.system_design_attempts to authenticated;
revoke all on function public.system_design_attempt_document_valid(jsonb) from public;
revoke all on function public.save_system_design_item_progress(text,text,text,text,boolean,text) from public;
revoke all on function public.create_system_design_attempt(text,uuid,text,jsonb) from public;
revoke all on function public.save_system_design_attempt(uuid,bigint,text,text,text,uuid,jsonb) from public;
revoke all on function public.delete_system_design_attempt(uuid) from public;
grant execute on function public.save_system_design_item_progress(text,text,text,text,boolean,text) to authenticated;
grant execute on function public.create_system_design_attempt(text,uuid,text,jsonb) to authenticated;
grant execute on function public.save_system_design_attempt(uuid,bigint,text,text,text,uuid,jsonb) to authenticated;
grant execute on function public.delete_system_design_attempt(uuid) to authenticated;

commit;
