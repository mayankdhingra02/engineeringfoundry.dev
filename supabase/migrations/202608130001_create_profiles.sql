begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  display_name text,
  bio text,
  current_company text,
  "current_role" text,
  years_experience integer,
  linkedin_url text,
  github_url text,
  avatar_url text,
  is_public boolean not null default true,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username is null or (username = lower(username) and username ~ '^[a-z0-9][a-z0-9_-]{2,29}$')),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) between 1 and 80),
  constraint profiles_bio_length check (bio is null or char_length(bio) <= 280),
  constraint profiles_company_length check (current_company is null or char_length(current_company) <= 100),
  constraint profiles_role_length check ("current_role" is null or char_length("current_role") <= 100),
  constraint profiles_years_experience_range check (years_experience is null or years_experience between 0 and 80),
  constraint profiles_linkedin_url_scheme check (linkedin_url is null or linkedin_url ~* '^https?://'),
  constraint profiles_github_url_scheme check (github_url is null or github_url ~* '^https?://'),
  constraint profiles_onboarding_requirements check (not onboarding_complete or (username is not null and display_name is not null))
);

create unique index if not exists profiles_username_unique on public.profiles (lower(username)) where username is not null;
create index if not exists profiles_public_lookup on public.profiles (username) where is_public and onboarding_complete;

alter table public.profiles enable row level security;

drop policy if exists "Public profiles are readable" on public.profiles;
create policy "Public profiles are readable" on public.profiles for select to anon, authenticated
  using (is_public = true and onboarding_complete = true);

drop policy if exists "Owners can read their profile" on public.profiles;
create policy "Owners can read their profile" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Owners can update their profile" on public.profiles;
create policy "Owners can update their profile" on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke insert, delete on public.profiles from anon, authenticated;
revoke update on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (username, display_name, bio, current_company, "current_role", years_experience, linkedin_url, github_url, is_public, onboarding_complete) on public.profiles to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate_name text;
begin
  candidate_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), '');
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    case when candidate_name is null then null else left(candidate_name, 80) end,
    case when coalesce(new.raw_user_meta_data ->> 'avatar_url', '') ~* '^https?://' then left(new.raw_user_meta_data ->> 'avatar_url', 500) else null end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id, display_name, avatar_url)
select
  users.id,
  case
    when nullif(trim(coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name', '')), '') is null then null
    else left(trim(coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name')), 80)
  end,
  case
    when coalesce(users.raw_user_meta_data ->> 'avatar_url', '') ~* '^https?://' then left(users.raw_user_meta_data ->> 'avatar_url', 500)
    else null
  end
from auth.users as users
on conflict (id) do nothing;

commit;
