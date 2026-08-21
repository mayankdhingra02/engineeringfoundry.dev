begin;

create extension if not exists pgtap with schema extensions;
select plan(117);

select ok(not has_table_privilege('anon', 'public.user_preparation_preferences', 'select'), 'anon cannot read preparation preferences');
select ok(not has_table_privilege('anon', 'public.dsa_progress', 'select'), 'anon cannot read DSA progress');
select ok(not has_table_privilege('anon', 'public.system_design_progress', 'select'), 'anon cannot read System Design progress');
select ok(not has_table_privilege('anon', 'public.behavioral_saved_questions', 'select'), 'anon cannot read saved behavioral questions');
select ok(not has_table_privilege('anon', 'public.preparation_track_progress', 'select'), 'anon cannot read ML or Behavioral preparation activity');
select ok(has_table_privilege('authenticated', 'public.user_preparation_preferences', 'select'), 'authenticated can read owned preparation preferences through RLS');
select ok(has_table_privilege('authenticated', 'public.dsa_progress', 'select'), 'authenticated can read owned DSA progress through RLS');
select ok(has_table_privilege('authenticated', 'public.system_design_progress', 'select'), 'authenticated can read owned System Design progress through RLS');
select ok(has_table_privilege('authenticated', 'public.behavioral_saved_questions', 'select'), 'authenticated can read owned saved questions through RLS');
select ok(has_table_privilege('authenticated', 'public.preparation_track_progress', 'select'), 'authenticated can read owned ML or Behavioral preparation activity through RLS');
select ok(not has_function_privilege('anon', 'public.replace_behavioral_story_themes(uuid,text[])', 'execute'), 'anon cannot replace story themes');
select ok(has_function_privilege('authenticated', 'public.replace_behavioral_story_themes(uuid,text[])', 'execute'), 'authenticated can invoke owner-checked theme replacement');
select ok(not has_function_privilege('anon', 'public.move_interview_round(uuid,uuid,text)', 'execute'), 'anon cannot reorder interview rounds');
select ok(has_function_privilege('authenticated', 'public.move_interview_round(uuid,uuid,text)', 'execute'), 'authenticated can invoke owner-checked round reordering');
select ok(not has_function_privilege('anon', 'public.record_local_system_design_import(integer)', 'execute'), 'anon cannot record a local System Design import');
select ok(has_function_privilege('authenticated', 'public.record_local_system_design_import(integer)', 'execute'), 'authenticated can invoke owner-resolved local import recording');
select ok(not has_function_privilege('anon', 'public.save_preparation_track_progress(text,text,text)', 'execute'), 'anon cannot write preparation activity');
select ok(has_function_privilege('authenticated', 'public.save_preparation_track_progress(text,text,text)', 'execute'), 'authenticated can write owner-resolved preparation activity');
select ok(not has_column_privilege('authenticated', 'public.user_preparation_preferences', 'created_at', 'insert'), 'clients cannot assign preparation creation timestamps');
select ok(not has_column_privilege('authenticated', 'public.user_preparation_preferences', 'user_id', 'update'), 'clients cannot reassign preparation ownership');
select ok(not has_column_privilege('authenticated', 'public.user_preparation_preferences', 'local_system_design_import_version', 'insert'), 'clients cannot insert a local import version directly');
select ok(not has_column_privilege('authenticated', 'public.user_preparation_preferences', 'local_system_design_imported_at', 'insert'), 'clients cannot insert a local import timestamp directly');
select ok(not has_column_privilege('authenticated', 'public.user_preparation_preferences', 'local_system_design_import_version', 'update'), 'clients cannot downgrade a local import version directly');
select ok(not has_column_privilege('authenticated', 'public.user_preparation_preferences', 'local_system_design_imported_at', 'update'), 'clients cannot forge a local import timestamp directly');
select ok(not has_column_privilege('authenticated', 'public.applications', 'user_id', 'update'), 'clients cannot reassign application ownership');
select ok(not has_column_privilege('authenticated', 'public.behavioral_stories', 'user_id', 'update'), 'clients cannot reassign story ownership');
select ok(has_column_privilege('authenticated', 'public.applications', 'status', 'update'), 'clients retain the application status mutation they need');
select ok(has_column_privilege('authenticated', 'public.behavioral_answers', 'answer_text', 'update'), 'clients retain the answer text mutation they need');
select ok(not has_table_privilege('authenticated', 'public.behavioral_story_themes', 'update'), 'immutable story themes have no generic update privilege');
select ok(not has_table_privilege('authenticated', 'public.behavioral_story_question_links', 'update'), 'immutable story links have no generic update privilege');
select ok(not has_column_privilege('authenticated', 'public.applications', 'id', 'insert'), 'clients cannot assign application IDs');
select ok(not has_column_privilege('authenticated', 'public.interview_rounds', 'id', 'insert'), 'clients cannot assign interview round IDs');
select ok(not has_column_privilege('authenticated', 'public.behavioral_custom_questions', 'id', 'insert'), 'clients cannot assign custom question IDs');
select ok(not has_column_privilege('authenticated', 'public.behavioral_stories', 'id', 'insert'), 'clients cannot assign story IDs');
select ok(not has_column_privilege('authenticated', 'public.behavioral_story_themes', 'id', 'insert'), 'clients cannot assign story theme IDs');
select ok(not has_column_privilege('authenticated', 'public.behavioral_story_question_links', 'id', 'insert'), 'clients cannot assign story link IDs');
select ok(not has_column_privilege('authenticated', 'public.behavioral_answers', 'id', 'insert'), 'clients cannot assign answer IDs');

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
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'authenticated', 'authenticated', 'preparation-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'authenticated', 'authenticated', 'preparation-b@example.test', '', now(), '{}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', true);

