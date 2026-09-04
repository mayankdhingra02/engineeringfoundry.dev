begin;

-- Profile settings use updated_at as an edit revision. Keep the token
-- monotonic across rapid one-field and full-profile writes.
create or replace function public.set_profile_updated_at()
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

revoke all on function public.set_profile_updated_at()
  from public, anon, authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_profile_updated_at();

create or replace function public.save_profile_if_revision(
  target_expected_updated_at timestamptz,
  target_username text,
  target_display_name text,
  target_bio text,
  target_current_company text,
  target_current_role text,
  target_years_experience integer,
  target_update_linkedin_url boolean,
  target_linkedin_url text,
  target_update_github_url boolean,
  target_github_url text,
  target_is_public boolean
)
returns table(profile_id uuid, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_expected_updated_at is null then
    raise exception 'Expected profile revision is required' using errcode = '23514';
  end if;
  if target_username is null
    or target_username <> pg_catalog.lower(target_username)
    or target_username !~ '^[a-z0-9][a-z0-9_-]{2,29}$' then
    raise exception 'Invalid profile username' using errcode = '23514';
  end if;
  if target_display_name is null
    or pg_catalog.char_length(target_display_name) not between 1 and 80
    or target_display_name ~ '[[:cntrl:]]' then
    raise exception 'Invalid profile display name' using errcode = '23514';
  end if;
  if pg_catalog.char_length(coalesce(target_bio, '')) > 280
    or pg_catalog.char_length(coalesce(target_current_company, '')) > 100
    or pg_catalog.char_length(coalesce(target_current_role, '')) > 100
    or pg_catalog.regexp_replace(coalesce(target_bio, ''), E'[\\t\\n\\r]', '', 'g') ~ '[[:cntrl:]]'
    or coalesce(target_current_company, '') ~ '[[:cntrl:]]'
    or coalesce(target_current_role, '') ~ '[[:cntrl:]]' then
    raise exception 'Profile text is too long' using errcode = '22001';
  end if;
  if target_years_experience is not null
    and target_years_experience not between 0 and 80 then
    raise exception 'Invalid profile experience' using errcode = '23514';
  end if;
  if target_update_linkedin_url is null
    or target_update_github_url is null
    or target_is_public is null then
    raise exception 'Complete profile intent is required' using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('profile-owner:' || current_user_id::text, 0)
  );

  return query
  update public.profiles as profile
  set
    username = target_username,
    display_name = target_display_name,
    bio = nullif(pg_catalog.btrim(target_bio), ''),
    current_company = nullif(pg_catalog.btrim(target_current_company), ''),
    "current_role" = nullif(pg_catalog.btrim(target_current_role), ''),
    years_experience = target_years_experience,
    linkedin_url = case
      when target_update_linkedin_url then target_linkedin_url
      else profile.linkedin_url
    end,
    github_url = case
      when target_update_github_url then target_github_url
      else profile.github_url
    end,
    is_public = target_is_public
  where profile.id = current_user_id
    and profile.updated_at = target_expected_updated_at
  returning profile.id, profile.updated_at;
end;
$$;

create or replace function public.set_profile_display_name(
  target_display_name text
)
returns table(profile_id uuid, updated_at timestamptz)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_display_name text := nullif(pg_catalog.btrim(target_display_name), '');
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if normalized_display_name is not null
    and (
      pg_catalog.char_length(normalized_display_name) > 80
      or normalized_display_name ~ '[[:cntrl:]]'
    ) then
    raise exception 'Invalid profile display name' using errcode = '23514';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('profile-owner:' || current_user_id::text, 0)
  );

  return query
  update public.profiles as profile
  set display_name = normalized_display_name
  where profile.id = current_user_id
  returning profile.id, profile.updated_at;
end;
$$;

-- The two owner-derived RPCs are the only authenticated profile mutation
-- boundary. Already-loaded direct writers fail safely with 42501.
revoke update on public.profiles from authenticated;
revoke update (
  username,
  display_name,
  bio,
  current_company,
  "current_role",
  years_experience,
  linkedin_url,
  github_url,
  is_public
) on public.profiles from authenticated;

revoke all on function public.save_profile_if_revision(
  timestamptz,text,text,text,text,text,integer,boolean,text,boolean,text,boolean
) from public, anon, authenticated;
revoke all on function public.set_profile_display_name(text)
  from public, anon, authenticated;
grant execute on function public.save_profile_if_revision(
  timestamptz,text,text,text,text,text,integer,boolean,text,boolean,text,boolean
) to authenticated;
grant execute on function public.set_profile_display_name(text)
  to authenticated;

commit;
