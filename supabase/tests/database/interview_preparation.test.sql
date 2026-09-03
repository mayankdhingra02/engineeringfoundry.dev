begin;
create extension if not exists pgtap with schema extensions;
select plan(54);

select has_table('public', 'interview_preparations', 'preparation table exists');
select has_table('public', 'interview_preparation_custom_tasks', 'custom task table exists');
select has_column('public', 'interview_preparations', 'round_id', 'preparation owns a round');
select has_column('public', 'interview_preparations', 'completed_template_item_ids', 'stable checklist state exists');
select has_column('public', 'interview_preparations', 'private_notes', 'private notes exist');
select has_column('public', 'interview_preparations', 'topics_asked', 'reflection topics exist');
select has_column('public', 'interview_preparations', 'went_well', 'reflection strengths exist');
select has_column('public', 'interview_preparations', 'needs_improvement', 'reflection improvement exists');
select has_column('public', 'interview_preparations', 'follow_up_notes', 'reflection follow-up exists');
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
select has_function('public', 'set_interview_preparation_checklist_item', array['uuid','text','boolean'], 'atomic checklist RPC exists');
select has_function('public', 'add_interview_preparation_task', array['uuid','text'], 'task add RPC exists');
select has_function('public', 'toggle_interview_preparation_task', array['uuid'], 'task toggle RPC exists');
select has_function('public', 'delete_interview_preparation_task', array['uuid'], 'task delete RPC exists');
select ok(has_function_privilege('authenticated', 'public.set_interview_preparation_checklist_item(uuid,text,boolean)', 'execute'), 'authenticated can set an owned checklist item');
select ok(not has_function_privilege('anon', 'public.set_interview_preparation_checklist_item(uuid,text,boolean)', 'execute'), 'anonymous users cannot set checklist items');
select is(
  (select prosecdef from pg_proc where oid = 'public.set_interview_preparation_checklist_item(uuid,text,boolean)'::regprocedure),
  true,
  'atomic checklist RPC is security definer'
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
select ok(has_function_privilege('authenticated', 'public.toggle_interview_preparation_task(uuid)', 'execute'), 'authenticated can toggle own task');
select ok(has_function_privilege('authenticated', 'public.delete_interview_preparation_task(uuid)', 'execute'), 'authenticated can delete own task');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('91919191-9191-4919-8919-919191919191', 'authenticated', 'authenticated', 'preparation-atomic-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('92929292-9292-4929-8929-929292929292', 'authenticated', 'authenticated', 'preparation-atomic-b@example.test', '', now(), '{}', '{}', now(), now());
insert into public.applications (id, user_id, company_name, role_title, status)
values ('91919191-9191-4919-8919-919191919301', '91919191-9191-4919-8919-919191919191', 'Atomic Preparation Co', 'Engineer', 'Interviewing');
insert into public.interview_rounds (id, application_id, user_id, round_number, round_name, round_type)
values ('91919191-9191-4919-8919-919191919302', '91919191-9191-4919-8919-919191919301', '91919191-9191-4919-8919-919191919191', 1, 'Technical screen', 'Coding');

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

select public.save_interview_preparation('91919191-9191-4919-8919-919191919302', 'Preserve this note', null, null, null, null, null);
select is(
  (select private_notes from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  'Preserve this note',
  'legacy save RPC still stores notes'
);
select is(
  (select completed_template_item_ids from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  '{}'::text[],
  'note-only save starts with an empty checklist'
);
select throws_ok(
  $$select public.save_interview_preparation('91919191-9191-4919-8919-919191919302', null, array['dsa-review-queue'], null, null, null, null)$$,
  '0A000',
  'Checklist items must be updated individually',
  'legacy whole-array checklist writes fail closed'
);
select ok(
  (select private_notes = 'Preserve this note' and completed_template_item_ids = '{}'::text[] from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  'rejected legacy checklist writes leave preparation unchanged'
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
select set_config('request.jwt.claim.sub', '91919191-9191-4919-8919-919191919191', true);
select ok(
  (select private_notes = 'Preserve this note' and completed_template_item_ids = array['dsa-company-set']::text[] from public.interview_preparations where round_id = '91919191-9191-4919-8919-919191919302'),
  'refused foreign and invalid calls do not mutate preparation'
);

select * from finish();
rollback;
