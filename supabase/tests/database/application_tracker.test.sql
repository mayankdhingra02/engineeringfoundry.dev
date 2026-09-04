begin;

create extension if not exists pgtap with schema extensions;
select plan(43);

select ok(not has_table_privilege('anon', 'public.applications', 'select'), 'anon cannot read applications');
select ok(not has_table_privilege('anon', 'public.interview_rounds', 'select'), 'anon cannot read interview rounds');
select ok(has_table_privilege('authenticated', 'public.applications', 'select'), 'authenticated role can read through application RLS');
select ok(has_table_privilege('authenticated', 'public.interview_rounds', 'select'), 'authenticated role can read through round RLS');
select has_function('public', 'delete_application_if_revision', array['uuid', 'timestamp with time zone'], 'revision-checked application deletion exists');
select has_function('public', 'delete_interview_round_if_revision', array['uuid', 'uuid', 'timestamp with time zone'], 'revision-checked round deletion exists');
select function_privs_are('public', 'delete_application_if_revision', array['uuid', 'timestamp with time zone'], 'authenticated', array['EXECUTE'], 'authenticated can invoke revision-checked application deletion');
select function_privs_are('public', 'delete_interview_round_if_revision', array['uuid', 'uuid', 'timestamp with time zone'], 'authenticated', array['EXECUTE'], 'authenticated can invoke revision-checked round deletion');
select function_privs_are('public', 'delete_application_if_revision', array['uuid', 'timestamp with time zone'], 'anon', array[]::text[], 'anon cannot invoke revision-checked application deletion');
select function_privs_are('public', 'delete_interview_round_if_revision', array['uuid', 'uuid', 'timestamp with time zone'], 'anon', array[]::text[], 'anon cannot invoke revision-checked round deletion');
select ok(not has_table_privilege('authenticated', 'public.applications', 'delete'), 'authenticated cannot bypass application revision checks with direct delete');
select ok(not has_table_privilege('authenticated', 'public.interview_rounds', 'delete'), 'authenticated cannot bypass round revision checks with direct delete');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'tracker-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'tracker-b@example.test', '', now(), '{}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);

insert into public.applications (user_id, company_name, role_title, status)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Example Co', 'Software Engineer', 'Applied');
select set_config(
  'test.application_tracker_application_id',
  (select id::text from public.applications where company_name = 'Example Co'),
  true
);
select set_config(
  'test.application_tracker_application_revision',
  (select updated_at::text from public.applications where company_name = 'Example Co'),
  true
);