insert into public.applications (user_id, company_name, role_title, status)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Example Co', 'Software Engineer', 'Interviewing');
select set_config(
  'test.preparation_application_id',
  (select id::text from public.applications where company_name = 'Example Co'),
  true
);

insert into public.interview_rounds (application_id, user_id, round_number, round_name, round_type)
values
  (current_setting('test.preparation_application_id')::uuid, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 1, 'Recruiter Screen', 'Recruiter Screen'),
  (current_setting('test.preparation_application_id')::uuid, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 2, 'Technical Screen', 'Coding');
select set_config(
  'test.preparation_first_round_id',
  (select id::text from public.interview_rounds where round_name = 'Recruiter Screen'),
  true
);
select set_config(
  'test.preparation_second_round_id',
  (select id::text from public.interview_rounds where round_name = 'Technical Screen'),
  true
);

insert into public.behavioral_custom_questions (user_id, question_text, category)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Tell me about a difficult technical decision?', 'Leadership');
select set_config(
  'test.preparation_custom_question_id',
  (select id::text from public.behavioral_custom_questions where question_text = 'Tell me about a difficult technical decision?'),
  true
);

insert into public.behavioral_stories (user_id, title)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'Recovered a delayed launch');
select set_config(
  'test.preparation_story_id',
  (select id::text from public.behavioral_stories where title = 'Recovered a delayed launch'),
  true
);

insert into public.user_preparation_preferences (
  user_id,
  dsa_level,
  dsa_plan_id,
  dsa_company_slug,
  dsa_preferred_language_slug,
  dsa_interview_date,
  system_design_level,
  system_design_preparation_window,
  system_design_role,
  system_design_minutes_per_day
)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'sde2',
  '60d',
  'amazon',
  'python',
  '2026-09-15',
  'sde2',
  '2-weeks',
  'backend',
  60
);

insert into public.dsa_progress (user_id, item_kind, item_id, status)
values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'problem', 'two-sum', 'attempted'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'roadmap-task', 'arrays', 'in-progress'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'mixed-set', 'sde2-mixed-1', 'attempted'),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'timed-practice', 'sde2-timed-1', 'attempted');

insert into public.system_design_progress (user_id, item_kind, item_id, status, completed_at)
values
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'topic', 'caching', 'in-progress', null),
  ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'practice', 'url-shortener', 'completed', now());

insert into public.behavioral_saved_questions (user_id, curated_question_id)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'beh-lead-01');
insert into public.behavioral_saved_questions (user_id, custom_question_id)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', current_setting('test.preparation_custom_question_id')::uuid);
select is(
  (select count(*)::integer from public.save_preparation_track_progress('ml-design', 'ml-problem-recommendation', 'completed')),
  1,
  'owner can record canonical ML preparation activity through the owner-resolved function'
);

