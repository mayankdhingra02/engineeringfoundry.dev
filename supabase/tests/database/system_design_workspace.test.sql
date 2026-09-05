begin;

create extension if not exists pgtap with schema extensions;
select plan(98);

select ok(has_table_privilege('anon', 'public.system_design_item_catalog', 'select'), 'public catalog remains readable signed out');
select ok(not has_table_privilege('anon', 'public.system_design_item_progress', 'select'), 'anonymous users cannot read private progress');
select ok(not has_table_privilege('anon', 'public.system_design_attempts', 'select'), 'anonymous users cannot read private attempts');
select ok(has_table_privilege('authenticated', 'public.system_design_item_progress', 'select'), 'authenticated users can read owned progress');
select ok(has_table_privilege('authenticated', 'public.system_design_item_progress', 'delete'), 'authenticated users can delete owned progress');
select ok(not has_table_privilege('authenticated', 'public.system_design_item_progress', 'insert'), 'clients cannot directly insert progress');
select ok(not has_table_privilege('authenticated', 'public.system_design_item_progress', 'update'), 'clients cannot directly update progress');
select ok(has_table_privilege('authenticated', 'public.system_design_attempts', 'select'), 'authenticated users can read owned attempts');
select ok(not has_table_privilege('authenticated', 'public.system_design_attempts', 'insert'), 'clients cannot directly insert attempts');
select ok(not has_table_privilege('authenticated', 'public.system_design_attempts', 'update'), 'clients cannot directly update attempts');
select ok(not has_table_privilege('authenticated', 'public.system_design_attempts', 'delete'), 'clients cannot directly delete attempts');
select ok(not has_function_privilege('anon', 'public.create_system_design_attempt(text,uuid,text,jsonb)', 'execute'), 'anonymous users cannot create attempts');
select ok(has_function_privilege('authenticated', 'public.create_system_design_attempt(text,uuid,text,jsonb)', 'execute'), 'authenticated users can create attempts through RPC');
select ok(not has_function_privilege('anon', 'public.delete_system_design_attempt_if_revision(uuid,text,bigint)', 'execute'), 'anonymous users cannot invoke revision-checked attempt deletion');
select ok(has_function_privilege('authenticated', 'public.delete_system_design_attempt_if_revision(uuid,text,bigint)', 'execute'), 'authenticated users can invoke revision-checked attempt deletion');
select ok(not has_function_privilege('anon', 'public.delete_system_design_attempt(uuid)', 'execute'), 'anonymous users cannot invoke the retired attempt delete');
select ok(has_function_privilege('authenticated', 'public.delete_system_design_attempt(uuid)', 'execute'), 'authenticated old clients reach the stable retired attempt delete');
select ok(not has_function_privilege('anon', 'public.save_system_design_item_progress_if_revision(text,text,boolean,timestamptz,text,text,boolean,text)', 'execute'), 'anonymous users cannot invoke revision-checked System Design progress saves');
select ok(has_function_privilege('authenticated', 'public.save_system_design_item_progress_if_revision(text,text,boolean,timestamptz,text,text,boolean,text)', 'execute'), 'authenticated users can invoke revision-checked System Design progress saves');
select ok(not has_function_privilege('anon', 'public.set_system_design_item_quick_progress(text,text,text)', 'execute'), 'anonymous users cannot invoke quick System Design progress saves');
select ok(has_function_privilege('authenticated', 'public.set_system_design_item_quick_progress(text,text,text)', 'execute'), 'authenticated users can invoke quick System Design progress saves');
select ok(has_function_privilege('authenticated', 'public.save_system_design_item_progress(text,text,text,text,boolean,text)', 'execute'), 'legacy System Design progress signature remains callable for migration-first fail-safe behavior');
select ok(not has_function_privilege('authenticated', 'public.set_system_design_item_progress_updated_at()', 'execute'), 'clients cannot execute the monotonic revision trigger directly');
select is((select count(*)::integer from public.system_design_item_catalog), 215, 'catalog contains every published concept and problem');
select is((select count(*)::integer from public.system_design_item_catalog where item_type = 'concept'), 188, 'catalog contains published concepts');
select is((select count(*)::integer from public.system_design_item_catalog where item_type = 'design_problem'), 27, 'catalog contains published design problems');