select is((select count(*)::integer from public.applications), 1, 'owner can create an application');
select is((select count(*)::integer from public.applications where id = current_setting('test.application_tracker_application_id')::uuid), 1, 'owner can read their application');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
select is((select count(*)::integer from public.applications), 0, 'another user cannot read the application');
select is_empty($$update public.applications set role_title = 'Intrusion' where id = current_setting('test.application_tracker_application_id')::uuid returning id$$, 'another user cannot update the application');
select throws_ok($$delete from public.applications where id = current_setting('test.application_tracker_application_id')::uuid returning id$$, '42501');
select is_empty(
  $$select application_id from public.delete_application_if_revision(current_setting('test.application_tracker_application_id')::uuid, current_setting('test.application_tracker_application_revision')::timestamptz)$$,
  'another user cannot revision-delete the application'
);
select throws_ok($$insert into public.applications (user_id, company_name, role_title) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Wrong owner', 'Engineer')$$, '42501');
select throws_ok($$insert into public.interview_rounds (application_id, user_id, round_number, round_name, round_type) values (current_setting('test.application_tracker_application_id')::uuid, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 1, 'Unauthorized', 'Coding')$$, '42501');
select is(
  public.create_interview_round(current_setting('test.application_tracker_application_id')::uuid, 'Unauthorized RPC', 'Coding / DSA'),
  null::uuid,
  'another user cannot invoke atomic round creation for the owner application'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
insert into public.interview_rounds (application_id, user_id, round_number, round_name, round_type)
values
  (current_setting('test.application_tracker_application_id')::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 1, 'Recruiter Screen', 'Recruiter Screen'),
  (current_setting('test.application_tracker_application_id')::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 2, 'Technical Screen', 'Coding');
select set_config(
  'test.application_tracker_first_round_id',
  (select id::text from public.interview_rounds where round_name = 'Recruiter Screen'),
  true
);
select is((select count(*)::integer from public.interview_rounds), 2, 'owner can add multiple rounds');
select results_eq($$update public.interview_rounds set status = 'Completed', result = 'Passed' where id = current_setting('test.application_tracker_first_round_id')::uuid returning status$$, $$values ('Completed'::text)$$, 'owner can edit a round');
update public.interview_rounds set round_number = case when round_number = 1 then 2 else 1 end;
select is((select round_name from public.interview_rounds order by round_number limit 1), 'Technical Screen', 'round ordering persists independently from schedule');
select set_config(
  'test.application_tracker_first_round_revision',
  (select updated_at::text from public.interview_rounds where id = current_setting('test.application_tracker_first_round_id')::uuid),
  true
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
select is((select count(*)::integer from public.interview_rounds), 0, 'another user cannot read application rounds');
select throws_ok($$delete from public.interview_rounds where id = current_setting('test.application_tracker_first_round_id')::uuid returning id$$, '42501');
select is_empty(
  $$select round_id from public.delete_interview_round_if_revision(current_setting('test.application_tracker_application_id')::uuid, current_setting('test.application_tracker_first_round_id')::uuid, current_setting('test.application_tracker_first_round_revision')::timestamptz)$$,
  'another user cannot revision-delete the round'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select throws_ok($$delete from public.interview_rounds where id = current_setting('test.application_tracker_first_round_id')::uuid returning id$$, '42501');
update public.interview_rounds set notes = 'Newer round notes' where id = current_setting('test.application_tracker_first_round_id')::uuid;
select is_empty(
  $$select round_id from public.delete_interview_round_if_revision(current_setting('test.application_tracker_application_id')::uuid, current_setting('test.application_tracker_first_round_id')::uuid, (select updated_at - interval '1 second' from public.interview_rounds where id = current_setting('test.application_tracker_first_round_id')::uuid))$$,
  'stale round deletion returns no row'
);
select is((select count(*)::integer from public.interview_rounds where id = current_setting('test.application_tracker_first_round_id')::uuid), 1, 'stale round deletion preserves the newer round');
select results_eq(
  $$select round_id from public.delete_interview_round_if_revision(current_setting('test.application_tracker_application_id')::uuid, current_setting('test.application_tracker_first_round_id')::uuid, (select updated_at from public.interview_rounds where id = current_setting('test.application_tracker_first_round_id')::uuid))$$,
  $$values (current_setting('test.application_tracker_first_round_id')::uuid)$$,
  'exact revision deletes the owner round'
);
select is((select count(*)::integer from public.interview_rounds), 1, 'owner can delete a round');
select isnt(
  public.create_interview_round(current_setting('test.application_tracker_application_id')::uuid, 'System Design', 'System Design'),
  null::uuid,
  'owner can create a round through the atomic owner-derived function'
);
select is((select count(*)::integer from public.interview_rounds), 2, 'atomic round creation appends exactly one owned round');
update public.applications set role_title = 'Senior Software Engineer' where id = current_setting('test.application_tracker_application_id')::uuid;
select is((select role_title from public.applications where id = current_setting('test.application_tracker_application_id')::uuid), 'Senior Software Engineer', 'owner can edit an application');
select throws_ok($$insert into public.interview_rounds (application_id, user_id, round_number, round_name, round_type, duration_minutes) values (current_setting('test.application_tracker_application_id')::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 3, 'Too short', 'Coding', 2)$$, '23514');
select throws_ok($$delete from public.applications where id = current_setting('test.application_tracker_application_id')::uuid returning id$$, '42501');
select is_empty(
  $$select application_id from public.delete_application_if_revision(current_setting('test.application_tracker_application_id')::uuid, (select updated_at - interval '1 second' from public.applications where id = current_setting('test.application_tracker_application_id')::uuid))$$,
  'stale application deletion returns no row'
);
select is((select count(*)::integer from public.applications where id = current_setting('test.application_tracker_application_id')::uuid), 1, 'stale application deletion preserves the newer application');
select results_eq(
  $$select application_id from public.delete_application_if_revision(current_setting('test.application_tracker_application_id')::uuid, (select updated_at from public.applications where id = current_setting('test.application_tracker_application_id')::uuid))$$,
  $$values (current_setting('test.application_tracker_application_id')::uuid)$$,
  'exact revision deletes the owner application'
);
select is((select count(*)::integer from public.interview_rounds), 0, 'deleting an application cascades to its rounds');

reset role;
select throws_ok($$insert into public.applications (user_id, company_name, role_title) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '', 'Engineer')$$, '23514');
select throws_ok($$insert into public.applications (user_id, company_name, role_title, job_url) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Example', 'Engineer', 'javascript:alert(1)')$$, '23514');
select * from finish();
rollback;
