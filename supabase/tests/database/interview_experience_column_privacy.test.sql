begin;

create extension if not exists pgtap with schema extensions;
select plan(65);

select ok(
  not has_table_privilege('anon', 'public.interview_experiences', 'select'),
  'anon has no table-wide experience select privilege'
);
select ok(
  not has_table_privilege('anon', 'public.interview_experience_rounds', 'select'),
  'anon has no table-wide round select privilege'
);
select is(
  (select roles from pg_policies where schemaname = 'public' and tablename = 'interview_experiences' and policyname = 'approved experiences are publicly readable'),
  array['anon']::name[],
  'the approved report policy applies only to the anonymous public role'
);
select is(
  (select roles from pg_policies where schemaname = 'public' and tablename = 'interview_experience_rounds' and policyname = 'approved experience rounds are publicly readable'),
  array['anon']::name[],
  'the approved round policy applies only to the anonymous public role'
);

select ok(
  has_column_privilege('anon', 'public.interview_experiences', column_name, 'select'),
  format('anon can select publication-safe experience column %s', column_name)
)
from unnest(array[
  'id',
  'status',
  'company_name',
  'role_title',
  'role_level',
  'region',
  'interview_date',
  'summary',
  'preparation_lessons',
  'public_identity',
  'publication_consent'
]) as safe_columns(column_name);

select ok(
  not has_column_privilege('anon', 'public.interview_experiences', column_name, 'select'),
  format('anon cannot select internal experience column %s', column_name)
)
from unnest(array[
  'author_id',
  'submitted_at',
  'reviewed_at',
  'review_note',
  'created_at',
  'updated_at'
]) as internal_columns(column_name);

select ok(
  has_column_privilege('anon', 'public.interview_experience_rounds', column_name, 'select'),
  format('anon can select publication-safe round column %s', column_name)
)
from unnest(array[
  'experience_id',
  'round_type',
  'topic_labels'
]) as safe_round_columns(column_name);

select ok(
  not has_column_privilege('anon', 'public.interview_experience_rounds', column_name, 'select'),
  format('anon cannot select non-public round column %s', column_name)
)
from unnest(array[
  'id',
  'position',
  'process_notes'
]) as private_round_columns(column_name);

