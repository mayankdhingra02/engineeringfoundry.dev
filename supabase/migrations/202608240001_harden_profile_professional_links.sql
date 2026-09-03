begin;

create or replace function public.enforce_profile_professional_urls()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  check_github boolean;
  check_linkedin boolean;
begin
  if tg_op = 'INSERT' then
    check_github := true;
    check_linkedin := true;
  else
    check_github := new.github_url is distinct from old.github_url;
    check_linkedin := new.linkedin_url is distinct from old.linkedin_url;
  end if;

  if check_github then
    if new.github_url is not null and not (
      char_length(new.github_url) <= 500
      and new.github_url ~ '^https://github\.com(?:/[^?#[:space:][:cntrl:]]*)?$'
      and pg_catalog.strpos(new.github_url, pg_catalog.chr(92)) = 0
    ) then
      raise exception 'Invalid GitHub URL'
        using errcode = '23514', constraint = 'profiles_github_url_canonical';
    end if;
  end if;

  if check_linkedin then
    if new.linkedin_url is not null and not (
      char_length(new.linkedin_url) <= 500
      and new.linkedin_url ~ '^https://www\.linkedin\.com(?:/[^?#[:space:][:cntrl:]]*)?$'
      and pg_catalog.strpos(new.linkedin_url, pg_catalog.chr(92)) = 0
    ) then
      raise exception 'Invalid LinkedIn URL'
        using errcode = '23514', constraint = 'profiles_linkedin_url_canonical';
    end if;
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_profile_professional_urls() from public, anon, authenticated;

drop trigger if exists profiles_enforce_professional_urls on public.profiles;
create trigger profiles_enforce_professional_urls
before insert or update of linkedin_url, github_url on public.profiles
for each row execute function public.enforce_profile_professional_urls();

create or replace function public.get_public_profile(profile_username text)
returns table (
  username text,
  display_name text,
  bio text,
  current_company text,
  "current_role" text,
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
    profiles."current_role",
    profiles.years_experience,
    case
      when profiles.linkedin_url is not null
        and char_length(profiles.linkedin_url) <= 500
        and profiles.linkedin_url ~ '^https://(?:www\.)?linkedin\.com(?:/[^?#[:space:][:cntrl:]]*)?$'
        and pg_catalog.strpos(profiles.linkedin_url, pg_catalog.chr(92)) = 0
      then profiles.linkedin_url
      else null
    end,
    case
      when profiles.github_url is not null
        and char_length(profiles.github_url) <= 500
        and profiles.github_url ~ '^https://(?:www\.)?github\.com(?:/[^?#[:space:][:cntrl:]]*)?$'
        and pg_catalog.strpos(profiles.github_url, pg_catalog.chr(92)) = 0
      then profiles.github_url
      else null
    end,
    profiles.avatar_url
  from public.profiles as profiles
  where profiles.username = lower(trim(profile_username))
    and profiles.is_public = true
    and profiles.onboarding_complete = true
  limit 1;
$$;

revoke execute on function public.get_public_profile(text) from public, anon, authenticated;
grant execute on function public.get_public_profile(text) to anon, authenticated;

commit;
