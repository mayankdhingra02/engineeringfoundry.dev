begin;

create extension if not exists pgtap with schema extensions;

select plan(81);

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
  exists (
    select 1
    from pg_catalog.pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and tgname = 'profiles_set_updated_at'
      and not tgisinternal
  ),
  'profiles use the monotonic revision trigger'
);
select ok(
  not has_function_privilege('anon', 'public.set_profile_updated_at()', 'execute'),
  'anon cannot execute the profile revision trigger function'
);
select ok(
  not has_function_privilege('authenticated', 'public.set_profile_updated_at()', 'execute'),
  'authenticated cannot execute the profile revision trigger function'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.save_profile_if_revision(timestamptz,text,text,text,text,text,integer,boolean,text,boolean,text,boolean)',
    'execute'
  ),
  'anon cannot execute revision-checked profile saves'
);
select ok(
  has_function_privilege(
    'authenticated',
    'public.save_profile_if_revision(timestamptz,text,text,text,text,text,integer,boolean,text,boolean,text,boolean)',
    'execute'
  ),
  'authenticated can execute revision-checked profile saves'
);
select ok(
  not has_function_privilege('anon', 'public.set_profile_display_name(text)', 'execute'),
  'anon cannot execute the one-field display-name writer'
);
select ok(
  has_function_privilege('authenticated', 'public.set_profile_display_name(text)', 'execute'),
  'authenticated can execute the one-field display-name writer'
);
select ok(
  not has_table_privilege('authenticated', 'public.profiles', 'update'),
  'authenticated cannot bypass profile RPCs with direct updates'
);
select ok(
  not exists (
    select 1
    from information_schema.column_privileges
    where table_schema = 'public'
      and table_name = 'profiles'
      and grantee = 'authenticated'
      and privilege_type = 'UPDATE'
  ),
  'authenticated has no residual profile column-update grant'
);
select ok(
  not has_function_privilege(
    'public',
    'public.save_profile_if_revision(timestamptz,text,text,text,text,text,integer,boolean,text,boolean,text,boolean)',
    'execute'
  ),
  'PUBLIC cannot execute revision-checked profile saves'
);
select ok(
  not has_function_privilege('public', 'public.set_profile_display_name(text)', 'execute'),
  'PUBLIC cannot execute the one-field display-name writer'
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
select throws_ok(
  $$update public.profiles set display_name = 'Direct owner overwrite' where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501'
);
select results_eq(
  $$select profile_id from public.set_profile_display_name('Member A Updated')$$,
  $$values ('11111111-1111-4111-8111-111111111111'::uuid)$$,
  'the one-field display-name writer returns the owner profile'
);
select set_config(
  'test.profile_revision',
  (select updated_at::text from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  true
);
select results_eq(
  $$
    select profile_id
    from public.save_profile_if_revision(
      current_setting('test.profile_revision')::timestamptz,
      'member-a', 'Member A Full', 'Private rich bio', 'Foundry', 'Engineer', 7,
      true, 'https://www.linkedin.com/in/member-a',
      true, 'https://github.com/member-a', true
    )
  $$,
  $$values ('11111111-1111-4111-8111-111111111111'::uuid)$$,
  'a current full profile revision saves one coherent snapshot'
);
select set_config(
  'test.stale_profile_revision',
  (select updated_at::text from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  true
);
select lives_ok(
  $$select * from public.set_profile_display_name('Member A Quick')$$,
  'the serialized display-name writer can advance the profile revision'
);
select cmp_ok(
  (select updated_at from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  '>',
  current_setting('test.stale_profile_revision')::timestamptz,
  'the display-name writer advances the revision monotonically'
);
select is_empty(
  $$
    select *
    from public.save_profile_if_revision(
      current_setting('test.stale_profile_revision')::timestamptz,
      'member-a', 'Stale full name', null, null, null, null,
      true, null, true, null, false
    )
  $$,
  'a stale full profile save returns zero rows'
);
select is(
  (
    select display_name || ':' || bio || ':' || is_public::text
    from public.profiles
    where id = '11111111-1111-4111-8111-111111111111'
  ),
  'Member A Quick:Private rich bio:true',
  'a stale full save cannot erase the newer display name or rich profile fields'
);
select throws_ok(
  $$
    select * from public.save_profile_if_revision(
      (select updated_at from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
      'member-a', 'Member A', null, null, null, null,
      false, null, true, 'https://github.com.evil.test/member-a', true
    )
  $$,
  '23514', 'Invalid GitHub URL',
  'the profile RPC rejects a deceptive GitHub hostname'
);
select throws_ok(
  $$
    select * from public.save_profile_if_revision(
      (select updated_at from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
      'member-a', 'Member A', null, null, null, null,
      true, 'https://github.com/member-a', false, null, true
    )
  $$,
  '23514', 'Invalid LinkedIn URL',
  'the profile RPC rejects a cross-platform LinkedIn URL'
);
select throws_ok(
  $$
    select * from public.save_profile_if_revision(
      null, 'member-a', 'Member A', null, null, null, null,
      false, null, false, null, true
    )
  $$,
  '23514', 'Expected profile revision is required',
  'the profile RPC rejects a missing revision'
);
select throws_ok(
  $$
    select * from public.save_profile_if_revision(
      (select updated_at from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
      'INVALID', 'Member A', null, null, null, null,
      false, null, false, null, true
    )
  $$,
  '23514', 'Invalid profile username',
  'the profile RPC rejects a noncanonical username'
);
select throws_ok(
  $$
    select * from public.save_profile_if_revision(
      (select updated_at from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
      'member-a', repeat('x', 81), null, null, null, null,
      false, null, false, null, true
    )
  $$,
  '23514', 'Invalid profile display name',
  'the profile RPC rejects an oversized display name'
);
select throws_ok(
  $$
    select * from public.save_profile_if_revision(
      (select updated_at from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
      'member-a', 'Member A', null, null, null, null,
      null, null, false, null, true
    )
  $$,
  '23514', 'Complete profile intent is required',
  'the profile RPC rejects an incomplete link-update intent'
);
select set_config(
  'test.owner_a_profile_revision',
  (select updated_at::text from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  true
);
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select is_empty(
  $$
    select * from public.save_profile_if_revision(
      current_setting('test.owner_a_profile_revision')::timestamptz,
      'member-b', 'Foreign overwrite', null, null, null, null,
      true, null, true, null, false
    )
  $$,
  'another owner cannot use the first owner revision to mutate a profile'
);
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
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
  $$
    select * from public.save_profile_if_revision(
      (select updated_at from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
      'member-a', 'Legacy Member A', 'Private rich bio', 'Foundry', 'Engineer', 7,
      false, null, false, null, true
    )
  $$,
  'the profile RPC can preserve an unchanged legacy-invalid link during an unrelated edit'
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
select results_eq(
  $$select profile_id from public.set_profile_display_name(null)$$,
  $$values ('22222222-2222-4222-8222-222222222222'::uuid)$$,
  'a completed owner can intentionally remove the optional display name'
);
select is(
  (select display_name from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  null,
  'display-name removal persists without invalidating the completed profile'
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
select is(
  (select prosecdef from pg_proc where oid = 'public.save_profile_if_revision(timestamptz,text,text,text,text,text,integer,boolean,text,boolean,text,boolean)'::regprocedure),
  true,
  'revision-checked profile saving is security definer'
);
select is(
  (select prosecdef from pg_proc where oid = 'public.set_profile_display_name(text)'::regprocedure),
  true,
  'display-name saving is security definer'
);
select ok(
  (
    select 'search_path=""' = any(proconfig)
    from pg_proc
    where oid = 'public.save_profile_if_revision(timestamptz,text,text,text,text,text,integer,boolean,text,boolean,text,boolean)'::regprocedure
  ),
  'revision-checked profile saving has an empty search path'
);
select ok(
  (
    select 'search_path=""' = any(proconfig)
    from pg_proc
    where oid = 'public.set_profile_display_name(text)'::regprocedure
  ),
  'display-name saving has an empty search path'
);
select is(
  (select provolatile from pg_proc where oid = 'public.save_profile_if_revision(timestamptz,text,text,text,text,text,integer,boolean,text,boolean,text,boolean)'::regprocedure),
  'v'::"char",
  'revision-checked profile saving is volatile'
);
select is(
  (select provolatile from pg_proc where oid = 'public.set_profile_display_name(text)'::regprocedure),
  'v'::"char",
  'display-name saving is volatile'
);

select * from finish();
rollback;
