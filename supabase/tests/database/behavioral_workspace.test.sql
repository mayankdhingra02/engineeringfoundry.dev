begin;

create extension if not exists pgtap with schema extensions;
select plan(63);

select is((select count(*)::integer from public.behavioral_curated_questions where is_active), 48, 'the global curated catalog is seeded once');
select ok(has_table_privilege('anon', 'public.behavioral_curated_questions', 'select'), 'anon can read the curated catalog');
select ok(has_table_privilege('authenticated', 'public.behavioral_curated_questions', 'select'), 'authenticated users can read the curated catalog');
select ok(not has_table_privilege('authenticated', 'public.behavioral_curated_questions', 'insert'), 'normal users cannot insert curated questions');

select ok(not has_table_privilege('anon', 'public.behavioral_custom_questions', 'select'), 'anon cannot read custom questions');
select ok(not has_table_privilege('anon', 'public.behavioral_stories', 'select'), 'anon cannot read stories');
select ok(not has_table_privilege('anon', 'public.behavioral_story_themes', 'select'), 'anon cannot read themes');
select ok(not has_table_privilege('anon', 'public.behavioral_story_question_links', 'select'), 'anon cannot read story links');
select ok(not has_table_privilege('anon', 'public.behavioral_answers', 'select'), 'anon cannot read answers');
select ok(has_table_privilege('authenticated', 'public.behavioral_custom_questions', 'select'), 'authenticated can read owned custom questions through RLS');
select ok(has_table_privilege('authenticated', 'public.behavioral_stories', 'select'), 'authenticated can read owned stories through RLS');
select ok(has_table_privilege('authenticated', 'public.behavioral_story_themes', 'select'), 'authenticated can read owned themes through RLS');
select ok(has_table_privilege('authenticated', 'public.behavioral_story_question_links', 'select'), 'authenticated can read owned story links through RLS');
select ok(has_table_privilege('authenticated', 'public.behavioral_answers', 'select'), 'authenticated can read owned answers through RLS');
select ok(has_function_privilege('authenticated', 'public.set_behavioral_primary_answer(uuid, boolean)', 'execute'), 'authenticated can call the owner-derived primary-answer function');
select ok(not has_column_privilege('authenticated', 'public.behavioral_answers', 'is_primary', 'update'), 'clients cannot directly update primary-answer state');
select ok(has_column_privilege('authenticated', 'public.behavioral_answers', 'opening_framing', 'insert'), 'clients can save question-specific opening framing');
select ok(not has_column_privilege('authenticated', 'public.behavioral_stories', 'status', 'insert'), 'clients cannot assign story readiness on insert');
select ok(not has_column_privilege('authenticated', 'public.behavioral_stories', 'status', 'update'), 'clients cannot assign story readiness on update');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'behavioral-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'authenticated', 'authenticated', 'behavioral-b@example.test', '', now(), '{}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true);

insert into public.behavioral_custom_questions (user_id, question_text, category)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Tell me about a private example question?', 'Leadership');
select set_config(
  'test.behavioral_custom_question_id',
  (select id::text from public.behavioral_custom_questions where question_text = 'Tell me about a private example question?'),
  true
);
insert into public.behavioral_stories (user_id, title, situation, task, action, result)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Recovered a delayed launch', repeat('Launch context ', 4), repeat('I owned the task ', 2), repeat('I reset scope, aligned owners, communicated risk, and protected the rollback path. ', 2), repeat('The team shipped safely with evidence and no customer impact. ', 2));
select set_config(
  'test.behavioral_story_id',
  (select id::text from public.behavioral_stories where title = 'Recovered a delayed launch'),
  true
);
insert into public.behavioral_story_themes (user_id, story_id, theme)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_story_id')::uuid, 'Leadership');
insert into public.behavioral_story_question_links (user_id, story_id, curated_question_id)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_story_id')::uuid, 'beh-lead-01');
insert into public.behavioral_story_question_links (user_id, story_id, custom_question_id)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_story_id')::uuid, current_setting('test.behavioral_custom_question_id')::uuid);
insert into public.behavioral_answers (user_id, curated_question_id, story_id, title, answer_text, status)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'beh-lead-01', current_setting('test.behavioral_story_id')::uuid, 'General version', 'First answer version', 'Draft'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'beh-lead-01', null, 'Concise version', 'Second answer version', 'Ready');
insert into public.behavioral_answers (user_id, custom_question_id, title, answer_text)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_custom_question_id')::uuid, 'Custom response', 'Private response');
select set_config(
  'test.behavioral_answer_id',
  (select id::text from public.behavioral_answers where title = 'General version'),
  true
);
insert into public.applications (user_id, company_name, company_slug, role_title)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Behavioral Test Company', 'behavioral-test-company', 'Software Engineer');
select set_config(
  'test.behavioral_application_id',
  (select id::text from public.applications where company_slug = 'behavioral-test-company'),
  true
);

