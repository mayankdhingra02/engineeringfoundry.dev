begin;

alter table public.profiles
  add constraint profiles_username_not_reserved check (
    username is null or username not in (
      'admin',
      'administrator',
      'root',
      'support',
      'help',
      'staff',
      'moderator',
      'moderators',
      'mod',
      'official',
      'system',
      'security',
      'auth',
      'api',
      'engineeringfoundry',
      'engineering-foundry',
      'engineering_foundry',
      'owner',
      'team',
      'abuse',
      'contact',
      'legal',
      'privacy',
      'terms',
      'account',
      'settings',
      'dashboard',
      'signin',
      'signup',
      'login',
      'logout'
    )
  );

drop policy if exists "Public profiles are readable" on public.profiles;

revoke select on table public.profiles from anon;
grant select on table public.profiles to authenticated;

-- These are trigger-only entry points. PostgreSQL trigger execution does not require
-- direct function EXECUTE privileges for browser-facing API roles.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.get_public_profile(profile_username text)
returns table (
  username text,
  display_name text,
  bio text,
  current_company text,
  current_role text,
  years_experience integer,
  linkedin_url text,
  github_url text,
  avatar_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    profiles.username,
    profiles.display_name,
    profiles.bio,
    profiles.current_company,
    profiles.current_role,
    profiles.years_experience,
    profiles.linkedin_url,
    profiles.github_url,
    profiles.avatar_url
  from public.profiles as profiles
  where profiles.username = lower(trim(profile_username))
    and profiles.is_public = true
    and profiles.onboarding_complete = true
  limit 1;
$$;

-- SECURITY DEFINER crosses the owner-only RLS boundary, so expose only this fixed,
-- minimal function and only to the two roles that render public profile pages.
revoke execute on function public.get_public_profile(text) from public, anon, authenticated;
grant execute on function public.get_public_profile(text) to anon, authenticated;

commit;