select ok(
  has_table_privilege('authenticated', 'public.interview_experiences', 'select'),
  'authenticated authors retain table select behind RLS'
);
select ok(
  has_table_privilege('authenticated', 'public.interview_experience_rounds', 'select'),
  'authenticated authors retain round select behind RLS'
);
select ok(
  has_column_privilege('authenticated', 'public.interview_experiences', 'author_id', 'select'),
  'authenticated authors retain internal-column privilege behind RLS'
);
select ok(
  has_function_privilege('authenticated', 'public.save_interview_experience_draft(uuid,jsonb)', 'execute'),
  'authenticated authors retain the controlled draft RPC'
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
  ('e1111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'column-owner@example.test', '', now(), '{}', '{}', now(), now()),
  ('f2222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'column-other@example.test', '', now(), '{}', '{}', now(), now()),
  ('a3333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'column-admin@example.test', '', now(), '{}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'e1111111-1111-4111-8111-111111111111', true);
select set_config(
  'test.owner_private_experience_id',
  public.save_interview_experience_draft(
    null,
    '{"company_name":"Private Company","role_title":"Software Engineer","role_level":"Mid","summary":"A private owner report used to verify internal fields remain available only to its author.","publication_consent":false,"public_identity":"anonymous","rounds":[{"round_type":"Technical","topic_labels":["Algorithms"],"process_notes":"Private process context."}]}'::jsonb
  )::text,
  true
);
select is(
  (select status from public.interview_experiences where id = current_setting('test.owner_private_experience_id')::uuid),
  'draft',
  'owner creates a private draft through the existing RPC'
);
select is(
  (select author_id::text from public.interview_experiences where id = current_setting('test.owner_private_experience_id')::uuid),
  'e1111111-1111-4111-8111-111111111111',
  'owner can read their internal author identity'
);
select lives_ok(
  $$select author_id, submitted_at, reviewed_at, review_note, created_at, updated_at
    from public.interview_experiences
    where id = current_setting('test.owner_private_experience_id')::uuid$$,
  'owner can read their internal report fields'
);
select is(
  (select count(*)::integer from public.interview_experience_rounds where experience_id = current_setting('test.owner_private_experience_id')::uuid),
  1,
  'owner can read their private report rounds'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f2222222-2222-4222-8222-222222222222', true);
select is(
  (select count(*)::integer from public.interview_experiences where id = current_setting('test.owner_private_experience_id')::uuid),
  0,
  'another authenticated user cannot read the owner private report'
);
select is(
  (select count(*)::integer from public.interview_experience_rounds where experience_id = current_setting('test.owner_private_experience_id')::uuid),
  0,
  'another authenticated user cannot read the owner private rounds'
);

reset role;
insert into public.admin_memberships (user_id) values ('a3333333-3333-4333-8333-333333333333');
insert into public.interview_experiences (
  id,
  author_id,
  status,
  company_name,
  role_title,
  summary,
  publication_consent,
  public_identity,
  submitted_at,
  reviewed_at,
  review_note
)
values
  ('10000000-0000-4000-8000-000000000001', 'e1111111-1111-4111-8111-111111111111', 'approved', 'Published Company', 'Engineer', 'An approved consented report whose public projection and round should remain readable.', true, 'anonymous', now(), now(), 'Internal moderation note'),
  ('10000000-0000-4000-8000-000000000002', 'e1111111-1111-4111-8111-111111111111', 'draft', 'Draft Company', 'Engineer', 'A draft report that must remain private even when the author selected publication consent.', true, 'anonymous', null, null, null),
  ('10000000-0000-4000-8000-000000000003', 'e1111111-1111-4111-8111-111111111111', 'submitted', 'Submitted Company', 'Engineer', 'A submitted report that must remain private while awaiting moderation and publication.', true, 'anonymous', now(), null, null),
  ('10000000-0000-4000-8000-000000000004', 'e1111111-1111-4111-8111-111111111111', 'needs_changes', 'Needs Changes Company', 'Engineer', 'A report returned for changes that must remain private until a later approval decision.', true, 'anonymous', now(), now(), 'Private revision note'),
  ('10000000-0000-4000-8000-000000000005', 'e1111111-1111-4111-8111-111111111111', 'rejected', 'Rejected Company', 'Engineer', 'A rejected report that must remain private after the moderation decision is recorded.', true, 'anonymous', now(), now(), 'Private rejection note'),
  ('10000000-0000-4000-8000-000000000006', 'e1111111-1111-4111-8111-111111111111', 'archived', 'Archived Company', 'Engineer', 'An archived report that must no longer appear through the anonymous publication policy.', true, 'anonymous', now(), now(), null),
  ('10000000-0000-4000-8000-000000000007', 'e1111111-1111-4111-8111-111111111111', 'withdrawn', 'Withdrawn Company', 'Engineer', 'A withdrawn report that must no longer appear through the anonymous publication policy.', true, 'anonymous', now(), null, null),
  ('10000000-0000-4000-8000-000000000008', 'e1111111-1111-4111-8111-111111111111', 'draft', 'No Consent Company', 'Engineer', 'A non-consented private report that must never appear through the anonymous publication policy.', false, 'anonymous', null, null, null);

insert into public.interview_experience_rounds (
  id,
  experience_id,
  position,
  round_type,
  topic_labels,
  process_notes
)
select
  gen_random_uuid(),
  id,
  1,
  'Technical',
  array['Algorithms'],
  format('Process context for %s', company_name)
from public.interview_experiences
where id::text like '10000000-0000-4000-8000-%';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f2222222-2222-4222-8222-222222222222', true);
select is(
  (select count(*)::integer from public.interview_experiences where id = '10000000-0000-4000-8000-000000000001'),
  0,
  'another authenticated user cannot use the public policy to read an approved report base row'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a3333333-3333-4333-8333-333333333333', true);
select is(
  (select review_note from public.interview_experiences where id = '10000000-0000-4000-8000-000000000001'),
  'Internal moderation note',
  'an authenticated admin retains access to internal moderation fields'
);
select is(
  (select count(*)::integer from public.interview_experiences where id = current_setting('test.owner_private_experience_id')::uuid),
  1,
  'an authenticated admin retains access to private reports for moderation'
);
select is(
  (select process_notes from public.interview_experience_rounds where experience_id = '10000000-0000-4000-8000-000000000001'),
  'Process context for Published Company',
  'an authenticated admin retains access to private round process notes'
);

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select is(
  (select count(*)::integer from public.interview_experiences),
  1,
  'anon reads exactly the approved consented report'
);
select is((select count(*)::integer from public.interview_experiences where id = '10000000-0000-4000-8000-000000000002'), 0, 'anon cannot read a draft report');
select is((select count(*)::integer from public.interview_experiences where id = '10000000-0000-4000-8000-000000000003'), 0, 'anon cannot read a submitted report');
select is((select count(*)::integer from public.interview_experiences where id = '10000000-0000-4000-8000-000000000004'), 0, 'anon cannot read a needs-changes report');
select is((select count(*)::integer from public.interview_experiences where id = '10000000-0000-4000-8000-000000000005'), 0, 'anon cannot read a rejected report');
select is((select count(*)::integer from public.interview_experiences where id = '10000000-0000-4000-8000-000000000006'), 0, 'anon cannot read an archived report');
select is((select count(*)::integer from public.interview_experiences where id = '10000000-0000-4000-8000-000000000007'), 0, 'anon cannot read a withdrawn report');
select is((select count(*)::integer from public.interview_experiences where id = '10000000-0000-4000-8000-000000000008'), 0, 'anon cannot read a non-consented report');
select is(
  (select count(*)::integer from public.interview_experience_rounds),
  1,
  'anon reads rounds only for the approved consented report'
);
select is(
  (select count(*)::integer from public.interview_experience_rounds where experience_id <> '10000000-0000-4000-8000-000000000001'),
  0,
  'anon cannot read rounds belonging to non-public reports'
);
select is(
  (select count(*)::integer
   from public.interview_experiences experience
   join public.interview_experience_rounds round_item on round_item.experience_id = experience.id),
  1,
  'the nested public report and round relationship remains readable'
);
select lives_ok(
  $$select id, status, company_name, role_title, role_level, region, interview_date, summary,
           preparation_lessons, public_identity, publication_consent
    from public.interview_experiences$$,
  'anon can query the complete publication-safe experience projection'
);
select is(
  (select round_type from public.interview_experience_rounds where experience_id = '10000000-0000-4000-8000-000000000001'),
  'Technical',
  'anon can read the reviewed round type used by the public directory'
);

select throws_ok($$select author_id from public.interview_experiences$$, '42501', null, 'anon cannot request author identity');
select throws_ok($$select submitted_at from public.interview_experiences$$, '42501', null, 'anon cannot request submission timestamps');
select throws_ok($$select reviewed_at from public.interview_experiences$$, '42501', null, 'anon cannot request review timestamps');
select throws_ok($$select review_note from public.interview_experiences$$, '42501', null, 'anon cannot request moderation notes');
select throws_ok($$select created_at from public.interview_experiences$$, '42501', null, 'anon cannot request creation timestamps');
select throws_ok($$select updated_at from public.interview_experiences$$, '42501', null, 'anon cannot request update timestamps');
select throws_ok($$select * from public.interview_experiences$$, '42501', null, 'anon cannot bypass the projection with a wildcard request');
select throws_ok($$select id from public.interview_experience_rounds$$, '42501', null, 'anon cannot request internal round identifiers');
select throws_ok($$select position from public.interview_experience_rounds$$, '42501', null, 'anon cannot request internal round positions');
select throws_ok($$select process_notes from public.interview_experience_rounds$$, '42501', null, 'anon cannot request unrendered round process notes');
select throws_ok($$select * from public.interview_experience_rounds$$, '42501', null, 'anon cannot bypass the round projection with a wildcard request');

select * from finish();
rollback;
