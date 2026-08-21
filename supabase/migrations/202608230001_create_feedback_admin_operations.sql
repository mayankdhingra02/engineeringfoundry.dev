begin;

-- P0.8 is intentionally a small operational boundary, not a CMS. Admin
-- membership is explicit and server/database-enforced; it is never inferred
-- from an email address, a browser flag, or a public environment variable.
create table public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default transaction_timestamp()
);

create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null unique check (reference_id ~ '^EF-FB-[A-F0-9]{32}$'),
  actor_id uuid references auth.users(id) on delete set null,
  submitted_as_authenticated boolean not null default false,
  category text not null check (category in ('bug','suggestion','content_source','accessibility','privacy_safety','other')),
  message text not null check (char_length(message) between 1 and 5000),
  page_context text check (page_context is null or (char_length(page_context) <= 180 and page_context ~ '^/[A-Za-z0-9/_-]*(/\.\.\.)?$')),
  contact_email text check (contact_email is null or (char_length(contact_email) <= 254 and contact_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  contact_consent boolean not null default false,
  status text not null default 'new' check (status in ('new','triaged','planned','resolved','closed','spam')),
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  created_at timestamptz not null default transaction_timestamp(),
  updated_at timestamptz not null default transaction_timestamp(),
  constraint feedback_contact_requires_consent check (contact_email is null or contact_consent)
);

-- A hash of an opaque, HttpOnly browser token is the smallest repository-side
-- anonymous throttle. It is not an IP address and contains no feedback text.
-- A production edge/WAF remains the required stronger control against token
-- rotation and distributed abuse; see docs/feedback-admin-operations.md.
create table public.feedback_submission_rate_limits (
  subject_key text primary key check (subject_key ~ '^(anon:[0-9a-f]{64}|user:[0-9a-f-]{36})$'),
  window_started_at timestamptz not null default transaction_timestamp(),
  request_count integer not null default 0 check (request_count between 0 and 10000),
  last_request_at timestamptz not null default transaction_timestamp(),
  created_at timestamptz not null default transaction_timestamp()
);

create table public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  admin_actor_id uuid references auth.users(id) on delete set null,
  action_type text not null check (action_type in ('feedback_status_changed','feedback_note_updated','experience_moderated')),
  target_type text not null check (target_type in ('feedback_submission','interview_experience')),
  target_id uuid not null,
  prior_status text,
  new_status text,
  created_at timestamptz not null default transaction_timestamp()
);

create index feedback_submissions_queue_idx on public.feedback_submissions (status, created_at desc);
create index feedback_submissions_category_idx on public.feedback_submissions (category, created_at desc);
create index admin_audit_events_target_idx on public.admin_audit_events (target_type, target_id, created_at desc);

comment on table public.feedback_submissions is 'Private P0.8 launch feedback. Submitters have no read, update, or delete access.';
comment on table public.feedback_submission_rate_limits is 'Opaque anonymous-token and authenticated-actor feedback throttle state. No raw IP addresses are stored.';
comment on table public.admin_audit_events is 'Minimal admin mutation audit trail; deliberately excludes feedback and contributor-body text.';

alter table public.admin_memberships enable row level security;
alter table public.feedback_submissions enable row level security;
alter table public.feedback_submission_rate_limits enable row level security;
alter table public.admin_audit_events enable row level security;

-- This security-definer predicate is the single database authorization source
-- used by policies and mutation RPCs. It derives the actor from auth.uid().
create or replace function public.is_current_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (select 1 from public.admin_memberships where user_id = auth.uid());
$$;