insert into auth.users (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
  ('56565656-5656-4565-8565-565656565656','authenticated','authenticated','sd-workspace-a@example.test','',now(),'{}','{}',now(),now()),
  ('78787878-7878-4787-8787-787878787878','authenticated','authenticated','sd-workspace-b@example.test','',now(),'{}','{}',now(),now());

insert into public.applications (id,user_id,company_name,role_title,status)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','56565656-5656-4565-8565-565656565656','Owned Design Co','Senior Engineer','Interviewing'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','78787878-7878-4787-8787-787878787878','Other Design Co','Staff Engineer','Interviewing');

set local role authenticated;
select set_config('request.jwt.claim.sub', '56565656-5656-4565-8565-565656565656', true);

select results_eq(
  $$select item_id,item_type from public.save_system_design_item_progress_if_revision('estimation','concept',true,null,'reviewed','medium',true,'State every assumption.')$$,
  $$values ('estimation'::text,'concept'::text)$$,
  'User A creates canonical concept progress with an explicit absent revision'
);
select is((select confidence from public.system_design_item_progress where item_id = 'estimation'), 'medium', 'confidence persists');
select is((select bookmarked from public.system_design_item_progress where item_id = 'estimation'), true, 'bookmark persists');
select is((select notes from public.system_design_item_progress where item_id = 'estimation'), 'State every assumption.', 'private notes persist');
select ok((select first_reviewed_at is not null from public.system_design_item_progress where item_id = 'estimation'), 'first reviewed timestamp is recorded');
select ok((select last_practiced_at is not null from public.system_design_item_progress where item_id = 'estimation'), 'last practiced timestamp is recorded');
select set_config('test.sd_last_practiced', (select last_practiced_at::text from public.system_design_item_progress where item_id = 'estimation'), true);
select set_config('test.sd_initial_revision', (select updated_at::text from public.system_design_item_progress where item_id = 'estimation'), true);
select set_config('test.sd_progress_revision', (select updated_at::text from public.system_design_item_progress where item_id = 'estimation'), true);
select results_eq(
  $$select item_id,item_type from public.save_system_design_item_progress_if_revision('estimation','concept',false,current_setting('test.sd_progress_revision')::timestamptz,'reviewed','medium',false,'State every assumption.')$$,
  $$values ('estimation'::text,'concept'::text)$$,
  'revision-checked bookmark-only full update persists'
);
select is((select bookmarked from public.system_design_item_progress where item_id = 'estimation'), false, 'revision-checked bookmark value persists');
select is((select last_practiced_at::text from public.system_design_item_progress where item_id = 'estimation'), current_setting('test.sd_last_practiced'), 'bookmark-only update does not forge practice time');
select ok((select updated_at > current_setting('test.sd_initial_revision')::timestamptz from public.system_design_item_progress where item_id = 'estimation'), 'full saves advance the edit revision monotonically');
select set_config('test.sd_progress_revision', (select updated_at::text from public.system_design_item_progress where item_id = 'estimation'), true);
select throws_ok($$select * from public.save_system_design_item_progress_if_revision('invented-concept','concept',true,null,'reviewed','low',false,null)$$, '23503', 'Unknown canonical System Design item', 'fake catalog IDs are rejected');
select throws_ok($$select * from public.save_system_design_item_progress_if_revision('estimation','lesson',true,null,'reviewed','low',false,null)$$, '23514', 'Invalid System Design item type', 'fake item types are rejected');
select throws_ok($$select * from public.save_system_design_item_progress_if_revision('estimation','concept',true,current_setting('test.sd_progress_revision')::timestamptz,'reviewed','low',false,null)$$, '23514', 'Expected System Design progress revision is invalid', 'absence expectation rejects a supplied revision');
select throws_ok($$select * from public.save_system_design_item_progress_if_revision('estimation','concept',false,null,'reviewed','low',false,null)$$, '23514', 'Expected System Design progress revision is invalid', 'existing expectation requires a revision');
select throws_ok($$select * from public.save_system_design_item_progress_if_revision('estimation','concept',false,current_setting('test.sd_progress_revision')::timestamptz,'mastered','low',false,null)$$, '23514', 'Invalid System Design progress status', 'fake readiness states are rejected');
select throws_ok($$select * from public.save_system_design_item_progress_if_revision('estimation','concept',false,current_setting('test.sd_progress_revision')::timestamptz,'reviewed','certain',false,null)$$, '23514', 'Invalid System Design confidence', 'unsupported confidence is rejected');
select throws_ok($$select * from public.save_system_design_item_progress_if_revision('estimation','concept',false,current_setting('test.sd_progress_revision')::timestamptz,'reviewed','low',null,null)$$, '23514', 'System Design bookmark state is required', 'full saves require an explicit bookmark state');
select throws_ok($$select * from public.save_system_design_item_progress_if_revision('estimation','concept',false,current_setting('test.sd_progress_revision')::timestamptz,'reviewed','low',false,repeat('x',10001))$$, '22001', 'System Design progress notes are too long', 'oversized notes are rejected');
select throws_ok($$select * from public.save_system_design_item_progress('estimation','concept','reviewed','low',false,null)$$, '0A000', 'Revision-checked System Design progress saving is required', 'legacy whole-row saves fail without mutation');

