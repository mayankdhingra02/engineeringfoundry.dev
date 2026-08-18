begin;

alter table public.interview_rounds
  add column calendar_revision integer not null default 1,
  add column reminder_schedule_revision integer not null default 1,
  add constraint interview_rounds_calendar_revision_positive check (calendar_revision > 0),
  add constraint interview_rounds_reminder_revision_positive check (reminder_schedule_revision > 0);

create or replace function public.is_valid_iana_timezone(value text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select value is not null
    and char_length(value) between 1 and 100
    and exists (select 1 from pg_catalog.pg_timezone_names where name = value);
$$;

revoke all on function public.is_valid_iana_timezone(text) from public;

create table public.interview_reminder_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  preferred_timezone text,
  in_app_enabled boolean not null default true,
  prep_3_days_enabled boolean not null default true,
  interview_1_day_enabled boolean not null default true,
  interview_1_hour_enabled boolean not null default true,
  email_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_reminder_preferences_timezone check (
    preferred_timezone is null or public.is_valid_iana_timezone(preferred_timezone)
  )
);

create table public.interview_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  round_id uuid not null,
  reminder_type text not null,
  channel text not null,
  schedule_revision integer not null,
  scheduled_for timestamptz not null,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  next_attempt_at timestamptz,
  claim_token uuid,
  claimed_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  last_error_code text,
  last_error_at timestamptz,
  provider_message_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interview_reminders_round_owner_fkey
    foreign key (round_id, user_id)
    references public.interview_rounds(id, user_id)
    on delete cascade,
  constraint interview_reminders_type check (
    reminder_type in ('prep_3_days', 'interview_1_day', 'interview_1_hour')
  ),
  constraint interview_reminders_channel check (channel in ('in_app', 'email')),
  constraint interview_reminders_status check (
    status in ('pending', 'processing', 'delivered', 'cancelled', 'failed')
  ),
  constraint interview_reminders_revision_positive check (schedule_revision > 0),
  constraint interview_reminders_attempt_count check (attempt_count between 0 and 3),
  constraint interview_reminders_error_code_length check (
    last_error_code is null or char_length(last_error_code) <= 120
  ),
  constraint interview_reminders_provider_id_length check (
    provider_message_id is null or char_length(provider_message_id) <= 240
  ),
  constraint interview_reminders_unique_logical
    unique (user_id, round_id, reminder_type, channel, schedule_revision)
);

create table public.interview_calendar_exports (
  user_id uuid not null,
  round_id uuid not null,
  provider text not null,
  exported_revision integer not null,
  export_count integer not null default 1,
  first_exported_at timestamptz not null default now(),
  last_exported_at timestamptz not null default now(),
  primary key (user_id, round_id, provider),
  constraint interview_calendar_exports_round_owner_fkey
    foreign key (round_id, user_id)
    references public.interview_rounds(id, user_id)
    on delete cascade,
  constraint interview_calendar_exports_provider check (provider in ('ics', 'google')),
  constraint interview_calendar_exports_revision_positive check (exported_revision > 0),
  constraint interview_calendar_exports_count_positive check (export_count > 0)
);

create index interview_reminders_due_email_idx
  on public.interview_reminders (scheduled_for, next_attempt_at, id)
  where channel = 'email' and status in ('pending', 'failed');

create index interview_reminders_user_round_idx
  on public.interview_reminders (user_id, round_id, scheduled_for);

create index interview_reminders_round_type_idx
  on public.interview_reminders (round_id, reminder_type, channel, schedule_revision);

create index interview_calendar_exports_user_round_idx
  on public.interview_calendar_exports (user_id, round_id);

create trigger interview_reminder_preferences_set_updated_at
before update on public.interview_reminder_preferences
for each row execute function public.set_updated_at();

create trigger interview_reminders_set_updated_at
before update on public.interview_reminders
for each row execute function public.set_updated_at();

create or replace function public.advance_interview_round_revisions()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.scheduled_at is distinct from old.scheduled_at then
    new.reminder_schedule_revision := old.reminder_schedule_revision + 1;
  end if;

  if new.scheduled_at is distinct from old.scheduled_at
    or new.duration_minutes is distinct from old.duration_minutes
    or new.timezone is distinct from old.timezone
    or new.status is distinct from old.status
    or new.round_name is distinct from old.round_name
    or new.round_type is distinct from old.round_type
    or new.meeting_link is distinct from old.meeting_link
    or new.location is distinct from old.location then
    new.calendar_revision := old.calendar_revision + 1;
  end if;

  return new;
end;
$$;

create trigger interview_rounds_advance_revisions
before update on public.interview_rounds
for each row execute function public.advance_interview_round_revisions();

