begin;

create extension if not exists pgtap with schema extensions;

select plan(72);

select ok(
  not has_function_privilege('anon', 'public.set_updated_at()', 'execute'),
  'anon cannot execute set_updated_at'
);
select ok(
  not has_function_privilege('authenticated', 'public.set_updated_at()', 'execute'),
  'authenticated cannot execute set_updated_at'
);
select ok(
  not has_function_privilege('anon', 'public.handle_new_user()', 'execute'),
  'anon cannot execute handle_new_user'
);
select ok(
  not has_function_privilege('authenticated', 'public.handle_new_user()', 'execute'),
  'authenticated cannot execute handle_new_user'
);
select ok(
  not has_function_privilege('anon', 'public.enforce_profile_professional_urls()', 'execute'),
  'anon cannot execute the professional URL trigger function'
);
select ok(
  not has_function_privilege('authenticated', 'public.enforce_profile_professional_urls()', 'execute'),
  'authenticated cannot execute the professional URL trigger function'
);
select ok(
  exists (
    select 1
    from pg_catalog.pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and tgname = 'profiles_enforce_professional_urls'
      and not tgisinternal
  ),
  'profiles use the professional URL enforcement trigger'
);
select ok(
  has_function_privilege('anon', 'public.get_public_profile(text)', 'execute'),
  'anon can execute the public profile RPC'
);
select ok(
  has_function_privilege('authenticated', 'public.get_public_profile(text)', 'execute'),
  'authenticated can execute the public profile RPC'
);
select ok(
  not has_table_privilege('anon', 'public.profiles', 'select'),
  'anon has no base-table select privilege'
);
select ok(
  has_table_privilege('authenticated', 'public.profiles', 'select'),
  'authenticated has base-table select for owner RLS reads'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'insert'),
  'authenticated cannot insert profiles'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'delete'),
  'authenticated cannot delete profiles'
);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'authenticated',
    'authenticated',
    'profile-a@example.test',
    '',
    now(),
    '{}',
    '{"full_name":"Profile A"}',
    now(),
    now()
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'authenticated',
    'authenticated',
    'profile-b@example.test',
    '',
    now(),
    '{}',
    '{"full_name":"Profile B"}',
    now(),
    now()
  );

select is(
  (select count(*)::integer from public.profiles where id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222'
  )),
  2,
  'auth user trigger still creates profile rows'
);

select throws_ok(
  $$update public.profiles set username = 'admin' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514'
);

update public.profiles
set username = 'member-a', display_name = 'Member A', is_public = true,
    onboarding_complete = true, onboarding_completed_at = now(),
    github_url = 'https://github.com/member-a',
    linkedin_url = 'https://www.linkedin.com/in/member-a'
where id = '11111111-1111-4111-8111-111111111111';

update public.profiles
set username = 'member-b', display_name = 'Member B', is_public = false,
    onboarding_complete = true, onboarding_completed_at = now()
where id = '22222222-2222-4222-8222-222222222222';

select throws_ok(
  $$update public.profiles set username = 'member-a' where id = '22222222-2222-4222-8222-222222222222'$$,
  '23505'
);
select throws_ok(
  $$update public.profiles set username = 'MEMBER-A' where id = '22222222-2222-4222-8222-222222222222'$$,
  '23514'
);

set local role anon;

select throws_ok(
  $$select count(*) from public.profiles$$,
  '42501'
);
select throws_ok(
  $$select public.set_updated_at()$$,
  '42501'
);
select throws_ok(
  $$select public.handle_new_user()$$,
  '42501'
);
select is(
  (select username from public.get_public_profile('member-a')),
  'member-a',
  'anon can retrieve a completed public profile through the RPC'
);
select is(
  (select github_url from public.get_public_profile('member-a')),
  'https://github.com/member-a',
  'the public RPC preserves a canonical GitHub URL'
);
select is(
  (select linkedin_url from public.get_public_profile('member-a')),
  'https://www.linkedin.com/in/member-a',
  'the public RPC preserves a canonical LinkedIn URL'
);
select is(
  (
    select array_agg(keys.key order by keys.key)
    from public.get_public_profile('member-a') as profile
    cross join lateral jsonb_object_keys(to_jsonb(profile)) as keys(key)
  ),
  array[
    'avatar_url',
    'bio',
    'current_company',
    'current_role',
    'display_name',
    'github_url',
    'linkedin_url',
    'username',
    'years_experience'
  ]::text[],
  'public RPC exposes exactly the approved fields'
);
select is_empty(
  $$select * from public.get_public_profile('member-b')$$,
  'private profiles are absent from the public RPC'
);

reset role;

update public.profiles
set is_public = true, onboarding_complete = false, onboarding_completed_at = null
where id = '22222222-2222-4222-8222-222222222222';