select set_config('test.sd_progress_revision', (select updated_at::text from public.system_design_item_progress where item_id = 'estimation'), true);
select results_eq(
  $$select item_id from public.save_system_design_item_progress_if_revision('estimation','concept',false,current_setting('test.sd_progress_revision')::timestamptz,'comfortable','high',true,'New full-save note.')$$,
  $$values ('estimation'::text)$$,
  'the first full edit with an exact revision succeeds'
);
select is_empty(
  $$select item_id from public.save_system_design_item_progress_if_revision('estimation','concept',false,current_setting('test.sd_progress_revision')::timestamptz,'review','low',false,'Stale overwrite.')$$,
  'a stale full edit cannot overwrite the winning save'
);
select set_config('test.sd_progress_revision', (select updated_at::text from public.system_design_item_progress where item_id = 'estimation'), true);
select is(public.set_system_design_item_quick_progress('estimation','concept','review'), 'estimation', 'quick status mutation returns the exact canonical item id');
select is((select status from public.system_design_item_progress where item_id = 'estimation' and item_type = 'concept'), 'review', 'quick status mutation persists the desired status');
select is((select confidence from public.system_design_item_progress where item_id = 'estimation' and item_type = 'concept'), 'high', 'quick status mutation preserves confidence');
select is((select bookmarked from public.system_design_item_progress where item_id = 'estimation' and item_type = 'concept'), true, 'quick status mutation preserves bookmark state');
select is((select notes from public.system_design_item_progress where item_id = 'estimation' and item_type = 'concept'), 'New full-save note.', 'quick status mutation preserves private notes');
select set_config('test.sd_quick_revision', (select updated_at::text from public.system_design_item_progress where item_id = 'estimation' and item_type = 'concept'), true);
select ok(current_setting('test.sd_quick_revision')::timestamptz > current_setting('test.sd_progress_revision')::timestamptz, 'quick status advances the edit revision monotonically');
select is(public.set_system_design_item_quick_progress('estimation','concept','review'), 'estimation', 'repeating a desired quick status is idempotent');
select is((select updated_at::text from public.system_design_item_progress where item_id = 'estimation' and item_type = 'concept'), current_setting('test.sd_quick_revision'), 'a no-op quick status does not advance the edit revision');
select is_empty(
  $$select item_id from public.save_system_design_item_progress_if_revision('estimation','concept',false,current_setting('test.sd_progress_revision')::timestamptz,'reviewed','medium',false,'Stale after quick update.')$$,
  'a quick status winner invalidates a stale full edit'
);

select results_eq(
  $$select item_id,item_type from public.save_system_design_item_progress_if_revision('vector-search','concept',true,null,'comfortable','medium',true,'Concept-specific note.')$$,
  $$values ('vector-search'::text,'concept'::text)$$,
  'shared catalog text creates concept progress independently'
);
select is(public.set_system_design_item_quick_progress('vector-search','design_problem','reviewed'), 'vector-search', 'shared catalog text creates design-problem progress independently');
select is((select count(*)::integer from public.system_design_item_progress where item_id = 'vector-search'), 2, 'item type remains part of progress identity and lock scope');

