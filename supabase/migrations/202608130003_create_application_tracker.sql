begin;

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  company_slug text,
  company_logo_url text,
  role_title text not null,
  role_level text,
  location text,
  job_url text,
  application_date date,
  source text,
  status text not null default 'Applied',
  recruiter_name text,
  recruiter_email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_company_name_length check (char_length(trim(company_name)) between 1 and 120),
  constraint applications_company_slug_format check (company_slug is null or company_slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  constraint applications_company_logo_url check (company_logo_url is null or (char_length(company_logo_url) <= 1000 and company_logo_url ~* '^https?://')),
  constraint applications_role_title_length check (char_length(trim(role_title)) between 1 and 120),
  constraint applications_role_level_length check (role_level is null or char_length(role_level) <= 80),
  constraint applications_location_length check (location is null or char_length(location) <= 160),
  constraint applications_job_url check (job_url is null or (char_length(job_url) <= 1000 and job_url ~* '^https?://')),
  constraint applications_source_length check (source is null or char_length(source) <= 100),
  constraint applications_status check (status in ('Interested', 'Applied', 'Recruiter Screen', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn', 'On Hold')),
  constraint applications_recruiter_name_length check (recruiter_name is null or char_length(recruiter_name) <= 120),
  constraint applications_recruiter_email check (recruiter_email is null or (char_length(recruiter_email) <= 254 and recruiter_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  constraint applications_notes_length check (notes is null or char_length(notes) <= 10000)
);

create table public.interview_rounds (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  round_number integer not null,
  round_name text not null,
  round_type text not null,
  scheduled_at timestamptz,
  duration_minutes integer,
  timezone text,
  interviewer_name text,
  interviewer_role text,
  meeting_link text,
  location text,
  status text not null default 'Planned',
  result text not null default 'Pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_rounds_number_positive check (round_number > 0),
  constraint interview_rounds_name_length check (char_length(trim(round_name)) between 1 and 120),
  constraint interview_rounds_type_length check (char_length(trim(round_type)) between 1 and 100),
  constraint interview_rounds_duration check (duration_minutes is null or duration_minutes between 5 and 1440),
  constraint interview_rounds_timezone_length check (timezone is null or char_length(timezone) <= 100),
  constraint interview_rounds_interviewer_name_length check (interviewer_name is null or char_length(interviewer_name) <= 120),
  constraint interview_rounds_interviewer_role_length check (interviewer_role is null or char_length(interviewer_role) <= 120),
  constraint interview_rounds_meeting_link check (meeting_link is null or (char_length(meeting_link) <= 1000 and meeting_link ~* '^https?://')),
  constraint interview_rounds_location_length check (location is null or char_length(location) <= 200),
  constraint interview_rounds_status check (status in ('Planned', 'Scheduled', 'Completed', 'Rescheduled', 'Cancelled')),
  constraint interview_rounds_result check (result in ('Pending', 'Passed', 'Failed', 'No Decision', 'Unknown')),
  constraint interview_rounds_notes_length check (notes is null or char_length(notes) <= 10000)
);

create index applications_user_updated_idx on public.applications (user_id, updated_at desc);
create index applications_user_status_idx on public.applications (user_id, status);
create index applications_user_date_idx on public.applications (user_id, application_date desc);
create index interview_rounds_application_order_idx on public.interview_rounds (application_id, round_number);
create index interview_rounds_user_scheduled_idx on public.interview_rounds (user_id, scheduled_at) where scheduled_at is not null;
create index interview_rounds_user_status_idx on public.interview_rounds (user_id, status);

create trigger applications_set_updated_at before update on public.applications
for each row execute function public.set_updated_at();

create trigger interview_rounds_set_updated_at before update on public.interview_rounds
for each row execute function public.set_updated_at();

alter table public.applications enable row level security;
alter table public.interview_rounds enable row level security;

create policy "Owners can read applications" on public.applications for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Owners can create applications" on public.applications for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Owners can update applications" on public.applications for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners can delete applications" on public.applications for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Owners can read interview rounds" on public.interview_rounds for select to authenticated
  using (
    (select auth.uid()) = user_id and exists (
      select 1 from public.applications
      where applications.id = interview_rounds.application_id
        and applications.user_id = (select auth.uid())
    )
  );
create policy "Owners can create interview rounds" on public.interview_rounds for insert to authenticated
  with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.applications
      where applications.id = interview_rounds.application_id
        and applications.user_id = (select auth.uid())
    )
  );
create policy "Owners can update interview rounds" on public.interview_rounds for update to authenticated
  using (
    (select auth.uid()) = user_id and exists (
      select 1 from public.applications
      where applications.id = interview_rounds.application_id
        and applications.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id and exists (
      select 1 from public.applications
      where applications.id = interview_rounds.application_id
        and applications.user_id = (select auth.uid())
    )
  );
create policy "Owners can delete interview rounds" on public.interview_rounds for delete to authenticated
  using (
    (select auth.uid()) = user_id and exists (
      select 1 from public.applications
      where applications.id = interview_rounds.application_id
        and applications.user_id = (select auth.uid())
    )
  );

revoke all on table public.applications from anon;
revoke all on table public.interview_rounds from anon;
grant select, insert, update, delete on table public.applications to authenticated;
grant select, insert, update, delete on table public.interview_rounds to authenticated;

commit;
