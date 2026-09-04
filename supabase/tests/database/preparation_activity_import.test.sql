begin;

create extension if not exists pgtap with schema extensions;
select plan(41);

select ok(not has_function_privilege('anon', 'public.import_dsa_question_progress_if_absent(text,text)', 'execute'), 'anonymous users cannot import DSA activity');
select ok(has_function_privilege('authenticated', 'public.import_dsa_question_progress_if_absent(text,text)', 'execute'), 'authenticated users can invoke owner-derived DSA import');
select ok(not has_function_privilege('anon', 'public.import_system_design_item_progress_if_absent(text,text)', 'execute'), 'anonymous users cannot import System Design activity');
select ok(has_function_privilege('authenticated', 'public.import_system_design_item_progress_if_absent(text,text)', 'execute'), 'authenticated users can invoke owner-derived System Design import');
select ok(not has_function_privilege('anon', 'public.import_preparation_track_progress_if_absent(text,text,text)', 'execute'), 'anonymous users cannot import ML or Behavioral activity');
select ok(has_function_privilege('authenticated', 'public.import_preparation_track_progress_if_absent(text,text,text)', 'execute'), 'authenticated users can invoke owner-derived track import');

insert into auth.users (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
  ('73737373-7373-4737-8737-737373737373','authenticated','authenticated','activity-import-a@example.test','',now(),'{}','{}',now(),now()),
  ('84848484-8484-4848-8848-848484848484','authenticated','authenticated','activity-import-b@example.test','',now(),'{}','{}',now(),now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '73737373-7373-4737-8737-737373737373', true);

select results_eq(
  $$select status from public.save_dsa_question_progress('two-sum','solved','high',true,'Preserve this private note.')$$,
  $$values ('solved'::text)$$,
  'User A creates rich DSA progress before import'
);
select set_config('test.import_dsa_before', (select to_jsonb(progress)::text from public.dsa_question_progress progress where question_id = 'two-sum'), true);
select is(public.import_dsa_question_progress_if_absent('two-sum','review'), false, 'DSA import reports an existing owner row without updating it');
select is((select to_jsonb(progress)::text from public.dsa_question_progress progress where question_id = 'two-sum'), current_setting('test.import_dsa_before'), 'DSA import preserves every rich field and timestamp byte-for-byte');
select is(public.import_dsa_question_progress_if_absent('course-schedule','review'), true, 'DSA import inserts an absent canonical question');
select results_eq(
  $$select status,confidence,bookmarked,notes from public.dsa_question_progress where question_id = 'course-schedule'$$,
  $$values ('review'::text,null::text,false,null::text)$$,
  'an imported DSA row uses only bounded progress defaults'
);
select ok((select first_attempted_at is not null and last_practiced_at is not null and solved_at is not null from public.dsa_question_progress where question_id = 'course-schedule'), 'review import records internally consistent DSA timestamps');
select is(public.import_dsa_question_progress_if_absent('course-schedule','attempted'), false, 'repeated DSA import is idempotent and preserves the first result');
select throws_ok($$select public.import_dsa_question_progress_if_absent('course-schedule','solved')$$, '23514', 'Invalid imported DSA question status', 'DSA import rejects a status outside the import contract');
select throws_ok($$select public.import_dsa_question_progress_if_absent('fabricated-question','attempted')$$, '23503', 'Unknown canonical DSA question', 'DSA import rejects an unknown catalog ID');
select throws_ok($$select public.import_dsa_question_progress_if_absent(null,'attempted')$$, '23503', 'Unknown canonical DSA question', 'DSA import rejects a null question ID');

select results_eq(
  $$select status from public.save_system_design_item_progress('estimation','concept','comfortable','high',true,'Preserve this private design note.')$$,
  $$values ('comfortable'::text)$$,
  'User A creates rich System Design progress before import'
);
select set_config('test.import_sd_before', (select to_jsonb(progress)::text from public.system_design_item_progress progress where item_id = 'estimation' and item_type = 'concept'), true);
select is(public.import_system_design_item_progress_if_absent('estimation','concept'), false, 'System Design import reports an existing owner row without updating it');
select is((select to_jsonb(progress)::text from public.system_design_item_progress progress where item_id = 'estimation' and item_type = 'concept'), current_setting('test.import_sd_before'), 'System Design import preserves every rich field and timestamp byte-for-byte');
select is(public.import_system_design_item_progress_if_absent('url-shortener','design_problem'), true, 'System Design import inserts an absent canonical item');
select results_eq(
  $$select status,confidence,bookmarked,notes from public.system_design_item_progress where item_id = 'url-shortener' and item_type = 'design_problem'$$,
  $$values ('reviewed'::text,null::text,false,null::text)$$,
  'an imported System Design row uses only bounded progress defaults'
);
select ok((select first_reviewed_at is not null and last_practiced_at is not null from public.system_design_item_progress where item_id = 'url-shortener' and item_type = 'design_problem'), 'System Design import records internally consistent practice timestamps');
select is(public.import_system_design_item_progress_if_absent('url-shortener','design_problem'), false, 'repeated System Design import is idempotent');
select throws_ok($$select public.import_system_design_item_progress_if_absent('estimation','lesson')$$, '23514', 'Invalid System Design item type', 'System Design import rejects an invalid item type');
select throws_ok($$select public.import_system_design_item_progress_if_absent('invented-concept','concept')$$, '23503', 'Unknown canonical System Design item', 'System Design import rejects an unknown catalog ID');
select throws_ok($$select public.import_system_design_item_progress_if_absent(null,'concept')$$, '23503', 'Unknown canonical System Design item', 'System Design import rejects a null item ID');

select results_eq(
  $$select status from public.save_preparation_track_progress('ml-design','ml-problem-recommendation','completed')$$,
  $$values ('completed'::text)$$,
  'User A creates ML activity before import'
);
select set_config('test.import_track_before', (select to_jsonb(progress)::text from public.preparation_track_progress progress where track = 'ml-design' and item_id = 'ml-problem-recommendation'), true);
select is(public.import_preparation_track_progress_if_absent('ml-design','ml-problem-recommendation','in-progress'), false, 'track import reports an existing owner row without updating it');
select is((select to_jsonb(progress)::text from public.preparation_track_progress progress where track = 'ml-design' and item_id = 'ml-problem-recommendation'), current_setting('test.import_track_before'), 'track import preserves every existing field and timestamp byte-for-byte');
select is(public.import_preparation_track_progress_if_absent('behavioral','beh-lead-01','completed'), true, 'track import inserts absent bounded Behavioral activity');
select results_eq(
  $$select status,completed_at is not null from public.preparation_track_progress where track = 'behavioral' and item_id = 'beh-lead-01'$$,
  $$values ('completed'::text,true)$$,
  'an imported completed track row has a consistent completion timestamp'
);
select is(public.import_preparation_track_progress_if_absent('behavioral','beh-lead-01','in-progress'), false, 'repeated track import is idempotent');
select throws_ok($$select public.import_preparation_track_progress_if_absent('dsa','two-sum','completed')$$, '23514', 'Invalid imported preparation track', 'generic track import rejects unsupported tracks');
select throws_ok($$select public.import_preparation_track_progress_if_absent('behavioral','Not Canonical','completed')$$, '23514', 'Invalid imported preparation item', 'generic track import rejects malformed item IDs');
select throws_ok($$select public.import_preparation_track_progress_if_absent('behavioral','beh-lead-01','review')$$, '23514', 'Invalid imported preparation status', 'generic track import rejects unsupported statuses');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '84848484-8484-4848-8848-848484848484', true);
select is(public.import_dsa_question_progress_if_absent('two-sum','attempted'), true, 'User B can import the same DSA key into an independent owner row');
select is(public.import_system_design_item_progress_if_absent('estimation','concept'), true, 'User B can import the same System Design key into an independent owner row');
select is(public.import_preparation_track_progress_if_absent('ml-design','ml-problem-recommendation','in-progress'), true, 'User B can import the same track key into an independent owner row');
select is((select count(*)::integer from public.dsa_question_progress where question_id = 'two-sum'), 1, 'User B sees only their own DSA import row');
select is((select count(*)::integer from public.system_design_item_progress where item_id = 'estimation' and item_type = 'concept'), 1, 'User B sees only their own System Design import row');
select is((select count(*)::integer from public.preparation_track_progress where track = 'ml-design' and item_id = 'ml-problem-recommendation'), 1, 'User B sees only their own generic track import row');

select * from finish();
rollback;