-- Store public contexts only after removing query/fragment data and collapsing
-- every private route family to a stable coarse pattern. A direct RPC caller
-- cannot preserve a Behavioral story, application, answer, or admin identifier.
create or replace function public.sanitize_feedback_page_context(raw_context text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare clean text := left(trim(coalesce(raw_context, '')), 500);
begin
  clean := split_part(split_part(clean, '?', 1), '#', 1);
  clean := regexp_replace(clean, '/+$', '');
  if clean = '' then return null; end if;
  if left(clean, 1) <> '/' then return null; end if;

  if clean ~ '^/applications(/|$)' then return case when clean = '/applications' then clean else '/applications/...' end; end if;
  if clean ~ '^/behavioral/questions(/|$)' then return case when clean = '/behavioral/questions' then clean else '/behavioral/questions/...' end; end if;
  if clean ~ '^/behavioral/stories(/|$)' then return case when clean = '/behavioral/stories' then clean else '/behavioral/stories/...' end; end if;
  if clean ~ '^/behavioral/workspace(/|$)' then return '/behavioral/workspace'; end if;
  if clean ~ '^/calendar(/|$)' then return '/calendar'; end if;
  if clean ~ '^/dashboard(/|$)' then return '/dashboard'; end if;
  if clean ~ '^/interview-playbook(/|$)' then return '/interview-playbook'; end if;
  if clean ~ '^/interviews(/|$)' then return case when clean = '/interviews' then clean else '/interviews/...' end; end if;
  if clean ~ '^/settings(/|$)' then return case when clean = '/settings' then clean else '/settings/...' end; end if;
  if clean ~ '^/admin(/|$)' then return '/admin'; end if;
  if clean ~ '^/system-design/problems/[^/]+/practice(/|$)' then return '/system-design/problems/.../practice/...'; end if;

  if clean !~ '^/[A-Za-z0-9/_-]{0,180}$' then return null; end if;
  return clean;
end;
$$;

create or replace function public.consume_feedback_submission_rate_limit(anonymous_subject text)
returns table (allowed boolean, retry_after_seconds integer, remaining integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  subject text;
  now_ts timestamptz := transaction_timestamp();
  window_seconds constant integer := 900;
  max_requests constant integer := 4;
  state public.feedback_submission_rate_limits%rowtype;
begin
  if actor_id is null then
    if anonymous_subject is null or anonymous_subject !~ '^[0-9a-f]{64}$' then
      raise exception 'Invalid anonymous feedback subject' using errcode = '22023';
    end if;
    subject := 'anon:' || anonymous_subject;
  else
    subject := 'user:' || actor_id::text;
  end if;

  insert into public.feedback_submission_rate_limits as limits (subject_key, window_started_at, request_count, last_request_at)
  values (subject, now_ts, 0, now_ts)
  on conflict (subject_key) do nothing;

  select * into state from public.feedback_submission_rate_limits where subject_key = subject for update;
  if state.window_started_at <= now_ts - make_interval(secs => window_seconds) then
    state.window_started_at := now_ts;
    state.request_count := 0;
  end if;

  if state.request_count >= max_requests then
    update public.feedback_submission_rate_limits
      set last_request_at = now_ts
      where subject_key = subject;
    return query select false, greatest(1, ceil(extract(epoch from (state.window_started_at + make_interval(secs => window_seconds) - now_ts)))::integer), 0;
    return;
  end if;

  update public.feedback_submission_rate_limits
    set window_started_at = state.window_started_at,
        request_count = state.request_count + 1,
        last_request_at = now_ts
    where subject_key = subject;
  return query select true, 0, max_requests - state.request_count - 1;
end;
$$;

create or replace function public.submit_feedback_submission(payload jsonb, anonymous_subject text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  category_value text := lower(trim(coalesce(payload->>'category', '')));
  message_value text := trim(coalesce(payload->>'message', ''));
  contact_value text := nullif(lower(trim(coalesce(payload->>'contact_email', ''))), '');
  consent_value boolean := coalesce((payload->>'contact_consent')::boolean, false);
  context_value text := public.sanitize_feedback_page_context(payload->>'page_context');
  throttle record;
  reference_value text := 'EF-FB-' || upper(replace(gen_random_uuid()::text, '-', ''));
begin
  if jsonb_typeof(payload) <> 'object' then raise exception 'Invalid feedback payload' using errcode = '22023'; end if;
  if category_value not in ('bug','suggestion','content_source','accessibility','privacy_safety','other') then raise exception 'Invalid feedback category' using errcode = '22023'; end if;
  if char_length(message_value) < 1 or char_length(message_value) > 5000 then raise exception 'Invalid feedback message' using errcode = '22023'; end if;
  if contact_value is not null and (char_length(contact_value) > 254 or contact_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then raise exception 'Invalid contact email' using errcode = '22023'; end if;
  if contact_value is not null and not consent_value then raise exception 'Contact consent is required' using errcode = '22023'; end if;

  select * into throttle from public.consume_feedback_submission_rate_limit(anonymous_subject);
  if not throttle.allowed then raise exception 'Feedback submission limit reached' using errcode = 'P0001'; end if;

  insert into public.feedback_submissions (reference_id, actor_id, submitted_as_authenticated, category, message, page_context, contact_email, contact_consent)
  values (reference_value, actor_id, actor_id is not null, category_value, message_value, context_value, contact_value, contact_value is not null and consent_value);
  return reference_value;
end;
$$;

create or replace function public.update_feedback_submission(target_id uuid, next_status text, next_note text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare old_status text; actor_id uuid := auth.uid(); sanitized_note text := nullif(trim(coalesce(next_note, '')), '');
begin
  if not public.is_current_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  if next_status not in ('new','triaged','planned','resolved','closed','spam') then raise exception 'Invalid feedback status' using errcode = '22023'; end if;
  if sanitized_note is not null and char_length(sanitized_note) > 2000 then raise exception 'Invalid feedback note' using errcode = '22023'; end if;
  select status into old_status from public.feedback_submissions where id = target_id for update;
  if not found then raise exception 'Feedback submission not found' using errcode = 'P0002'; end if;
  update public.feedback_submissions set status = next_status, admin_note = sanitized_note, updated_at = transaction_timestamp() where id = target_id;
  insert into public.admin_audit_events (admin_actor_id, action_type, target_type, target_id, prior_status, new_status)
  values (actor_id, case when old_status is distinct from next_status then 'feedback_status_changed' else 'feedback_note_updated' end, 'feedback_submission', target_id, old_status, next_status);
  return true;
end;
$$;

create or replace function public.moderate_interview_experience(target_id uuid, next_status text, moderation_note text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare old_status text; actor_id uuid := auth.uid(); sanitized_note text := nullif(trim(coalesce(moderation_note, '')), '');
begin
  if not public.is_current_admin() then raise exception 'Administrator access required' using errcode = '42501'; end if;
  if next_status not in ('needs_changes','approved','rejected') then raise exception 'Invalid moderation status' using errcode = '22023'; end if;
  if sanitized_note is not null and char_length(sanitized_note) > 1000 then raise exception 'Invalid moderation note' using errcode = '22023'; end if;
  select status into old_status from public.interview_experiences where id = target_id for update;
  if not found then raise exception 'Interview experience not found' using errcode = 'P0002'; end if;
  if old_status not in ('submitted','needs_changes') then raise exception 'Experience is not awaiting moderation' using errcode = '42501'; end if;
  update public.interview_experiences set status = next_status, review_note = sanitized_note, reviewed_at = transaction_timestamp() where id = target_id;
  insert into public.admin_audit_events (admin_actor_id, action_type, target_type, target_id, prior_status, new_status)
  values (actor_id, 'experience_moderated', 'interview_experience', target_id, old_status, next_status);
  return true;
end;
$$;

revoke all on table public.admin_memberships, public.feedback_submissions, public.feedback_submission_rate_limits, public.admin_audit_events from anon, authenticated;
grant select on table public.feedback_submissions, public.admin_audit_events to authenticated;

create policy "admins read feedback submissions" on public.feedback_submissions for select to authenticated using (public.is_current_admin());
create policy "admins read audit events" on public.admin_audit_events for select to authenticated using (public.is_current_admin());
create policy "admins read all interview experiences" on public.interview_experiences for select to authenticated using (public.is_current_admin());
create policy "admins read all interview experience rounds" on public.interview_experience_rounds for select to authenticated using (exists (select 1 from public.interview_experiences e where e.id = interview_experience_rounds.experience_id and public.is_current_admin()));

revoke all on function public.is_current_admin(), public.sanitize_feedback_page_context(text), public.consume_feedback_submission_rate_limit(text), public.submit_feedback_submission(jsonb,text), public.update_feedback_submission(uuid,text,text), public.moderate_interview_experience(uuid,text,text) from public;
grant execute on function public.is_current_admin() to authenticated;
grant execute on function public.submit_feedback_submission(jsonb,text) to anon, authenticated;
grant execute on function public.update_feedback_submission(uuid,text,text), public.moderate_interview_experience(uuid,text,text) to authenticated;

commit;