select results_eq(
  $$select item_id from public.save_system_design_item_progress_if_revision('rate-limiter','design_problem',true,null,'comfortable','high',true,'Preserve this rich row.')$$,
  $$values ('rate-limiter'::text)$$,
  'full absent save wins before browser import'
);
select is(public.import_system_design_item_progress_if_absent('rate-limiter','design_problem'), false, 'browser import cannot overwrite an existing rich full save');
select is((select notes from public.system_design_item_progress where item_id = 'rate-limiter' and item_type = 'design_problem'), 'Preserve this rich row.', 'failed browser import preserves rich fields');
select is(public.import_system_design_item_progress_if_absent('notification-service','design_problem'), true, 'browser import can win an absent-row race');
select is_empty(
  $$select item_id from public.save_system_design_item_progress_if_revision('notification-service','design_problem',true,null,'comfortable','high',true,'Must not overwrite import winner.')$$,
  'absent-revision full save reports conflict after import creates the row'
);
select is(public.set_system_design_item_quick_progress('notification-service','design_problem','comfortable'), 'notification-service', 'quick status can advance an imported row');
select is((select status from public.system_design_item_progress where item_id = 'notification-service' and item_type = 'design_problem'), 'comfortable', 'quick status wins without replacing other imported-row fields');
select is(public.set_system_design_item_quick_progress('job-scheduler','design_problem','reviewed'), 'job-scheduler', 'quick status creates a missing canonical row');
select is_empty(
  $$select item_id from public.save_system_design_item_progress_if_revision('job-scheduler','design_problem',true,null,'comfortable','high',true,'Must not overwrite quick winner.')$$,
  'absent-revision full save reports conflict after quick status creates the row'
);
select throws_ok($$select public.set_system_design_item_quick_progress('estimation','concept','mastered')$$, '23514', 'Invalid System Design progress status', 'quick status rejects fake readiness states');
select throws_ok($$select public.set_system_design_item_quick_progress('invented-concept','concept','reviewed')$$, '23503', 'Unknown canonical System Design item', 'quick status rejects fake catalog IDs');

select set_config('test.sd_document', jsonb_build_object(
  'functional_requirements', jsonb_build_array('Create a short URL'),
  'non_functional_requirements', jsonb_build_array('p99 under 100 ms'),
  'capacity', jsonb_build_object('assumptions', jsonb_build_array(), 'calculations', jsonb_build_array()),
  'apis', jsonb_build_array(), 'data_models', jsonb_build_array(), 'high_level_design', '',
  'deep_dives', jsonb_build_array(), 'bottlenecks', jsonb_build_array(), 'failure_modes', jsonb_build_array(),
  'tradeoffs', jsonb_build_array(), 'follow_ups', jsonb_build_array(), 'final_review_notes', ''
)::text, true);

