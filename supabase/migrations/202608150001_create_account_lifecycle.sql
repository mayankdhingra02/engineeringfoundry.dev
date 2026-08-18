begin;

alter table public.profiles
  add column onboarding_completed_at timestamptz;

alter table public.profiles
  drop constraint profiles_onboarding_requirements;

-- Every profile that predates Phase 8 is an established account. Mark it complete
-- without inferring a role, focus, roadmap, or any other preference from activity.
update public.profiles
set onboarding_complete = true,
    onboarding_completed_at = coalesce(updated_at, created_at, transaction_timestamp());

alter table public.profiles
  add constraint profiles_onboarding_state_consistent check (
    (onboarding_complete and onboarding_completed_at is not null)
    or (not onboarding_complete and onboarding_completed_at is null)
  );

alter table public.user_preparation_preferences
  add column preferred_role_level text,
  add column primary_preparation_focus text,
  add constraint user_preparation_preferences_role_level check (
    preferred_role_level is null
    or preferred_role_level in ('sde1', 'sde2', 'senior', 'staff', 'unsure')
  ),
  add constraint user_preparation_preferences_primary_focus check (
    primary_preparation_focus is null
    or primary_preparation_focus in ('dsa', 'system_design', 'behavioral', 'applications', 'unsure')
  );

-- Completion is server-authoritative. Authenticated users keep the existing
-- profile fields they may edit, but cannot forge either onboarding field.
revoke update (onboarding_complete) on public.profiles from authenticated;

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
      onboarding_completed_at = coalesce(onboarding_completed_at, transaction_timestamp())
  where id = current_user_id
  returning * into completed_profile;

  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;
  return completed_profile;
end;
$$;

create or replace function public.save_account_preparation_preferences(
  preferred_role_level_value text,
  primary_preparation_focus_value text,
  preferred_dsa_level_value text
)
returns public.user_preparation_preferences
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved public.user_preparation_preferences%rowtype;
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
  if preferred_dsa_level_value is not null
    and preferred_dsa_level_value not in ('sde1', 'sde2', 'sde3plus') then
    raise exception 'Invalid DSA roadmap' using errcode = '22023';
  end if;

  insert into public.user_preparation_preferences (
    user_id,
    preferred_role_level,
    primary_preparation_focus,
    dsa_level
  ) values (
    current_user_id,
    preferred_role_level_value,
    primary_preparation_focus_value,
    preferred_dsa_level_value
  )
  on conflict (user_id) do update set
    preferred_role_level = excluded.preferred_role_level,
    primary_preparation_focus = excluded.primary_preparation_focus,
    dsa_level = excluded.dsa_level
  returning * into saved;

  return saved;
end;
$$;

revoke all on function public.complete_account_onboarding(text, text, text) from public;
revoke all on function public.save_account_preparation_preferences(text, text, text) from public;
grant execute on function public.complete_account_onboarding(text, text, text) to authenticated;
grant execute on function public.save_account_preparation_preferences(text, text, text) to authenticated;

commit;