select is((select count(*)::integer from public.user_preparation_preferences), 1, 'owner can create and read preparation preferences');
select is((select count(*)::integer from public.dsa_progress), 4, 'owner can create and read each DSA progress kind');
select is((select count(*)::integer from public.system_design_progress), 2, 'owner can create and read System Design progress');
select is((select count(*)::integer from public.behavioral_saved_questions), 2, 'owner can save curated and custom behavioral questions');
select is((select count(*)::integer from public.preparation_track_progress), 1, 'owner can read recorded preparation activity');
select results_eq(
  $$update public.user_preparation_preferences set dsa_plan_id = '30d' where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' returning dsa_plan_id$$,
  $$values ('30d'::text)$$,
  'owner can update preparation preferences'
);
select results_eq(
  $$update public.dsa_progress set status = 'solved' where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' and item_kind = 'problem' and item_id = 'two-sum' returning status$$,
  $$values ('solved'::text)$$,
  'owner can update DSA progress'
);
select results_eq(
  $$update public.system_design_progress set status = 'completed', completed_at = now(), last_interacted_at = now() where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' and item_kind = 'topic' and item_id = 'caching' returning status$$,
  $$values ('completed'::text)$$,
  'owner can update System Design progress'
);
select is(public.record_local_system_design_import(2), true, 'owner can record a local System Design import version');
select is(
  (select local_system_design_import_version from public.user_preparation_preferences),
  2,
  'local import RPC persists the requested version'
);
select ok(
  (select local_system_design_imported_at is not null from public.user_preparation_preferences),
  'local import RPC records the import instant'
);
select set_config(
  'test.preparation_imported_at',
  (select local_system_design_imported_at::text from public.user_preparation_preferences),
  true
);
select is(public.record_local_system_design_import(2), true, 'local import RPC accepts an idempotent equal version');
select is(
  (select local_system_design_imported_at::text from public.user_preparation_preferences),
  current_setting('test.preparation_imported_at'),
  'idempotent local import recording preserves the original import instant'
);
select is(public.record_local_system_design_import(1), false, 'local import RPC rejects a version downgrade');
select is(
  (select local_system_design_import_version from public.user_preparation_preferences),
  2,
  'rejected downgrade preserves the authoritative import version'
);
select is(public.record_local_system_design_import(0), false, 'local import RPC rejects a non-positive version');
select is(
  public.replace_behavioral_story_themes(
    current_setting('test.preparation_story_id')::uuid,
    array[' Leadership ', 'Ownership', 'Leadership']
  ),
  true,
  'owner can atomically replace story themes'
);
select is(
  (select array_agg(theme order by theme) from public.behavioral_story_themes where story_id = current_setting('test.preparation_story_id')::uuid),
  array['Leadership', 'Ownership']::text[],
  'theme replacement trims and deduplicates values'
);
select is(
  public.replace_behavioral_story_themes(current_setting('test.preparation_story_id')::uuid, array['']),
  false,
  'theme replacement rejects an empty normalized theme'
);
select is((select count(*)::integer from public.behavioral_story_themes), 2, 'invalid theme replacement leaves existing themes intact');
select is(
  public.move_interview_round(
    current_setting('test.preparation_application_id')::uuid,
    current_setting('test.preparation_second_round_id')::uuid,
    'up'
  ),
  true,
  'owner can reorder adjacent rounds atomically'
);
select is(
  (select round_name from public.interview_rounds where application_id = current_setting('test.preparation_application_id')::uuid order by round_number limit 1),
  'Technical Screen',
  'atomic reordering persists the swapped order'
);
select is(
  public.move_interview_round(
    current_setting('test.preparation_application_id')::uuid,
    current_setting('test.preparation_second_round_id')::uuid,
    'up'
  ),
  false,
  'moving the first round farther up is a safe no-op'
);
select throws_ok(
  $$insert into public.interview_rounds (application_id, user_id, round_number, round_name, round_type) values (current_setting('test.preparation_application_id')::uuid, 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 1, 'Duplicate order', 'Coding')$$,
  '23505'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'ffffffff-ffff-4fff-8fff-ffffffffffff', true);

