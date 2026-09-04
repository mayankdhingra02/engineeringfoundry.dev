begin;

-- Reminder settings use updated_at as the complete preference snapshot
-- revision. Advance it monotonically so rapid saves and lock waits cannot
-- reuse or move a successful revision backwards.
create or replace function public.set_interview_reminder_preference_updated_at()
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

revoke all on function public.set_interview_reminder_preference_updated_at() from public, anon, authenticated;

drop trigger if exists interview_reminder_preferences_set_updated_at
  on public.interview_reminder_preferences;
create trigger interview_reminder_preferences_set_updated_at
before update on public.interview_reminder_preferences
for each row execute function public.set_interview_reminder_preference_updated_at();

-- Round schedule/status changes and preference saves share one owner lock.
-- This makes the reminder rows materialized by either path observe the last
-- committed preference snapshot after concurrent work settles.
create or replace function public.sync_interview_reminders_after_round_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('interview-reminder-owner:' || new.user_id::text, 0)
  );
  perform public.sync_interview_reminders_for_round(new.id, pg_catalog.transaction_timestamp());
  return new;
end;
$$;

revoke all on function public.sync_interview_reminders_after_round_change() from public, anon, authenticated;

create or replace function public.save_interview_reminder_preferences_if_revision(
  target_expect_absent boolean,
  target_expected_updated_at timestamptz,
  preferred_timezone_value text,
  in_app_enabled_value boolean,
  prep_3_days_enabled_value boolean,
  interview_1_day_enabled_value boolean,
  interview_1_hour_enabled_value boolean,
  email_enabled_value boolean
)
returns table(updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_updated_at timestamptz;
  future_round record;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if target_expect_absent is null
    or (target_expect_absent and target_expected_updated_at is not null)
    or (not target_expect_absent and target_expected_updated_at is null) then
    raise exception 'Exactly one reminder preference revision state is required'
      using errcode = '23514';
  end if;

  if in_app_enabled_value is null
    or prep_3_days_enabled_value is null
    or interview_1_day_enabled_value is null
    or interview_1_hour_enabled_value is null
    or email_enabled_value is null then
    raise exception 'Reminder preference values are required'
      using errcode = '23502';
  end if;

  if preferred_timezone_value is not null
    and not public.is_valid_iana_timezone(preferred_timezone_value) then
    raise exception 'Invalid IANA timezone' using errcode = '23514';
  end if;

  if email_enabled_value and not exists (
    select 1
    from auth.users
    where id = current_user_id
      and email is not null
      and email_confirmed_at is not null
  ) then
    raise exception 'Verified account email required' using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('interview-reminder-owner:' || current_user_id::text, 0)
  );

  if target_expect_absent then
    insert into public.interview_reminder_preferences as preferences (
      user_id,
      preferred_timezone,
      in_app_enabled,
      prep_3_days_enabled,
      interview_1_day_enabled,
      interview_1_hour_enabled,
      email_enabled
    ) values (
      current_user_id,
      preferred_timezone_value,
      in_app_enabled_value,
      prep_3_days_enabled_value,
      interview_1_day_enabled_value,
      interview_1_hour_enabled_value,
      email_enabled_value
    )
    on conflict (user_id) do nothing
    returning preferences.updated_at into saved_updated_at;
  else
    update public.interview_reminder_preferences as preferences
    set preferred_timezone = preferred_timezone_value,
        in_app_enabled = in_app_enabled_value,
        prep_3_days_enabled = prep_3_days_enabled_value,
        interview_1_day_enabled = interview_1_day_enabled_value,
        interview_1_hour_enabled = interview_1_hour_enabled_value,
        email_enabled = email_enabled_value
    where preferences.user_id = current_user_id
      and preferences.updated_at = target_expected_updated_at
    returning preferences.updated_at into saved_updated_at;
  end if;

  if saved_updated_at is null then
    return;
  end if;

  for future_round in
    select rounds.id
    from public.interview_rounds as rounds
    where rounds.user_id = current_user_id
      and rounds.scheduled_at > pg_catalog.transaction_timestamp()
      and rounds.status in ('Planned', 'Scheduled', 'Rescheduled')
    order by rounds.id
  loop
    perform public.sync_interview_reminders_for_round(
      future_round.id,
      pg_catalog.transaction_timestamp()
    );
  end loop;

  return query select saved_updated_at;