create or replace function public.sync_interview_reminders_for_round(
  target_round_id uuid,
  reference_time timestamptz default transaction_timestamp()
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owned_round public.interview_rounds%rowtype;
  preferences public.interview_reminder_preferences%rowtype;
  active_round boolean;
begin
  select * into owned_round
  from public.interview_rounds
  where id = target_round_id;

  if not found then return; end if;

  select * into preferences
  from public.interview_reminder_preferences
  where user_id = owned_round.user_id;

  if not found then
    preferences.user_id := owned_round.user_id;
    preferences.in_app_enabled := true;
    preferences.prep_3_days_enabled := true;
    preferences.interview_1_day_enabled := true;
    preferences.interview_1_hour_enabled := true;
    preferences.email_enabled := false;
  end if;

  active_round := owned_round.scheduled_at is not null
    and owned_round.scheduled_at > reference_time
    and owned_round.status in ('Planned', 'Scheduled', 'Rescheduled');

  update public.interview_reminders
  set status = 'cancelled',
      cancelled_at = reference_time,
      claim_token = null,
      claimed_at = null,
      next_attempt_at = null
  where round_id = owned_round.id
    and user_id = owned_round.user_id
    and status in ('pending', 'processing', 'failed')
    and (
      schedule_revision <> owned_round.reminder_schedule_revision
      or not active_round
      or scheduled_for <= reference_time
      or (channel = 'in_app' and not preferences.in_app_enabled)
      or (channel = 'email' and not preferences.email_enabled)
      or (reminder_type = 'prep_3_days' and not preferences.prep_3_days_enabled)
      or (reminder_type = 'interview_1_day' and not preferences.interview_1_day_enabled)
      or (reminder_type = 'interview_1_hour' and not preferences.interview_1_hour_enabled)
    );

  if not active_round then return; end if;

  insert into public.interview_reminders (
    user_id,
    round_id,
    reminder_type,
    channel,
    schedule_revision,
    scheduled_for
  )
  select
    owned_round.user_id,
    owned_round.id,
    definitions.reminder_type,
    channels.channel,
    owned_round.reminder_schedule_revision,
    owned_round.scheduled_at - definitions.lead_time
  from (
    values
      ('prep_3_days'::text, interval '3 days', preferences.prep_3_days_enabled),
      ('interview_1_day'::text, interval '1 day', preferences.interview_1_day_enabled),
      ('interview_1_hour'::text, interval '1 hour', preferences.interview_1_hour_enabled)
  ) as definitions(reminder_type, lead_time, enabled)
  cross join (
    values
      ('in_app'::text, preferences.in_app_enabled),
      ('email'::text, preferences.email_enabled)
  ) as channels(channel, enabled)
  where definitions.enabled
    and channels.enabled
    and owned_round.scheduled_at - definitions.lead_time > reference_time
  on conflict (user_id, round_id, reminder_type, channel, schedule_revision)
  do update set
    scheduled_for = excluded.scheduled_for,
    status = 'pending',
    cancelled_at = null,
    next_attempt_at = null,
    claim_token = null,
    claimed_at = null,
    last_error_code = null,
    last_error_at = null
  where interview_reminders.status in ('cancelled', 'failed')
    and interview_reminders.delivered_at is null;
end;
$$;

revoke all on function public.sync_interview_reminders_for_round(uuid, timestamptz) from public;

create or replace function public.sync_interview_reminders_after_round_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.sync_interview_reminders_for_round(new.id, transaction_timestamp());
  return new;
end;
$$;

create trigger interview_rounds_sync_reminders
after insert or update of scheduled_at, status on public.interview_rounds
for each row execute function public.sync_interview_reminders_after_round_change();

create or replace function public.create_interview_reminder_preferences_for_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.interview_reminder_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger profiles_create_interview_reminder_preferences
after insert on public.profiles
for each row execute function public.create_interview_reminder_preferences_for_profile();

insert into public.interview_reminder_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

create or replace function public.save_interview_reminder_preferences(
  preferred_timezone_value text,
  in_app_enabled_value boolean,
  prep_3_days_enabled_value boolean,
  interview_1_day_enabled_value boolean,
  interview_1_hour_enabled_value boolean,
  email_enabled_value boolean
)
returns public.interview_reminder_preferences
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved public.interview_reminder_preferences%rowtype;
  future_round record;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if preferred_timezone_value is not null
    and not public.is_valid_iana_timezone(preferred_timezone_value) then
    raise exception 'Invalid IANA timezone';
  end if;
  if email_enabled_value and not exists (
    select 1 from auth.users
    where id = current_user_id
      and email is not null
      and email_confirmed_at is not null
  ) then
    raise exception 'Verified account email required';
  end if;

  insert into public.interview_reminder_preferences (
    user_id,
    preferred_timezone,
    in_app_enabled,
    prep_3_days_enabled,
    interview_1_day_enabled,
    interview_1_hour_enabled,
    email_enabled
  )
  values (
    current_user_id,
    preferred_timezone_value,
    in_app_enabled_value,
    prep_3_days_enabled_value,
    interview_1_day_enabled_value,
    interview_1_hour_enabled_value,
    email_enabled_value
  )
  on conflict (user_id) do update set
    preferred_timezone = excluded.preferred_timezone,
    in_app_enabled = excluded.in_app_enabled,
    prep_3_days_enabled = excluded.prep_3_days_enabled,
    interview_1_day_enabled = excluded.interview_1_day_enabled,
    interview_1_hour_enabled = excluded.interview_1_hour_enabled,
    email_enabled = excluded.email_enabled
  returning * into saved;

  for future_round in
    select id from public.interview_rounds
    where user_id = current_user_id
      and scheduled_at > transaction_timestamp()
      and status in ('Planned', 'Scheduled', 'Rescheduled')
  loop
    perform public.sync_interview_reminders_for_round(future_round.id, transaction_timestamp());
  end loop;

  return saved;
end;
$$;

create or replace function public.record_interview_calendar_export(
  target_round_id uuid,
  provider_value text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_revision integer;
begin
  if current_user_id is null or provider_value not in ('ics', 'google') then return false; end if;

  select calendar_revision into current_revision
  from public.interview_rounds
  where id = target_round_id and user_id = current_user_id;
  if not found then return false; end if;

  insert into public.interview_calendar_exports (
    user_id, round_id, provider, exported_revision
  ) values (
    current_user_id, target_round_id, provider_value, current_revision
  )
  on conflict (user_id, round_id, provider) do update set
    exported_revision = excluded.exported_revision,
    export_count = interview_calendar_exports.export_count + 1,
    last_exported_at = now();
  return true;
end;
$$;

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
    users.email,
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

create or replace function public.validate_interview_reminder_claim(
  target_reminder_id uuid,
  target_claim_token uuid
)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.interview_reminders as reminders
    join public.interview_rounds as rounds
      on rounds.id = reminders.round_id and rounds.user_id = reminders.user_id
    join public.interview_reminder_preferences as preferences
      on preferences.user_id = reminders.user_id
    where reminders.id = target_reminder_id
      and reminders.claim_token = target_claim_token
      and reminders.status = 'processing'
      and reminders.channel = 'email'
      and rounds.status in ('Planned', 'Scheduled', 'Rescheduled')
      and rounds.scheduled_at > transaction_timestamp()
      and rounds.reminder_schedule_revision = reminders.schedule_revision
      and preferences.email_enabled
  );
$$;

create or replace function public.mark_interview_reminder_delivered(
  target_reminder_id uuid,
  target_claim_token uuid,
  provider_message_id_value text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.interview_reminders
  set status = 'delivered',
      delivered_at = now(),
      provider_message_id = left(provider_message_id_value, 240),
      claim_token = null,
      claimed_at = null,
      next_attempt_at = null,
      last_error_code = null,
      last_error_at = null
  where id = target_reminder_id
    and claim_token = target_claim_token
    and status = 'processing';
  return found;
end;
$$;

create or replace function public.fail_interview_reminder_delivery(
  target_reminder_id uuid,
  target_claim_token uuid,
  error_code_value text,
  retryable_value boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_attempt integer;
begin
  select attempt_count into current_attempt
  from public.interview_reminders
  where id = target_reminder_id
    and claim_token = target_claim_token
    and status = 'processing'
  for update;
  if not found then return false; end if;

  update public.interview_reminders
  set status = 'failed',
      claim_token = null,
      claimed_at = null,
      last_error_code = left(coalesce(error_code_value, 'provider_error'), 120),
      last_error_at = now(),
      next_attempt_at = case
        when retryable_value and current_attempt < 3
          then now() + case current_attempt when 1 then interval '5 minutes' else interval '30 minutes' end
        else null
      end
  where id = target_reminder_id;
  return true;
end;
$$;

revoke all on function public.save_interview_reminder_preferences(text, boolean, boolean, boolean, boolean, boolean) from public;
revoke all on function public.record_interview_calendar_export(uuid, text) from public;
revoke all on function public.claim_due_interview_reminders(integer, timestamptz) from public;
revoke all on function public.validate_interview_reminder_claim(uuid, uuid) from public;
revoke all on function public.mark_interview_reminder_delivered(uuid, uuid, text) from public;
revoke all on function public.fail_interview_reminder_delivery(uuid, uuid, text, boolean) from public;

grant execute on function public.save_interview_reminder_preferences(text, boolean, boolean, boolean, boolean, boolean) to authenticated;
grant execute on function public.record_interview_calendar_export(uuid, text) to authenticated;
grant execute on function public.claim_due_interview_reminders(integer, timestamptz) to service_role;
grant execute on function public.validate_interview_reminder_claim(uuid, uuid) to service_role;
grant execute on function public.mark_interview_reminder_delivered(uuid, uuid, text) to service_role;
grant execute on function public.fail_interview_reminder_delivery(uuid, uuid, text, boolean) to service_role;

alter table public.interview_reminder_preferences enable row level security;
alter table public.interview_reminders enable row level security;
alter table public.interview_calendar_exports enable row level security;

create policy "Owners read interview reminder preferences"
on public.interview_reminder_preferences for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners read interview reminders"
on public.interview_reminders for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Owners read interview calendar exports"
on public.interview_calendar_exports for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.interview_reminder_preferences from anon, authenticated;
revoke all on table public.interview_reminders from anon, authenticated;
revoke all on table public.interview_calendar_exports from anon, authenticated;

grant select on table public.interview_reminder_preferences to authenticated;
grant select on table public.interview_reminders to authenticated;
grant select on table public.interview_calendar_exports to authenticated;

notify pgrst, 'reload schema';

commit;