select is((select count(*)::integer from public.user_preparation_preferences), 0, 'another user cannot read preparation preferences');
select is((select count(*)::integer from public.dsa_progress), 0, 'another user cannot read DSA progress');
select is((select count(*)::integer from public.system_design_progress), 0, 'another user cannot read System Design progress');
select is((select count(*)::integer from public.behavioral_saved_questions), 0, 'another user cannot read saved behavioral questions');
select is((select count(*)::integer from public.preparation_track_progress), 0, 'another user cannot read preparation activity');
select is_empty(
  $$update public.user_preparation_preferences set dsa_level = 'sde1' where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' returning user_id$$,
  'another user cannot update preparation preferences'
);
select is_empty(
  $$update public.dsa_progress set status = 'comfortable' where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' and item_kind = 'problem' and item_id = 'two-sum' returning user_id$$,
  'another user cannot update DSA progress'
);
select is_empty(
  $$update public.system_design_progress set status = 'in-progress', completed_at = null where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' and item_kind = 'topic' and item_id = 'caching' returning user_id$$,
  'another user cannot update System Design progress'
);
select throws_ok(
  $$update public.behavioral_saved_questions set curated_question_id = 'beh-lead-02' where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'$$,
  '42501'
);
select is_empty(
  $$delete from public.user_preparation_preferences where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' returning user_id$$,
  'another user cannot delete preparation preferences'
);
select is_empty(
  $$delete from public.dsa_progress where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' returning item_id$$,
  'another user cannot delete DSA progress'
);
select is_empty(
  $$delete from public.system_design_progress where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' returning item_id$$,
  'another user cannot delete System Design progress'
);
select is_empty(
  $$delete from public.behavioral_saved_questions where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee' returning id$$,
  'another user cannot delete saved behavioral questions'
);
select throws_ok(
  $$insert into public.user_preparation_preferences (user_id, dsa_level) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'sde1')$$,
  '42501'
);
select throws_ok(
  $$insert into public.dsa_progress (user_id, item_kind, item_id, status) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'problem', 'forged-problem', 'attempted')$$,
  '42501'
);
select throws_ok(
  $$insert into public.system_design_progress (user_id, item_kind, item_id, status) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'topic', 'forged-topic', 'in-progress')$$,
  '42501'
);
select throws_ok(
  $$insert into public.behavioral_saved_questions (user_id, curated_question_id) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'beh-forged-01')$$,
  '42501'
);
select is(
  public.replace_behavioral_story_themes(current_setting('test.preparation_story_id')::uuid, array['Intrusion']),
  false,
  'another user cannot replace the owner story themes'
);
select is(
  public.move_interview_round(current_setting('test.preparation_application_id')::uuid, current_setting('test.preparation_first_round_id')::uuid, 'down'),
  false,
  'another user cannot reorder the owner interview rounds'
);
select is(public.record_local_system_design_import(1), true, 'local import RPC resolves the caller as its owner');
select is(
  (select count(*)::integer from public.save_preparation_track_progress('behavioral', 'beh-lead-01', 'in-progress')),
  1,
  'activity function derives the second caller as owner'
);
select is(
  (select local_system_design_import_version from public.user_preparation_preferences),
  1,
  'local import RPC writes only the caller preparation row'
);
delete from public.user_preparation_preferences;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', true);

select throws_ok(
  $$update public.user_preparation_preferences set dsa_level = 'principal' where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'$$,
  '23514'
);
select throws_ok(
  $$update public.user_preparation_preferences set dsa_plan_id = '45d' where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'$$,
  '23514'
);
select throws_ok(
  $$update public.user_preparation_preferences set local_system_design_import_version = 3 where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'$$,
  '42501'
);
select throws_ok(
  $$insert into public.dsa_progress (user_id, item_kind, item_id, status) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'quiz', 'bad-kind', 'attempted')$$,
  '23514'
);
select throws_ok(
  $$insert into public.dsa_progress (user_id, item_kind, item_id, status) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'problem', 'bad-problem-status', 'completed')$$,
  '23514'
);
select throws_ok(
  $$insert into public.dsa_progress (user_id, item_kind, item_id, status) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'roadmap-task', 'bad-task-status', 'solved')$$,
  '23514'
);
select throws_ok(
  $$insert into public.dsa_progress (user_id, item_kind, item_id, status) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'problem', 'Bad Item', 'attempted')$$,
  '23514'
);
select throws_ok(
  $$insert into public.dsa_progress (user_id, item_kind, item_id, status) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'problem', repeat('a', 201), 'attempted')$$,
  '23514'
);
select throws_ok(
  $$insert into public.system_design_progress (user_id, item_kind, item_id, status) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'video', 'bad-kind', 'in-progress')$$,
  '23514'
);
select throws_ok(
  $$insert into public.system_design_progress (user_id, item_kind, item_id, status) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'topic', 'bad-status', 'skipped')$$,
  '23514'
);
select throws_ok(
  $$insert into public.system_design_progress (user_id, item_kind, item_id, status, completed_at) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'topic', 'missing-completion', 'completed', null)$$,
  '23514'
);
select throws_ok(
  $$insert into public.system_design_progress (user_id, item_kind, item_id, status, completed_at) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'topic', 'early-completion', 'in-progress', now())$$,
  '23514'
);
select throws_ok(
  $$insert into public.behavioral_saved_questions (user_id) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')$$,
  '23514'
);
select throws_ok(
  $$insert into public.behavioral_saved_questions (user_id, custom_question_id, curated_question_id) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', current_setting('test.preparation_custom_question_id')::uuid, 'beh-lead-02')$$,
  '23514'
);
select throws_ok(
  $$insert into public.behavioral_saved_questions (user_id, curated_question_id) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'invalid-key')$$,
  '23514'
);
select throws_ok(
  $$insert into public.behavioral_story_themes (user_id, story_id, theme) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', current_setting('test.preparation_story_id')::uuid, 'Unsupported theme')$$,
  '23514'
);