select set_config('test.sd_attempt', public.create_system_design_attempt(
  'url-shortener','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Owned URL shortener attempt',current_setting('test.sd_document')::jsonb
)::text, true);
select ok(current_setting('test.sd_attempt')::uuid is not null, 'User A creates an attempt');
select is((select application_id from public.system_design_attempts where id = current_setting('test.sd_attempt')::uuid), 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 'owned application context persists');
select is((select status from public.system_design_attempts where id = current_setting('test.sd_attempt')::uuid), 'draft', 'new attempt starts as draft');
select set_config('test.sd_revision', (select revision::text from public.system_design_attempts where id = current_setting('test.sd_attempt')::uuid), true);
select results_eq(
  $$select status from public.save_system_design_attempt(current_setting('test.sd_attempt')::uuid,current_setting('test.sd_revision')::bigint,'Practiced URL shortener','practiced','high','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',current_setting('test.sd_document')::jsonb)$$,
  $$values ('practiced'::text)$$,
  'explicit attempt save updates structured work'
);
select ok((select first_practiced_at is not null from public.system_design_attempts where id = current_setting('test.sd_attempt')::uuid), 'practiced attempt records first practice time');
select is_empty(
  $$select id from public.save_system_design_attempt(current_setting('test.sd_attempt')::uuid,current_setting('test.sd_revision')::bigint,'Stale overwrite','review','low',null,current_setting('test.sd_document')::jsonb)$$,
  'stale concurrency token cannot overwrite newer work'
);
select set_config('test.sd_current_revision', (select revision::text from public.system_design_attempts where id = current_setting('test.sd_attempt')::uuid), true);
select throws_ok($$select * from public.delete_system_design_attempt_if_revision(null,'url-shortener',current_setting('test.sd_current_revision')::bigint)$$, '23514', 'Expected System Design attempt revision is required', 'attempt deletion requires an exact attempt identity');
select throws_ok($$select * from public.delete_system_design_attempt_if_revision(current_setting('test.sd_attempt')::uuid,'url-shortener',null)$$, '23514', 'Expected System Design attempt revision is required', 'attempt deletion requires an exact positive revision');
select throws_ok($$select * from public.delete_system_design_attempt_if_revision(current_setting('test.sd_attempt')::uuid,'fabricated-problem',current_setting('test.sd_current_revision')::bigint)$$, '23503', 'Unknown canonical System Design problem', 'attempt deletion rejects fabricated problem identities');
select throws_ok($$select public.delete_system_design_attempt(current_setting('test.sd_attempt')::uuid)$$, '0A000', 'Revision-checked System Design attempt deletion is required', 'legacy attempt deletion fails safely without mutation');
select is_empty(
  $$select attempt_id from public.delete_system_design_attempt_if_revision(current_setting('test.sd_attempt')::uuid,'url-shortener',current_setting('test.sd_revision')::bigint)$$,
  'a stale attempt revision cannot delete newer saved work'
);
select is((select title from public.system_design_attempts where id = current_setting('test.sd_attempt')::uuid), 'Practiced URL shortener', 'stale attempt deletion preserves the newer worksheet');
select is_empty(
  $$select attempt_id from public.delete_system_design_attempt_if_revision(current_setting('test.sd_attempt')::uuid,'rate-limiter',current_setting('test.sd_current_revision')::bigint)$$,
  'a mismatched canonical problem cannot delete the attempt'
);
select is((select title from public.system_design_attempts where id = current_setting('test.sd_attempt')::uuid), 'Practiced URL shortener', 'problem-mismatched deletion preserves the exact attempt');
select throws_ok($$select public.create_system_design_attempt('estimation',null,'Concept spoof',current_setting('test.sd_document')::jsonb)$$, '23503', 'Unknown canonical System Design problem', 'concept IDs cannot create attempts');
select throws_ok($$select public.create_system_design_attempt('url-shortener','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Foreign app',current_setting('test.sd_document')::jsonb)$$, '23503', 'Application is not owned by current user', 'foreign application context is rejected');
select throws_ok($$select public.create_system_design_attempt('url-shortener',null,'Invalid document','{}'::jsonb)$$, '23514', 'Invalid attempt document', 'unvalidated JSONB is rejected');
select throws_ok(
  $$select public.create_system_design_attempt('url-shortener',null,'Malformed nested document',jsonb_set(current_setting('test.sd_document')::jsonb,'{apis}','[{"method":42,"path":"/v1","purpose":"invalid","extra":"not allowed"}]'::jsonb))$$,
  '23514', 'Invalid attempt document', 'direct RPC rejects malformed nested structured content'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '78787878-7878-4787-8787-787878787878', true);
select is((select count(*)::integer from public.system_design_item_progress), 0, 'User B cannot read User A progress');
select is((select count(*)::integer from public.system_design_attempts), 0, 'User B cannot read User A attempts');
select is_empty(
  $$select item_id from public.save_system_design_item_progress_if_revision('estimation','concept',false,current_setting('test.sd_quick_revision')::timestamptz,'comfortable','high',true,'Foreign overwrite.')$$,
  'foreign and missing owner progress are indistinguishable revision conflicts'
);
select is(public.set_system_design_item_quick_progress('estimation','concept','reviewed'), 'estimation', 'another owner can create independent progress for the same canonical item');
select is((select count(*)::integer from public.system_design_item_progress), 1, 'another owner sees only their own quick-progress row');
select is_empty(
  $$select attempt_id from public.delete_system_design_attempt_if_revision(current_setting('test.sd_attempt')::uuid,'url-shortener',current_setting('test.sd_current_revision')::bigint)$$,
  'User B cannot delete User A attempt'
);
select is_empty(
  $$select attempt_id from public.delete_system_design_attempt_if_revision('99999999-9999-4999-8999-999999999999'::uuid,'url-shortener',current_setting('test.sd_current_revision')::bigint)$$,
  'foreign and missing attempt deletion are indistinguishable'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '56565656-5656-4565-8565-565656565656', true);
select results_eq(
  $$select attempt_id from public.delete_system_design_attempt_if_revision(current_setting('test.sd_attempt')::uuid,'url-shortener',current_setting('test.sd_current_revision')::bigint)$$,
  $$values (current_setting('test.sd_attempt')::uuid)$$,
  'User A deletes their own attempt with the exact displayed revision'
);
select is((select count(*)::integer from public.system_design_attempts), 0, 'attempt cleanup leaves no rows');
select results_eq($$delete from public.system_design_item_progress where item_id = 'estimation' returning 1$$, $$values (1)$$, 'User A can delete owned progress');

select * from finish();
rollback;