select is((select count(*)::integer from public.behavioral_custom_questions), 1, 'owner can create a custom question');
select is((select count(*)::integer from public.behavioral_stories), 1, 'owner can create a story');
select is((select count(*)::integer from public.behavioral_story_themes), 1, 'owner can add a theme');
select is((select count(*)::integer from public.behavioral_story_question_links), 2, 'one story can link to curated and custom questions');
select is((select count(*)::integer from public.behavioral_answers where curated_question_id = 'beh-lead-01'), 2, 'one question supports multiple answer versions');
select is((select count(*)::integer from public.behavioral_answers where custom_question_id = current_setting('test.behavioral_custom_question_id')::uuid), 1, 'custom question can have an answer');
update public.behavioral_stories set action = 'Brief action.' where id = current_setting('test.behavioral_story_id')::uuid;
select is((select status from public.behavioral_stories where id = current_setting('test.behavioral_story_id')::uuid), 'Needs Work', 'database derives story readiness after STAR content changes');
select throws_ok($$update public.behavioral_stories set status = 'Ready' where id = current_setting('test.behavioral_story_id')::uuid$$, '42501');
select is(public.set_behavioral_primary_answer(current_setting('test.behavioral_answer_id')::uuid, true), true, 'owner can designate a primary story through the RPC');
select is((select is_primary from public.behavioral_answers where id = current_setting('test.behavioral_answer_id')::uuid), true, 'primary designation is persisted');
select is(public.set_behavioral_primary_answer((select id from public.behavioral_answers where title = 'Concise version'), true), false, 'an answer without a story cannot become primary');
insert into public.behavioral_stories (user_id, title, situation, task, action, result)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Alternative leadership story', 'A second team needed direction during a risky launch.', 'I owned the decision path.', 'I gathered the constraints, proposed a reversible plan, and aligned the affected owners before the launch window.', 'The team made the decision on time and kept a safe rollback path.');
select set_config('test.behavioral_story_two_id', (select id::text from public.behavioral_stories where title = 'Alternative leadership story'), true);
insert into public.behavioral_story_question_links (user_id, story_id, curated_question_id)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_story_two_id')::uuid, 'beh-lead-01');
select is((select count(*)::integer from public.behavioral_story_question_links where curated_question_id = 'beh-lead-01'), 2, 'one question can map to multiple stories');
select throws_ok($$insert into public.behavioral_story_question_links (user_id, story_id, curated_question_id) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_story_two_id')::uuid, 'beh-lead-01')$$, '23505');
insert into public.behavioral_answers (user_id, curated_question_id, story_id, company_slug, application_id, title, opening_framing, details_to_emphasize, details_to_avoid, notes)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'beh-lead-01', current_setting('test.behavioral_story_two_id')::uuid, 'wrong-company', current_setting('test.behavioral_application_id')::uuid, 'Company preparation', 'Frame the decision gap.', 'Emphasize the reversible plan.', 'Avoid confidential launch details.', 'Private question-specific note.');
select set_config('test.behavioral_answer_two_id', (select id::text from public.behavioral_answers where title = 'Company preparation'), true);
select is((select answer_text from public.behavioral_answers where id = current_setting('test.behavioral_answer_two_id')::uuid), '', 'question preparation can omit a full rehearsal draft');
select is(public.set_behavioral_primary_answer(current_setting('test.behavioral_answer_two_id')::uuid, true), true, 'a second linked story can replace the primary story');
select is((select is_primary from public.behavioral_answers where id = current_setting('test.behavioral_answer_id')::uuid), false, 'replacing a primary clears the previous answer atomically');
select is((select is_primary from public.behavioral_answers where id = current_setting('test.behavioral_answer_two_id')::uuid), true, 'the replacement primary is persisted');
select is((select notes from public.behavioral_answers where id = current_setting('test.behavioral_answer_two_id')::uuid), 'Private question-specific note.', 'question-specific notes are stored separately from the reusable story');
select is((select company_slug from public.behavioral_answers where id = current_setting('test.behavioral_answer_two_id')::uuid), 'behavioral-test-company', 'application preparation derives company context from the owned application');
insert into public.behavioral_stories (user_id, title)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Automatically linked evidence');
insert into public.behavioral_answers (user_id, curated_question_id, story_id, title)
select 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'beh-tech-01', id, 'Preparation creates its canonical mapping'
from public.behavioral_stories where title = 'Automatically linked evidence';
select is((select count(*)::integer from public.behavioral_story_question_links where curated_question_id = 'beh-tech-01'), 1, 'saving preparation with a story creates the canonical story-question mapping');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', true);
select is((select count(*)::integer from public.behavioral_custom_questions), 0, 'another user cannot read custom questions');
select is((select count(*)::integer from public.behavioral_stories), 0, 'another user cannot read stories');
select is((select count(*)::integer from public.behavioral_story_themes), 0, 'another user cannot read themes');
select is((select count(*)::integer from public.behavioral_story_question_links), 0, 'another user cannot read story links');
select is((select count(*)::integer from public.behavioral_answers), 0, 'another user cannot read answers');
select throws_ok($$insert into public.behavioral_custom_questions (user_id, question_text) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Attempted forged ownership')$$, '42501');
select throws_ok($$insert into public.behavioral_story_themes (user_id, story_id, theme) values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', current_setting('test.behavioral_story_id')::uuid, 'Ownership')$$, '42501');
select throws_ok($$insert into public.behavioral_story_question_links (user_id, story_id, curated_question_id) values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', current_setting('test.behavioral_story_id')::uuid, 'beh-lead-02')$$, '42501');
select throws_ok($$insert into public.behavioral_answers (user_id, custom_question_id, title, answer_text) values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', current_setting('test.behavioral_custom_question_id')::uuid, 'Intrusion', 'No access')$$, '42501');
select results_eq($$with changed as (update public.behavioral_stories set title = 'Intrusion' where id = current_setting('test.behavioral_story_id')::uuid returning id) select count(*)::integer from changed$$, array[0], 'another user cannot update an owned story');
select results_eq($$with removed as (delete from public.behavioral_stories where id = current_setting('test.behavioral_story_id')::uuid returning id) select count(*)::integer from removed$$, array[0], 'another user cannot delete an owned story');
select results_eq($$with changed as (update public.behavioral_custom_questions set notes = 'Intrusion' where id = current_setting('test.behavioral_custom_question_id')::uuid returning id) select count(*)::integer from changed$$, array[0], 'another user cannot edit an owned custom question');
select is(public.set_behavioral_primary_answer(current_setting('test.behavioral_answer_two_id')::uuid, true), false, 'another user cannot change primary preparation');
select throws_ok($$insert into public.behavioral_answers (user_id, curated_question_id, application_id, title, answer_text) values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'beh-lead-02', current_setting('test.behavioral_application_id')::uuid, 'Foreign application', '')$$, '23503');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true);
select throws_ok($$insert into public.behavioral_story_question_links (user_id, story_id) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_story_id')::uuid)$$, '23514');
select throws_ok($$insert into public.behavioral_stories (user_id, title, status) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Spoofed readiness', 'Ready')$$, '42501');
select throws_ok($$insert into public.behavioral_story_question_links (user_id, story_id, curated_question_id) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_story_id')::uuid, 'beh-missing-999')$$, '23503');
select throws_ok($$insert into public.behavioral_answers (user_id, curated_question_id, title) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'beh-missing-999', 'Missing curated reference')$$, '23503');
delete from public.behavioral_stories where title = 'Automatically linked evidence';
delete from public.behavioral_stories where id = current_setting('test.behavioral_story_two_id')::uuid;
delete from public.behavioral_custom_questions where id = current_setting('test.behavioral_custom_question_id')::uuid;
select is((select count(*)::integer from public.behavioral_story_question_links where custom_question_id is not null), 0, 'deleting a custom question cascades its story links');
select is((select count(*)::integer from public.behavioral_answers where custom_question_id is not null), 0, 'deleting a custom question cascades its answers');
delete from public.behavioral_stories where id = current_setting('test.behavioral_story_id')::uuid;
select is((select count(*)::integer from public.behavioral_story_themes), 0, 'deleting a story cascades its themes');
select is((select count(*)::integer from public.behavioral_story_question_links), 0, 'deleting a story cascades remaining question links');
select is((select story_id from public.behavioral_answers where title = 'General version'), null, 'deleting a story preserves answer text and clears its story link');
select is((select count(*)::integer from public.behavioral_answers where curated_question_id = 'beh-lead-01'), 3, 'curated answer preparation survives story deletion');

select * from finish();
rollback;