select throws_ok(
  $$insert into public.dsa_progress (user_id, item_kind, item_id, status) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'problem', 'two-sum', 'attempted')$$,
  '23505'
);
select throws_ok(
  $$insert into public.system_design_progress (user_id, item_kind, item_id, status, completed_at) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'topic', 'caching', 'completed', now())$$,
  '23505'
);
select throws_ok(
  $$insert into public.behavioral_saved_questions (user_id, curated_question_id) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'beh-lead-01')$$,
  '23505'
);
select throws_ok(
  $$insert into public.behavioral_saved_questions (user_id, custom_question_id) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', current_setting('test.preparation_custom_question_id')::uuid)$$,
  '23505'
);

reset role;

select throws_ok(
  $$insert into public.behavioral_saved_questions (user_id, custom_question_id) values ('ffffffff-ffff-4fff-8fff-ffffffffffff', current_setting('test.preparation_custom_question_id')::uuid)$$,
  '23503'
);
select throws_ok(
  $$insert into public.interview_rounds (application_id, user_id, round_number, round_name, round_type) values (current_setting('test.preparation_application_id')::uuid, 'ffffffff-ffff-4fff-8fff-ffffffffffff', 3, 'Wrong owner', 'Coding')$$,
  '23503'
);
select throws_ok(
  $$insert into public.behavioral_story_themes (user_id, story_id, theme) values ('ffffffff-ffff-4fff-8fff-ffffffffffff', current_setting('test.preparation_story_id')::uuid, 'Conflict')$$,
  '23503'
);
select throws_ok(
  $$insert into public.behavioral_answers (user_id, curated_question_id, story_id, title, answer_text) values ('ffffffff-ffff-4fff-8fff-ffffffffffff', 'beh-owner-check', current_setting('test.preparation_story_id')::uuid, 'Wrong owner', 'Must fail')$$,
  '23503'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', true);

delete from public.behavioral_custom_questions
where id = current_setting('test.preparation_custom_question_id')::uuid;
select is((select count(*)::integer from public.behavioral_saved_questions where custom_question_id is not null), 0, 'deleting a custom question cascades its saved-question reference');
delete from public.behavioral_saved_questions where curated_question_id = 'beh-lead-01';
select is((select count(*)::integer from public.behavioral_saved_questions), 0, 'owner can delete a saved behavioral question');
delete from public.user_preparation_preferences;
select is((select count(*)::integer from public.user_preparation_preferences), 0, 'owner can delete preparation preferences');
delete from public.dsa_progress;
select is((select count(*)::integer from public.dsa_progress), 0, 'owner can delete DSA progress');
delete from public.system_design_progress;
select is((select count(*)::integer from public.system_design_progress), 0, 'owner can delete System Design progress');

insert into public.user_preparation_preferences (user_id, dsa_level)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'sde2');
insert into public.dsa_progress (user_id, item_kind, item_id, status)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'problem', 'two-sum', 'solved');
insert into public.system_design_progress (user_id, item_kind, item_id, status)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'topic', 'caching', 'in-progress');
insert into public.behavioral_saved_questions (user_id, curated_question_id)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'beh-lead-01');

reset role;
delete from auth.users where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

select is((select count(*)::integer from public.user_preparation_preferences where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'), 0, 'deleting an auth user cascades preparation preferences');
select is((select count(*)::integer from public.dsa_progress where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'), 0, 'deleting an auth user cascades DSA progress');
select is((select count(*)::integer from public.system_design_progress where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'), 0, 'deleting an auth user cascades System Design progress');
select is((select count(*)::integer from public.behavioral_saved_questions where user_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'), 0, 'deleting an auth user cascades saved behavioral questions');

select * from finish();
rollback;
