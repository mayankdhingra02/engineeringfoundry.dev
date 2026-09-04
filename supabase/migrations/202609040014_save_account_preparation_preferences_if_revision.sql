begin;

-- Account preparation settings use updated_at as the revision for the three
-- editable preference fields. Advance it monotonically so rapid writes cannot
-- reuse a successful revision or move one backwards.
create or replace function public.set_user_preparation_preference_updated_at()
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

revoke all on function public.set_user_preparation_preference_updated_at()
  from public, anon, authenticated;

drop trigger if exists user_preparation_preferences_set_updated_at
  on public.user_preparation_preferences;
create trigger user_preparation_preferences_set_updated_at
before update on public.user_preparation_preferences
for each row execute function public.set_user_preparation_preference_updated_at();

create or replace function public.save_account_preparation_preferences_if_revision(
  target_expect_absent boolean,
  target_expected_updated_at timestamptz,
  preferred_role_level_value text,
  primary_preparation_focus_value text,
  preferred_dsa_level_value text
)
returns table(updated_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  saved_updated_at timestamptz;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if target_expect_absent is null
    or (target_expect_absent and target_expected_updated_at is not null)
    or (not target_expect_absent and target_expected_updated_at is null) then
    raise exception 'Exactly one preparation preference revision state is required'
      using errcode = '23514';
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

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('account-preparation-preference-owner:' || current_user_id::text, 0)
  );

  if target_expect_absent then
    insert into public.user_preparation_preferences as preferences (
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
    on conflict (user_id) do nothing
    returning preferences.updated_at into saved_updated_at;
  else
    update public.user_preparation_preferences as preferences
    set preferred_role_level = preferred_role_level_value,
        primary_preparation_focus = primary_preparation_focus_value,
        dsa_level = preferred_dsa_level_value
    where preferences.user_id = current_user_id
      and preferences.updated_at = target_expected_updated_at
    returning preferences.updated_at into saved_updated_at;
  end if;

  if saved_updated_at is null then
    return;
  end if;

  return query select saved_updated_at;
end;
$$;

revoke all on function public.save_account_preparation_preferences_if_revision(boolean,timestamptz,text,text,text)
  from public, anon, authenticated;
grant execute on function public.save_account_preparation_preferences_if_revision(boolean,timestamptz,text,text,text)
  to authenticated;

-- Migration-first rollout: already-loaded clients retain a stable signature,
-- but the unsafe unversioned full-snapshot write can no longer mutate data.
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
begin
  raise exception 'Revision-checked preparation preference saving is required'
    using errcode = '0A000';
end;
$$;

revoke all on function public.save_account_preparation_preferences(text,text,text)
  from public, anon, authenticated;
grant execute on function public.save_account_preparation_preferences(text,text,text)
  to authenticated;

commit;