end;
$$;

revoke all on function public.save_interview_reminder_preferences_if_revision(boolean,timestamptz,text,boolean,boolean,boolean,boolean,boolean)
  from public, anon, authenticated;
grant execute on function public.save_interview_reminder_preferences_if_revision(boolean,timestamptz,text,boolean,boolean,boolean,boolean,boolean)
  to authenticated;

-- Migration-first rollout: already-loaded clients keep a stable callable
-- signature but cannot perform the unsafe unversioned full-snapshot write.
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
begin
  raise exception 'Revision-checked reminder preference saving is required'
    using errcode = '0A000';
end;
$$;

revoke all on function public.save_interview_reminder_preferences(text,boolean,boolean,boolean,boolean,boolean)
  from public, anon, authenticated;
grant execute on function public.save_interview_reminder_preferences(text,boolean,boolean,boolean,boolean,boolean)
  to authenticated;

-- An already-loaded onboarding form is the only other account-facing writer
-- of the reminder timezone. Serialize it with settings saves and permit only
-- the first completion to mutate either preference family.
create or replace function public.complete_account_onboarding(
  preferred_role_level_value text default null,
  primary_preparation_focus_value text default null,
  preferred_timezone_value text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  suggested_dsa_level text;
  completed_profile public.profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if preferred_role_level_value is not null
    and preferred_role_level_value not in ('sde1', 'sde2', 'senior', 'staff', 'unsure') then
    raise exception 'Invalid preferred role level' using errcode = '22023';
  end if;
  if primary_preparation_focus_value is not null
    and primary_preparation_focus_value not in ('dsa', 'system_design', 'behavioral', 'applications', 'unsure') then
    raise exception 'Invalid preparation focus' using errcode = '22023';
  end if;
  if preferred_timezone_value is not null
    and not public.is_valid_iana_timezone(preferred_timezone_value) then
    raise exception 'Invalid IANA timezone' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('interview-reminder-owner:' || current_user_id::text, 0)
  );

  select profiles.* into completed_profile
  from public.profiles as profiles
  where profiles.id = current_user_id
  for update;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  if completed_profile.onboarding_complete then
    return completed_profile;
  end if;

  suggested_dsa_level := case preferred_role_level_value
    when 'sde1' then 'sde1'
    when 'sde2' then 'sde2'
    when 'senior' then 'sde3plus'
    when 'staff' then 'sde3plus'
    else null
  end;

  if preferred_role_level_value is not null
    or primary_preparation_focus_value is not null
    or suggested_dsa_level is not null then
    insert into public.user_preparation_preferences (
      user_id,
      preferred_role_level,
      primary_preparation_focus,
      dsa_level
    ) values (
      current_user_id,
      preferred_role_level_value,
      primary_preparation_focus_value,
      suggested_dsa_level
    )
    on conflict (user_id) do update set
      preferred_role_level = excluded.preferred_role_level,
      primary_preparation_focus = excluded.primary_preparation_focus,
      dsa_level = coalesce(public.user_preparation_preferences.dsa_level, excluded.dsa_level);
  end if;

  if preferred_timezone_value is not null then
    insert into public.interview_reminder_preferences (user_id, preferred_timezone)
    values (current_user_id, preferred_timezone_value)
    on conflict (user_id) do update set
      preferred_timezone = excluded.preferred_timezone;
  end if;

  update public.profiles
  set onboarding_complete = true,
      onboarding_completed_at = coalesce(onboarding_completed_at, pg_catalog.transaction_timestamp())
  where id = current_user_id
  returning * into completed_profile;

  return completed_profile;
end;
$$;

revoke all on function public.complete_account_onboarding(text,text,text)
  from public, anon, authenticated;
grant execute on function public.complete_account_onboarding(text,text,text)
  to authenticated;

commit;
