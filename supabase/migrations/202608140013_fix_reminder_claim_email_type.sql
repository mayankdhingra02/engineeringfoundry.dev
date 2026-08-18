begin;

create or replace function public.claim_due_interview_reminders(
  batch_size integer default 50,
  worker_time timestamptz default transaction_timestamp()
)
returns table (
  reminder_id uuid,
  claim_token uuid,
  reminder_type text,
  recipient_email text,
  round_id uuid,
  company_name text,
  role_title text,
  round_type text,
  round_name text,
  scheduled_at timestamptz,
  timezone text,
  meeting_link text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.interview_reminders
  set status = 'failed',
      next_attempt_at = worker_time,
      claim_token = null,
      claimed_at = null,
      last_error_code = 'claim_expired',
      last_error_at = worker_time
  where channel = 'email'
    and status = 'processing'
    and claimed_at < worker_time - interval '10 minutes'
    and attempt_count < 3;

  return query
  with candidates as (
    select reminders.id
    from public.interview_reminders as reminders
    join public.interview_rounds as rounds
      on rounds.id = reminders.round_id and rounds.user_id = reminders.user_id
    join public.interview_reminder_preferences as preferences
      on preferences.user_id = reminders.user_id
    join auth.users as users on users.id = reminders.user_id
    where reminders.channel = 'email'
      and reminders.status in ('pending', 'failed')
      and reminders.scheduled_for <= worker_time
      and coalesce(reminders.next_attempt_at, reminders.scheduled_for) <= worker_time
      and reminders.attempt_count < 3
      and rounds.status in ('Planned', 'Scheduled', 'Rescheduled')
      and rounds.scheduled_at > worker_time
      and rounds.reminder_schedule_revision = reminders.schedule_revision
      and preferences.email_enabled
      and users.email is not null
      and users.email_confirmed_at is not null
    order by reminders.scheduled_for, reminders.id
    for update of reminders skip locked
    limit greatest(1, least(batch_size, 100))
  ), claimed as (
    update public.interview_reminders as reminders
    set status = 'processing',
        attempt_count = reminders.attempt_count + 1,
        claim_token = gen_random_uuid(),
        claimed_at = worker_time,
        next_attempt_at = null
    from candidates
    where reminders.id = candidates.id
    returning reminders.*
  )
  select
    claimed.id,
    claimed.claim_token,
    claimed.reminder_type,
    users.email::text,
    rounds.id,
    applications.company_name,
    applications.role_title,
    rounds.round_type,
    rounds.round_name,
    rounds.scheduled_at,
    rounds.timezone,
    rounds.meeting_link
  from claimed
  join public.interview_rounds as rounds
    on rounds.id = claimed.round_id and rounds.user_id = claimed.user_id
  join public.applications as applications
    on applications.id = rounds.application_id and applications.user_id = rounds.user_id
  join auth.users as users on users.id = claimed.user_id;
end;
$$;

revoke all on function public.claim_due_interview_reminders(integer, timestamptz) from public;
grant execute on function public.claim_due_interview_reminders(integer, timestamptz) to service_role;

notify pgrst, 'reload schema';

commit;
