begin;

create extension if not exists pgtap with schema extensions;
select plan(51);

select has_table('public', 'admin_memberships', 'explicit admin membership table exists');
select has_table('public', 'feedback_submissions', 'private feedback table exists');
select has_table('public', 'feedback_submission_rate_limits', 'opaque feedback rate-limit table exists');
select has_table('public', 'admin_audit_events', 'minimal admin audit table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.feedback_submissions'::regclass), 'feedback submissions enforce RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.feedback_submission_rate_limits'::regclass), 'feedback throttle state enforces RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.admin_audit_events'::regclass), 'admin audit events enforce RLS');
select ok(not has_table_privilege('anon', 'public.feedback_submissions', 'select'), 'anonymous clients cannot read feedback');
select ok(has_table_privilege('authenticated', 'public.feedback_submissions', 'select'), 'authenticated select is available only behind admin RLS');
select ok(not has_table_privilege('authenticated', 'public.feedback_submissions', 'insert'), 'members cannot directly insert feedback');
select ok(not has_table_privilege('authenticated', 'public.feedback_submissions', 'update'), 'members cannot directly mutate feedback');
select ok(not has_table_privilege('authenticated', 'public.feedback_submissions', 'delete'), 'members cannot directly delete feedback');
select has_function('public', 'is_current_admin', array[]::text[], 'database admin predicate exists');
select has_function('public', 'submit_feedback_submission', array['jsonb','text'], 'controlled feedback submit RPC exists');
select has_function('public', 'update_feedback_submission', array['uuid','text','text'], 'controlled feedback triage RPC exists');
select has_function('public', 'moderate_interview_experience', array['uuid','text','text'], 'controlled experience moderation RPC exists');
select has_function('public', 'export_own_feedback_submissions', array[]::text[], 'actor-derived feedback export RPC exists');
select ok(has_function_privilege('anon', 'public.submit_feedback_submission(jsonb,text)', 'execute'), 'anonymous users can use only the controlled submit RPC');
select ok(not has_function_privilege('anon', 'public.update_feedback_submission(uuid,text,text)', 'execute'), 'anonymous users cannot triage feedback');
select ok(not has_function_privilege('anon', 'public.export_own_feedback_submissions()', 'execute'), 'anonymous users cannot export feedback');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('a1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'feedback-member-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('b2000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'feedback-member-b@example.test', '', now(), '{}', '{}', now(), now()),
  ('c3000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'feedback-admin@example.test', '', now(), '{}', '{}', now(), now()),
  ('d4000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'feedback-delete@example.test', '', now(), '{}', '{}', now(), now());

set local role anon;
select lives_ok($$select public.submit_feedback_submission('{"category":"bug","message":"Anonymous report","page_context":"/behavioral/stories/private-id?token=never"}'::jsonb, repeat('a', 64))$$, 'anonymous visitor can submit a private report through the RPC');
select ok(public.submit_feedback_submission('{"category":"accessibility","message":"Anonymous reference report"}'::jsonb, repeat('b', 64)) ~ '^EF-FB-[A-F0-9]{32}$', 'feedback reference is opaque, unique-format, and non-sequential');
select throws_ok($$select count(*) from public.feedback_submissions$$, '42501', null, 'anonymous visitor cannot read submitted feedback');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select lives_ok($$select public.submit_feedback_submission('{"category":"suggestion","message":"Member report","page_context":"/applications/private-application?email=hidden@example.test"}'::jsonb, null)$$, 'authenticated member can submit feedback');
select is((select count(*)::integer from public.export_own_feedback_submissions()), 1, 'authenticated sender can export only their own feedback through a narrow RPC');
select throws_ok($$select public.submit_feedback_submission('{"category":"bug","message":"No consent","contact_email":"person@example.test","contact_consent":false}'::jsonb, null)$$, '22023', 'Contact consent is required', 'contact information requires explicit consent');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'b2000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.feedback_submissions), 0, 'normal member cannot read another sender feedback');
select throws_ok($$select public.update_feedback_submission((select id from public.feedback_submissions limit 1), 'resolved', null)$$, '42501', 'Administrator access required', 'normal member cannot change feedback status');
select throws_ok($$select public.moderate_interview_experience('11111111-1111-4111-8111-111111111111', 'approved', null)$$, '42501', 'Administrator access required', 'normal member cannot use experience moderation');

reset role;
insert into public.admin_memberships (user_id) values ('c3000000-0000-4000-8000-000000000003');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c3000000-0000-4000-8000-000000000003', true);
select is(public.is_current_admin(), true, 'explicit member resolves as database admin');
select ok((select count(*)::integer from public.feedback_submissions) >= 3, 'admin can see the bounded feedback queue');
select is((select page_context from public.feedback_submissions where message = 'Member report'), '/applications/...', 'database collapses private feedback page context before storage');
select lives_ok($$select public.update_feedback_submission((select id from public.feedback_submissions where message = 'Member report'), 'triaged', 'Private follow-up note')$$, 'authorized admin can triage feedback');
select is((select status from public.feedback_submissions where message = 'Member report'), 'triaged', 'admin status change persists');
select is((select message from public.feedback_submissions where message = 'Member report'), 'Member report', 'triage cannot rewrite original user message');
select is((select count(*)::integer from public.admin_audit_events where target_type = 'feedback_submission'), 1, 'feedback triage writes one audit event');
select ok(not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'admin_audit_events' and column_name = 'message'), 'audit table does not duplicate private feedback text');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
select set_config('test.experience_id', public.save_interview_experience_draft(null, '{"company_name":"Acme","role_title":"Engineer","summary":"A high-level contributor report suitable for moderation with no proprietary interview prompts.","publication_consent":true,"public_identity":"anonymous","rounds":[]}'::jsonb)::text, true);
select is(public.submit_interview_experience(current_setting('test.experience_id')::uuid), true, 'owner submits an experience into the existing moderation state');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c3000000-0000-4000-8000-000000000003', true);
select lives_ok($$select public.moderate_interview_experience(current_setting('test.experience_id')::uuid, 'approved', 'Approved after privacy and usefulness review')$$, 'authorized admin can use the supported moderation decision');
select is((select status from public.interview_experiences where id = current_setting('test.experience_id')::uuid), 'approved', 'admin approval persists without direct table grants');
select is((select count(*)::integer from public.admin_audit_events where target_type = 'interview_experience'), 1, 'experience moderation writes a minimal audit event');

reset role;
set local role anon;
select is((select count(*)::integer from public.interview_experiences), 1, 'only the approved consented experience becomes public');
select throws_ok($$select count(*) from public.feedback_submissions$$, '42501', null, 'feedback never becomes publicly readable');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'c3000000-0000-4000-8000-000000000003', true);
select throws_ok($$update public.interview_experiences set status = 'rejected' where id = current_setting('test.experience_id')::uuid$$, '42501', null, 'admin has no direct experience update grant');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'd4000000-0000-4000-8000-000000000004', true);
select lives_ok($$select public.submit_feedback_submission('{"category":"privacy_safety","message":"Delete lifecycle feedback"}'::jsonb, null)$$, 'account-linked feedback can be submitted');
reset role;
delete from auth.users where id = 'd4000000-0000-4000-8000-000000000004';
select is((select count(*)::integer from public.feedback_submissions where message = 'Delete lifecycle feedback' and actor_id is null), 1, 'account deletion removes feedback account linkage while retaining private operational report');

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select lives_ok($$select public.submit_feedback_submission('{"category":"other","message":"Rate one"}'::jsonb, repeat('d', 64))$$, 'anonymous rate-limit budget allows first submission');
select lives_ok($$select public.submit_feedback_submission('{"category":"other","message":"Rate two"}'::jsonb, repeat('d', 64))$$, 'anonymous rate-limit budget allows second submission');
select lives_ok($$select public.submit_feedback_submission('{"category":"other","message":"Rate three"}'::jsonb, repeat('d', 64))$$, 'anonymous rate-limit budget allows third submission');
select lives_ok($$select public.submit_feedback_submission('{"category":"other","message":"Rate four"}'::jsonb, repeat('d', 64))$$, 'anonymous rate-limit budget allows fourth submission');
select throws_ok($$select public.submit_feedback_submission('{"category":"other","message":"Rate five"}'::jsonb, repeat('d', 64))$$, 'P0001', 'Feedback submission limit reached', 'anonymous rate-limit budget rejects a fifth submission in the window');

select * from finish();
rollback;