set local role anon;
select is_empty(
  $$select * from public.get_public_profile('member-b')$$,
  'incomplete profiles are absent from the public RPC'
);
select is_empty(
  $$select * from public.get_public_profile('unknown-member')$$,
  'unknown usernames return no RPC row'
);
reset role;

update public.profiles
set is_public = false, onboarding_complete = true, onboarding_completed_at = now()
where id = '22222222-2222-4222-8222-222222222222';

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select is(
  (select count(*)::integer from public.profiles),
  1,
  'authenticated user sees exactly their own base profile'
);
select is(
  (select count(*)::integer from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  0,
  'authenticated user cannot read another base profile'
);
select results_eq(
  $$
    update public.profiles
    set display_name = 'Member A Updated'
    where id = '11111111-1111-4111-8111-111111111111'
    returning id
  $$,
  $$values ('11111111-1111-4111-8111-111111111111'::uuid)$$,
  'authenticated user can update exactly their own profile'
);
select lives_ok(
  $$
    update public.profiles
    set github_url = null, linkedin_url = null
    where id = '11111111-1111-4111-8111-111111111111'
  $$,
  'owner can clear both optional professional URLs'
);
select lives_ok(
  $$
    update public.profiles
    set github_url = 'https://github.com/member-a',
        linkedin_url = 'https://www.linkedin.com/in/member-a'
    where id = '11111111-1111-4111-8111-111111111111'
  $$,
  'owner can store canonical professional URLs directly'
);
select throws_ok(
  $$update public.profiles set github_url = 'https://example.test/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid GitHub URL', 'GitHub rejects an off-domain URL'
);
select throws_ok(
  $$update public.profiles set github_url = 'https://github.com.evil.test/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid GitHub URL', 'GitHub rejects a deceptive hostname suffix'
);
select throws_ok(
  $$update public.profiles set github_url = 'https://github.com@evil.test/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid GitHub URL', 'GitHub rejects a deceptive userinfo URL'
);
select throws_ok(
  $$update public.profiles set github_url = 'http://github.com/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid GitHub URL', 'GitHub requires HTTPS'
);
select throws_ok(
  $$update public.profiles set github_url = 'https://github.com:443/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid GitHub URL', 'GitHub rejects explicit ports'
);
select throws_ok(
  $$update public.profiles set github_url = 'https://github.com/member-a?tab=repositories' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid GitHub URL', 'GitHub rejects query strings'
);
select throws_ok(
  $$update public.profiles set github_url = 'https://github.com/member-a#profile' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid GitHub URL', 'GitHub rejects fragments'
);
select throws_ok(
  $$update public.profiles set github_url = E'https://github.com\\evil.test/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid GitHub URL', 'GitHub rejects backslash URL delimiters'
);
select throws_ok(
  $$update public.profiles set github_url = 'https://github.com/' || repeat('a', 482) where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid GitHub URL', 'GitHub rejects URLs longer than 500 characters'
);
select throws_ok(
  $$update public.profiles set github_url = 'https://www.linkedin.com/in/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid GitHub URL', 'GitHub rejects a LinkedIn URL'
);
select throws_ok(
  $$update public.profiles set linkedin_url = 'https://example.test/in/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid LinkedIn URL', 'LinkedIn rejects an off-domain URL'
);
select throws_ok(
  $$update public.profiles set linkedin_url = 'https://www.linkedin.com.evil.test/in/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid LinkedIn URL', 'LinkedIn rejects a deceptive hostname suffix'
);
select throws_ok(
  $$update public.profiles set linkedin_url = 'https://www.linkedin.com@evil.test/in/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid LinkedIn URL', 'LinkedIn rejects a deceptive userinfo URL'
);
select throws_ok(
  $$update public.profiles set linkedin_url = 'http://www.linkedin.com/in/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid LinkedIn URL', 'LinkedIn requires HTTPS'
);
select throws_ok(
  $$update public.profiles set linkedin_url = 'https://www.linkedin.com:443/in/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid LinkedIn URL', 'LinkedIn rejects explicit ports'
);
select throws_ok(
  $$update public.profiles set linkedin_url = 'https://www.linkedin.com/in/member-a?trk=profile' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid LinkedIn URL', 'LinkedIn rejects query strings'
);
select throws_ok(
  $$update public.profiles set linkedin_url = 'https://www.linkedin.com/in/member-a#profile' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid LinkedIn URL', 'LinkedIn rejects fragments'
);
select throws_ok(
  $$update public.profiles set linkedin_url = E'https://www.linkedin.com\\evil.test/in/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid LinkedIn URL', 'LinkedIn rejects backslash URL delimiters'
);
select throws_ok(
  $$update public.profiles set linkedin_url = 'https://www.linkedin.com/' || repeat('a', 476) where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid LinkedIn URL', 'LinkedIn rejects URLs longer than 500 characters'
);
select throws_ok(
  $$update public.profiles set linkedin_url = 'https://github.com/member-a' where id = '11111111-1111-4111-8111-111111111111'$$,
  '23514', 'Invalid LinkedIn URL', 'LinkedIn rejects a GitHub URL'
);
select is_empty(
  $$
    update public.profiles
    set display_name = 'Unauthorized change'
    where id = '22222222-2222-4222-8222-222222222222'
    returning id
  $$,
  'authenticated user cannot update another profile'
);
select throws_ok(
  $$insert into public.profiles (id) values ('33333333-3333-4333-8333-333333333333')$$,
  '42501'
);
select throws_ok(
  $$delete from public.profiles where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501'
);

reset role;

alter table public.profiles disable trigger profiles_enforce_professional_urls;
update public.profiles
set github_url = 'https://evil.example/member-a',
    linkedin_url = 'https://www.linkedin.com/in/member-a'
where id = '11111111-1111-4111-8111-111111111111';
alter table public.profiles enable trigger profiles_enforce_professional_urls;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select lives_ok(
  $$update public.profiles set display_name = 'Legacy Member A' where id = '11111111-1111-4111-8111-111111111111'$$,
  'an unrelated owner update remains possible on a legacy-invalid row'
);
reset role;

set local role anon;
select is(
  (select github_url from public.get_public_profile('member-a')),
  null,
  'the public RPC masks a legacy-invalid GitHub URL'
);
select is(
  (select linkedin_url from public.get_public_profile('member-a')),
  'https://www.linkedin.com/in/member-a',
  'the public RPC preserves a safe LinkedIn sibling URL'
);
reset role;

alter table public.profiles disable trigger profiles_enforce_professional_urls;
update public.profiles
set github_url = 'https://github.com/member-a',
    linkedin_url = 'https://evil.example/in/member-a'
where id = '11111111-1111-4111-8111-111111111111';
alter table public.profiles enable trigger profiles_enforce_professional_urls;

set local role anon;
select is(
  (select linkedin_url from public.get_public_profile('member-a')),
  null,
  'the public RPC masks a legacy-invalid LinkedIn URL'
);
select is(
  (select github_url from public.get_public_profile('member-a')),
  'https://github.com/member-a',
  'the public RPC preserves a safe GitHub sibling URL'
);
reset role;

alter table public.profiles disable trigger profiles_enforce_professional_urls;
update public.profiles
set github_url = 'https://www.github.com/member-a',
    linkedin_url = 'https://linkedin.com/in/member-a'
where id = '11111111-1111-4111-8111-111111111111';
alter table public.profiles enable trigger profiles_enforce_professional_urls;

set local role anon;
select is(
  (select github_url from public.get_public_profile('member-a')),
  'https://www.github.com/member-a',
  'the public RPC preserves the safe legacy www GitHub alias'
);
select is(
  (select linkedin_url from public.get_public_profile('member-a')),
  'https://linkedin.com/in/member-a',
  'the public RPC preserves the safe legacy bare LinkedIn alias'
);
reset role;

alter table public.profiles disable trigger profiles_enforce_professional_urls;
update public.profiles
set github_url = E'https://github.com\\evil.test/member-a',
    linkedin_url = 'https://www.linkedin.com/in/member-a'
where id = '11111111-1111-4111-8111-111111111111';
alter table public.profiles enable trigger profiles_enforce_professional_urls;

set local role anon;
select is(
  (select github_url from public.get_public_profile('member-a')),
  null,
  'the public RPC masks a legacy GitHub URL with a backslash delimiter'
);
select is(
  (select linkedin_url from public.get_public_profile('member-a')),
  'https://www.linkedin.com/in/member-a',
  'the public RPC preserves a safe sibling when masking a backslash URL'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select is(
  (select count(*)::integer from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  1,
  'owner can read their own private profile'
);
reset role;

select is(
  (select prosecdef from pg_proc where oid = 'public.set_updated_at()'::regprocedure),
  false,
  'set_updated_at remains security invoker'
);
select is(
  (select prosecdef from pg_proc where oid = 'public.handle_new_user()'::regprocedure),
  true,
  'handle_new_user remains security definer'
);
select is(
  (select prosecdef from pg_proc where oid = 'public.get_public_profile(text)'::regprocedure),
  true,
  'public profile RPC is security definer'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.set_updated_at()'::regprocedure),
  'set_updated_at has an empty search path'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.handle_new_user()'::regprocedure),
  'handle_new_user has an empty search path'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.get_public_profile(text)'::regprocedure),
  'public profile RPC has an empty search path'
);
select is(
  (select provolatile from pg_proc where oid = 'public.get_public_profile(text)'::regprocedure),
  's'::"char",
  'public profile RPC is stable'
);

select * from finish();
rollback;
