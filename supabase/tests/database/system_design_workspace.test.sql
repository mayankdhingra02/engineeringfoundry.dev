begin;

create extension if not exists pgtap with schema extensions;
select plan(44);

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
select is((select count(*)::integer from public.system_design_item_catalog), 173, 'catalog contains every published concept and problem');
select is((select count(*)::integer from public.system_design_item_catalog where item_type = 'concept'), 146, 'catalog contains published concepts');
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
  $$select status from public.save_system_design_item_progress('estimation','concept','reviewed','medium',true,'State every assumption.')$$,
  $$values ('reviewed'::text)$$,
  'User A saves canonical concept progress'
);
select is((select confidence from public.system_design_item_progress where item_id = 'estimation'), 'medium', 'confidence persists');
select is((select bookmarked from public.system_design_item_progress where item_id = 'estimation'), true, 'bookmark persists');
select is((select notes from public.system_design_item_progress where item_id = 'estimation'), 'State every assumption.', 'private notes persist');
select ok((select first_reviewed_at is not null from public.system_design_item_progress where item_id = 'estimation'), 'first reviewed timestamp is recorded');
select ok((select last_practiced_at is not null from public.system_design_item_progress where item_id = 'estimation'), 'last practiced timestamp is recorded');
select set_config('test.sd_last_practiced', (select last_practiced_at::text from public.system_design_item_progress where item_id = 'estimation'), true);
select results_eq(
  $$select bookmarked from public.save_system_design_item_progress('estimation','concept','reviewed','medium',false,'State every assumption.')$$,
  $$values (false)$$,
  'bookmark-only update persists'
);
select is((select last_practiced_at::text from public.system_design_item_progress where item_id = 'estimation'), current_setting('test.sd_last_practiced'), 'bookmark-only update does not forge practice time');
select throws_ok($$select * from public.save_system_design_item_progress('invented-concept','concept','reviewed','low',false,null)$$, '23503', 'Unknown canonical System Design item', 'fake catalog IDs are rejected');
select throws_ok($$select * from public.save_system_design_item_progress('estimation','concept','mastered','low',false,null)$$, '23514', 'Invalid status', 'fake readiness states are rejected');
select throws_ok($$select * from public.save_system_design_item_progress('estimation','concept','reviewed','certain',false,null)$$, '23514', 'Invalid confidence', 'unsupported confidence is rejected');
select throws_ok($$select * from public.save_system_design_item_progress('estimation','concept','reviewed','low',false,repeat('x',10001))$$, '22001', 'Notes are too long', 'oversized notes are rejected');

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
select is(public.delete_system_design_attempt(current_setting('test.sd_attempt')::uuid), false, 'User B cannot delete User A attempt');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '56565656-5656-4565-8565-565656565656', true);
select is(public.delete_system_design_attempt(current_setting('test.sd_attempt')::uuid), true, 'User A deletes their own attempt through RPC');
select is((select count(*)::integer from public.system_design_attempts), 0, 'attempt cleanup leaves no rows');
select results_eq($$delete from public.system_design_item_progress where item_id = 'estimation' returning 1$$, $$values (1)$$, 'User A can delete owned progress');

select * from finish();
rollback;
