begin;
create extension if not exists pgtap with schema extensions;
select plan(115);

select has_table('public', 'interview_preparations', 'preparation table exists');
select has_table('public', 'interview_preparation_custom_tasks', 'custom task table exists');
select has_column('public', 'interview_preparations', 'round_id', 'preparation owns a round');
select has_column('public', 'interview_preparations', 'completed_template_item_ids', 'stable checklist state exists');
select has_column('public', 'interview_preparations', 'private_notes', 'private notes exist');
select has_column('public', 'interview_preparations', 'topics_asked', 'reflection topics exist');
select has_column('public', 'interview_preparations', 'went_well', 'reflection strengths exist');
select has_column('public', 'interview_preparations', 'needs_improvement', 'reflection improvement exists');
select has_column('public', 'interview_preparations', 'follow_up_notes', 'reflection follow-up exists');
select has_column('public', 'interview_preparations', 'private_notes_updated_at', 'private notes carry an independent revision');
select has_column('public', 'interview_preparations', 'reflection_updated_at', 'reflection fields carry an independent revision');
select has_column('public', 'interview_preparation_custom_tasks', 'completed', 'task completion exists');
select has_column('public', 'interview_preparation_custom_tasks', 'position', 'task order exists');
select col_is_pk('public', 'interview_preparations', 'id', 'preparation id is primary key');
select col_is_pk('public', 'interview_preparation_custom_tasks', 'id', 'task id is primary key');
select has_index('public', 'interview_preparation_custom_tasks', 'interview_preparation_tasks_round_idx', 'task round index exists');
select ok((select relrowsecurity from pg_class where oid = 'public.interview_preparations'::regclass), 'preparation RLS active');
select ok((select relrowsecurity from pg_class where oid = 'public.interview_preparation_custom_tasks'::regclass), 'task RLS active');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'interview_preparations'), 1, 'preparation owner policy only');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'interview_preparation_custom_tasks'), 1, 'task owner policy only');
select has_function('public', 'save_interview_preparation', array['uuid','text','text[]','text','text','text','text'], 'save RPC exists');
select has_function('public', 'save_interview_preparation_notes_if_revision', array['uuid','boolean','timestamp with time zone','text'], 'revision-checked notes RPC exists');
select has_function('public', 'save_interview_preparation_reflection_if_revision', array['uuid','boolean','timestamp with time zone','text','text','text','text'], 'revision-checked reflection RPC exists');
select has_function('public', 'set_interview_preparation_checklist_item', array['uuid','text','boolean'], 'atomic checklist RPC exists');
select has_function('public', 'add_interview_preparation_task', array['uuid','text'], 'task add RPC exists');
select has_function('public', 'set_interview_preparation_task_completed', array['uuid','uuid','boolean'], 'desired-state task completion RPC exists');
select has_function('public', 'toggle_interview_preparation_task', array['uuid'], 'task toggle RPC exists');
select has_function('public', 'delete_interview_preparation_task', array['uuid'], 'task delete RPC exists');
select ok(has_function_privilege('authenticated', 'public.set_interview_preparation_checklist_item(uuid,text,boolean)', 'execute'), 'authenticated can set an owned checklist item');
select ok(not has_function_privilege('anon', 'public.set_interview_preparation_checklist_item(uuid,text,boolean)', 'execute'), 'anonymous users cannot set checklist items');
select ok(has_function_privilege('authenticated', 'public.save_interview_preparation_notes_if_revision(uuid,boolean,timestamptz,text)', 'execute'), 'authenticated can save owned notes with a revision');
select ok(not has_function_privilege('anon', 'public.save_interview_preparation_notes_if_revision(uuid,boolean,timestamptz,text)', 'execute'), 'anonymous users cannot save preparation notes');
select ok(has_function_privilege('authenticated', 'public.save_interview_preparation_reflection_if_revision(uuid,boolean,timestamptz,text,text,text,text)', 'execute'), 'authenticated can save owned reflections with a revision');
select ok(not has_function_privilege('anon', 'public.save_interview_preparation_reflection_if_revision(uuid,boolean,timestamptz,text,text,text,text)', 'execute'), 'anonymous users cannot save preparation reflections');
select ok(has_function_privilege('authenticated', 'public.save_interview_preparation(uuid,text,text[],text,text,text,text)', 'execute'), 'authenticated old clients can reach the retired legacy RPC fail-safe');
select ok(not has_function_privilege('anon', 'public.save_interview_preparation(uuid,text,text[],text,text,text,text)', 'execute'), 'anonymous users cannot reach the retired legacy RPC');
select is(
  (select prosecdef from pg_proc where oid = 'public.set_interview_preparation_checklist_item(uuid,text,boolean)'::regprocedure),
  true,
  'atomic checklist RPC is security definer'
);
select is(
  (select prosecdef from pg_proc where oid = 'public.save_interview_preparation_notes_if_revision(uuid,boolean,timestamptz,text)'::regprocedure),
  true,
  'notes CAS RPC is security definer'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.save_interview_preparation_notes_if_revision(uuid,boolean,timestamptz,text)'::regprocedure),
  'notes CAS RPC has an empty search path'
);
select is(
  (select provolatile from pg_proc where oid = 'public.save_interview_preparation_notes_if_revision(uuid,boolean,timestamptz,text)'::regprocedure),
  'v'::"char",
  'notes CAS RPC is volatile'
);
select is(
  pg_get_function_result('public.save_interview_preparation_notes_if_revision(uuid,boolean,timestamptz,text)'::regprocedure),
  'TABLE(round_id uuid, updated_at timestamp with time zone)',
  'notes CAS RPC returns only the round and revision'
);
select is(
  (select prosecdef from pg_proc where oid = 'public.save_interview_preparation_reflection_if_revision(uuid,boolean,timestamptz,text,text,text,text)'::regprocedure),
  true,
  'reflection CAS RPC is security definer'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.save_interview_preparation_reflection_if_revision(uuid,boolean,timestamptz,text,text,text,text)'::regprocedure),
  'reflection CAS RPC has an empty search path'
);
select is(
  (select provolatile from pg_proc where oid = 'public.save_interview_preparation_reflection_if_revision(uuid,boolean,timestamptz,text,text,text,text)'::regprocedure),
  'v'::"char",
  'reflection CAS RPC is volatile'
);
select is(
  pg_get_function_result('public.save_interview_preparation_reflection_if_revision(uuid,boolean,timestamptz,text,text,text,text)'::regprocedure),
  'TABLE(round_id uuid, updated_at timestamp with time zone)',
  'reflection CAS RPC returns only the round and revision'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.set_interview_preparation_checklist_item(uuid,text,boolean)'::regprocedure),
  'atomic checklist RPC has an empty search path'
);
select is(
  (select provolatile from pg_proc where oid = 'public.set_interview_preparation_checklist_item(uuid,text,boolean)'::regprocedure),
  'v'::"char",
  'atomic checklist RPC is volatile'
);
select is(
  (select pg_get_function_result('public.set_interview_preparation_checklist_item(uuid,text,boolean)'::regprocedure)),
  'uuid',
  'atomic checklist RPC returns the owned application id'
);
select ok(has_function_privilege('authenticated', 'public.set_interview_preparation_task_completed(uuid,uuid,boolean)', 'execute'), 'authenticated can set an owned task to an explicit completion state');
select ok(not has_function_privilege('anon', 'public.set_interview_preparation_task_completed(uuid,uuid,boolean)', 'execute'), 'anonymous callers cannot execute desired-state task completion');
select ok(has_function_privilege('authenticated', 'public.toggle_interview_preparation_task(uuid)', 'execute'), 'authenticated old clients can reach the retired task-toggle fail-safe');
select ok(not has_function_privilege('anon', 'public.toggle_interview_preparation_task(uuid)', 'execute'), 'anonymous callers cannot execute the retired task toggle');
select ok(not has_table_privilege('authenticated', 'public.interview_preparation_custom_tasks', 'update'), 'clients cannot bypass desired-state task completion with direct updates');
select is(
  (select prosecdef from pg_proc where oid = 'public.set_interview_preparation_task_completed(uuid,uuid,boolean)'::regprocedure),
  true,
  'desired-state task completion is security definer'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.set_interview_preparation_task_completed(uuid,uuid,boolean)'::regprocedure),
  'desired-state task completion has an empty search path'
);
select is(
  (select provolatile from pg_proc where oid = 'public.set_interview_preparation_task_completed(uuid,uuid,boolean)'::regprocedure),
  'v'::"char",
  'desired-state task completion is volatile'
);
select is(
  pg_get_function_result('public.set_interview_preparation_task_completed(uuid,uuid,boolean)'::regprocedure),
  'TABLE(task_id uuid, round_id uuid, application_id uuid, completed boolean)',
  'desired-state task completion returns only its correlated owner context'
);
select ok(has_function_privilege('authenticated', 'public.delete_interview_preparation_task(uuid)', 'execute'), 'authenticated can delete own task');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('91919191-9191-4919-8919-919191919191', 'authenticated', 'authenticated', 'preparation-atomic-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('92929292-9292-4929-8929-929292929292', 'authenticated', 'authenticated', 'preparation-atomic-b@example.test', '', now(), '{}', '{}', now(), now());
insert into public.applications (id, user_id, company_name, role_title, status)
values ('91919191-9191-4919-8919-919191919301', '91919191-9191-4919-8919-919191919191', 'Atomic Preparation Co', 'Engineer', 'Interviewing');
insert into public.interview_rounds (id, application_id, user_id, round_number, round_name, round_type)
values ('91919191-9191-4919-8919-919191919302', '91919191-9191-4919-8919-919191919301', '91919191-9191-4919-8919-919191919191', 1, 'Technical screen', 'Coding');
insert into public.interview_preparation_custom_tasks (id, round_id, user_id, title, completed, position)
values ('91919191-9191-4919-8919-919191919303', '91919191-9191-4919-8919-919191919302', '91919191-9191-4919-8919-919191919191', 'Verify the environment', false, 0);

set local role authenticated;
select set_config('request.jwt.claim.sub', '91919191-9191-4919-8919-919191919191', true);

select is(
  public.set_interview_preparation_checklist_item('91919191-9191-4919-8919-919191919302', 'dsa-review-queue', false),
  '91919191-9191-4919-8919-919191919301'::uuid,
  'setting false on missing preparation succeeds and returns the application id'
);
select is(
  (select count(*)::integer from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  0,
  'setting false on missing preparation does not create an empty row'
);

select results_eq(
  $$select round_id from public.save_interview_preparation_notes_if_revision('91919191-9191-4919-8919-919191919302', true, null, 'Preserve this note')$$,
  $$values ('91919191-9191-4919-8919-919191919302'::uuid)$$,
  'an absent notes revision creates the first notes snapshot'
);
select is(
  (select private_notes from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  'Preserve this note',
  'revision-checked notes save stores notes'
);
select ok(
  (select private_notes_updated_at is not null from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  'the first notes save records a revision'
);
select is(
  (select completed_template_item_ids from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  '{}'::text[],
  'note-only save starts with an empty checklist'
);
select throws_ok(
  $$select public.save_interview_preparation('91919191-9191-4919-8919-919191919302', 'legacy overwrite', null, null, null, null, null)$$,
  '0A000',
  'Revision-checked preparation text saving is required',
  'legacy preparation snapshot writes fail closed'
);
select ok(
  (select private_notes = 'Preserve this note' and completed_template_item_ids = '{}'::text[] from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  'rejected legacy snapshot writes leave preparation unchanged'
);
select is(
  (select count(*)::integer from public.save_interview_preparation_notes_if_revision(
    '91919191-9191-4919-8919-919191919302',
    false,
    '2000-01-01T00:00:00Z',
    'stale overwrite'
  )),
  0,
  'a stale notes revision returns no row'
);
select is(
  (select private_notes from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  'Preserve this note',
  'a stale notes revision cannot overwrite the saved text'
);
select throws_ok(
  $$select * from public.save_interview_preparation_notes_if_revision('91919191-9191-4919-8919-919191919302', true, '2026-09-04T00:00:00Z', 'invalid revision state')$$,
  '23514',
  'Expected preparation notes revision is invalid',
  'notes require an exactly correlated absent or loaded revision'
);
select throws_ok(
  $$select * from public.save_interview_preparation_notes_if_revision('91919191-9191-4919-8919-919191919302', false, null, 'invalid revision state')$$,
  '23514',
  'Expected preparation notes revision is invalid',
  'loaded notes revisions cannot omit their timestamp'
);
select throws_ok(
  $$select * from public.save_interview_preparation_notes_if_revision('91919191-9191-4919-8919-919191919302', true, null, null)$$,
  '23502',
  'Preparation notes are required',
  'null notes fail closed'
);
select throws_ok(
  $$select * from public.save_interview_preparation_notes_if_revision('91919191-9191-4919-8919-919191919302', true, null, repeat('n', 12001))$$,
  '22001',
  'Preparation notes are too long',
  'oversized notes fail closed'
);

select is(
  public.set_interview_preparation_checklist_item('91919191-9191-4919-8919-919191919302', 'dsa-review-queue', true),
  '91919191-9191-4919-8919-919191919301'::uuid,
  'completing one item returns the application id'
);
select is(
  (select count(*)::integer from public.interview_preparations, unnest(completed_template_item_ids) item where item = 'dsa-review-queue'),
  1,
  'completing an item appends it once'
);
select is(
  public.set_interview_preparation_checklist_item('91919191-9191-4919-8919-919191919302', 'dsa-review-queue', true),
  '91919191-9191-4919-8919-919191919301'::uuid,
  'repeating an already-complete desired state succeeds'
);
select is(
  (select count(*)::integer from public.interview_preparations, unnest(completed_template_item_ids) item where item = 'dsa-review-queue'),
  1,
  'repeated true never creates a duplicate'
);
select is(
  public.set_interview_preparation_checklist_item('91919191-9191-4919-8919-919191919302', 'dsa-company-set', true),
  '91919191-9191-4919-8919-919191919301'::uuid,
  'completing a distinct item returns the application id'
);
select is(
  (select completed_template_item_ids from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  array['dsa-review-queue', 'dsa-company-set']::text[],
  'distinct desired-state updates retain both checklist items'
);
select is(
  (select private_notes from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  'Preserve this note',
  'checklist updates preserve notes'
);

select results_eq(
  $$select task_id, round_id, application_id, completed from public.set_interview_preparation_task_completed('91919191-9191-4919-8919-919191919302', '91919191-9191-4919-8919-919191919303', true)$$,
  $$values ('91919191-9191-4919-8919-919191919303'::uuid, '91919191-9191-4919-8919-919191919302'::uuid, '91919191-9191-4919-8919-919191919301'::uuid, true)$$,
  'a desired completed task returns its exact owner context'
);
select ok(
  (select completed from public.interview_preparation_custom_tasks where id = '91919191-9191-4919-8919-919191919303'),
  'desired-state task completion stores the explicit true target'
);

reset role;
create temporary table test_preparation_task_revision(value timestamptz);
insert into test_preparation_task_revision
select updated_at from public.interview_preparation_custom_tasks where id = '91919191-9191-4919-8919-919191919303';
grant select on test_preparation_task_revision to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub', '91919191-9191-4919-8919-919191919191', true);

select results_eq(
  $$select task_id, round_id, application_id, completed from public.set_interview_preparation_task_completed('91919191-9191-4919-8919-919191919302', '91919191-9191-4919-8919-919191919303', true)$$,
  $$values ('91919191-9191-4919-8919-919191919303'::uuid, '91919191-9191-4919-8919-919191919302'::uuid, '91919191-9191-4919-8919-919191919301'::uuid, true)$$,
  'repeating an identical desired task state still returns the correlated result'
);
select is(
  (select updated_at from public.interview_preparation_custom_tasks where id = '91919191-9191-4919-8919-919191919303'),
  (select value from test_preparation_task_revision),
  'repeating the same desired task state does not churn its timestamp'
);
select results_eq(
  $$select task_id, round_id, application_id, completed from public.set_interview_preparation_task_completed('91919191-9191-4919-8919-919191919302', '91919191-9191-4919-8919-919191919303', false)$$,
  $$values ('91919191-9191-4919-8919-919191919303'::uuid, '91919191-9191-4919-8919-919191919302'::uuid, '91919191-9191-4919-8919-919191919301'::uuid, false)$$,
  'an explicit incomplete target returns one exact result'
);
select ok(
  (select not completed and updated_at > (select value from test_preparation_task_revision)
   from public.interview_preparation_custom_tasks
   where id = '91919191-9191-4919-8919-919191919303'),
  'a changed desired task state stores false and advances its revision monotonically'
);
select throws_ok(
  $$select * from public.set_interview_preparation_task_completed('91919191-9191-4919-8919-919191919302', '91919191-9191-4919-8919-919191919303', null)$$,
  '23502',
  'Task completion state is required',
  'null task completion intent fails closed'
);
select throws_ok(
  $$select * from public.set_interview_preparation_task_completed(null, '91919191-9191-4919-8919-919191919303', true)$$,
  '23514',
  'Invalid preparation task target',
  'null task identity fails closed'
);
select is(
  (select count(*)::integer from public.set_interview_preparation_task_completed('93939393-9393-4939-8939-939393939393', '91919191-9191-4919-8919-919191919303', true)),
  0,
  'a mismatched round and task identity returns no row'
);

select set_config('request.jwt.claim.sub', '92929292-9292-4929-8929-929292929292', true);
select is(
  (select count(*)::integer from public.set_interview_preparation_task_completed('91919191-9191-4919-8919-919191919302', '91919191-9191-4919-8919-919191919303', true)),
  0,
  'a foreign preparation task returns no row'
);
select is(
  (select count(*)::integer from public.set_interview_preparation_task_completed('93939393-9393-4939-8939-939393939393', '93939393-9393-4939-8939-939393939394', true)),
  0,
  'missing and foreign preparation tasks are indistinguishable'
);

select set_config('request.jwt.claim.sub', '91919191-9191-4919-8919-919191919191', true);
select is(
  (select completed from public.interview_preparation_custom_tasks where id = '91919191-9191-4919-8919-919191919303'),
  false,
  'foreign missing and mismatched calls leave the owner task unchanged'
);
select throws_ok(
  $$select public.toggle_interview_preparation_task('91919191-9191-4919-8919-919191919303')$$,
  '0A000',
  'Desired-state preparation task saving is required',
  'legacy task toggles fail safely without mutation'
);
select is(
  (select completed from public.interview_preparation_custom_tasks where id = '91919191-9191-4919-8919-919191919303'),
  false,
  'a rejected legacy task toggle preserves the saved desired state'
);

reset role;
update public.interview_preparations
set completed_template_item_ids = array['dsa-review-queue', 'dsa-review-queue', 'dsa-company-set'];
set local role authenticated;
select set_config('request.jwt.claim.sub', '91919191-9191-4919-8919-919191919191', true);

select is(
  public.set_interview_preparation_checklist_item('91919191-9191-4919-8919-919191919302', 'dsa-review-queue', false),
  '91919191-9191-4919-8919-919191919301'::uuid,
  'clearing an item returns the application id'
);
select is(
  (select count(*)::integer from public.interview_preparations, unnest(completed_template_item_ids) item where item = 'dsa-review-queue'),
  0,
  'clearing an item removes every legacy duplicate'
);
select is(
  (select count(*)::integer from public.interview_preparations, unnest(completed_template_item_ids) item where item = 'dsa-company-set'),
  1,
  'clearing one item preserves other checklist items'
);
select is(
  (select private_notes from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  'Preserve this note',
  'clearing a checklist item preserves notes'
);
select throws_ok(
  $$select public.set_interview_preparation_checklist_item('91919191-9191-4919-8919-919191919302', 'unknown-item', true)$$,
  '23514',
  'Unknown interview preparation checklist item',
  'unknown checklist ids fail closed'
);
select throws_ok(
  $$select public.set_interview_preparation_checklist_item('91919191-9191-4919-8919-919191919302', null, true)$$,
  '23514',
  'Unknown interview preparation checklist item',
  'null checklist ids fail closed'
);
select throws_ok(
  $$select public.set_interview_preparation_checklist_item('91919191-9191-4919-8919-919191919302', 'dsa-review-queue', null)$$,
  '23502',
  'Checklist completion state is required',
  'null completion state fails closed'
);

select throws_ok(
  $$select * from public.save_interview_preparation_reflection_if_revision('91919191-9191-4919-8919-919191919302', true, null, 'Caching', 'Clear trade-offs', 'Estimate sooner', 'Send thanks')$$,
  '23514',
  'Reflection is available after the round is completed',
  'reflection remains unavailable before round completion'
);

reset role;
update public.interview_rounds
set status = 'Completed'
where id = '91919191-9191-4919-8919-919191919302';
set local role authenticated;
select set_config('request.jwt.claim.sub', '91919191-9191-4919-8919-919191919191', true);

select results_eq(
  $$select round_id from public.save_interview_preparation_reflection_if_revision('91919191-9191-4919-8919-919191919302', true, null, 'Caching', 'Clear trade-offs', 'Estimate sooner', 'Send thanks')$$,
  $$values ('91919191-9191-4919-8919-919191919302'::uuid)$$,
  'an absent reflection revision saves one complete reflection snapshot'
);
select ok(
  (select topics_asked = 'Caching'
    and went_well = 'Clear trade-offs'
    and needs_improvement = 'Estimate sooner'
    and follow_up_notes = 'Send thanks'
    and reflection_updated_at is not null
   from public.interview_preparations
   where round_id = '91919191-9191-4919-8919-919191919302'),
  'reflection content and its independent revision save together'
);
select is(
  (select count(*)::integer from public.save_interview_preparation_reflection_if_revision(
    '91919191-9191-4919-8919-919191919302',
    false,
    '2000-01-01T00:00:00Z',
    'stale topics',
    'stale strengths',
    'stale improvements',
    'stale follow-up'
  )),
  0,
  'a stale reflection revision returns no row'
);
select ok(
  (select topics_asked = 'Caching'
    and went_well = 'Clear trade-offs'
    and needs_improvement = 'Estimate sooner'
    and follow_up_notes = 'Send thanks'
   from public.interview_preparations
   where round_id = '91919191-9191-4919-8919-919191919302'),
  'a stale reflection revision cannot mix or overwrite fields'
);
select throws_ok(
  $$select * from public.save_interview_preparation_reflection_if_revision('91919191-9191-4919-8919-919191919302', true, '2026-09-04T00:00:00Z', '', '', '', '')$$,
  '23514',
  'Expected preparation reflection revision is invalid',
  'reflection requires an exactly correlated absent or loaded revision'
);
select throws_ok(
  $$select * from public.save_interview_preparation_reflection_if_revision('91919191-9191-4919-8919-919191919302', true, null, null, '', '', '')$$,
  '23502',
  'Preparation reflection values are required',
  'null reflection fields fail closed'
);
select throws_ok(
  $$select * from public.save_interview_preparation_reflection_if_revision('91919191-9191-4919-8919-919191919302', true, null, repeat('r', 8001), '', '', '')$$,
  '22001',
  'Preparation reflection is too long',
  'oversized reflection fields fail closed'
);

select set_config('request.jwt.claim.sub', '92929292-9292-4929-8929-929292929292', true);
select throws_ok(
  $$select public.set_interview_preparation_checklist_item('91919191-9191-4919-8919-919191919302', 'dsa-review-queue', true)$$,
  'P0002',
  'Interview round not found',
  'foreign rounds are refused without disclosing ownership'
);
select throws_ok(
  $$select public.set_interview_preparation_checklist_item('93939393-9393-4939-8939-939393939393', 'dsa-review-queue', true)$$,
  'P0002',
  'Interview round not found',
  'missing and foreign rounds are indistinguishable'
);
select is(
  (select count(*)::integer from public.save_interview_preparation_notes_if_revision(
    '91919191-9191-4919-8919-919191919302', true, null, 'foreign note'
  )),
  0,
  'foreign notes saves return the same zero-row conflict as stale saves'
);
select is(
  (select count(*)::integer from public.save_interview_preparation_notes_if_revision(
    '93939393-9393-4939-8939-939393939393', true, null, 'missing note'
  )),
  0,
  'missing and foreign notes targets are indistinguishable'
);
select is(
  (select count(*)::integer from public.save_interview_preparation_reflection_if_revision(
    '91919191-9191-4919-8919-919191919302', true, null, '', '', '', ''
  )),
  0,
  'foreign reflection saves return the same zero-row conflict as stale saves'
);
select is(
  (select count(*)::integer from public.save_interview_preparation_reflection_if_revision(
    '93939393-9393-4939-8939-939393939393', true, null, '', '', '', ''
  )),
  0,
  'missing and foreign reflection targets are indistinguishable'
);
select set_config('request.jwt.claim.sub', '91919191-9191-4919-8919-919191919191', true);
select ok(
  (select private_notes = 'Preserve this note' and completed_template_item_ids = array['dsa-company-set']::text[] from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  'refused foreign and invalid calls do not mutate preparation'
);

select * from finish();
rollback;
