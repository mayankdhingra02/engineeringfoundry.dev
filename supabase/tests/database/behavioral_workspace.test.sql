begin;

create extension if not exists pgtap with schema extensions;
select plan(156);

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
select ok(has_function_privilege('authenticated', 'public.save_behavioral_custom_question_if_revision(uuid,boolean,timestamptz,text,text,text,text,text)', 'execute'), 'authenticated can save a revision-checked custom question');
select ok(has_function_privilege('authenticated', 'public.delete_behavioral_custom_question_if_revision(uuid,timestamptz)', 'execute'), 'authenticated can delete a custom question with its exact revision');
select ok(not has_function_privilege('anon', 'public.save_behavioral_custom_question_if_revision(uuid,boolean,timestamptz,text,text,text,text,text)', 'execute'), 'anon cannot save custom questions');
select ok(not has_function_privilege('anon', 'public.delete_behavioral_custom_question_if_revision(uuid,timestamptz)', 'execute'), 'anon cannot delete custom questions');
select ok(not has_column_privilege('authenticated', 'public.behavioral_custom_questions', 'question_text', 'insert'), 'clients cannot bypass custom-question creation with a direct insert');
select ok(not has_column_privilege('authenticated', 'public.behavioral_custom_questions', 'notes', 'update'), 'clients cannot bypass custom-question revision checks with a direct update');
select ok(not has_table_privilege('authenticated', 'public.behavioral_custom_questions', 'delete'), 'clients cannot bypass custom-question revision checks with a direct delete');
select ok(has_table_privilege('authenticated', 'public.behavioral_stories', 'select'), 'authenticated can read owned stories through RLS');
select ok(has_table_privilege('authenticated', 'public.behavioral_story_themes', 'select'), 'authenticated can read owned themes through RLS');
select ok(has_table_privilege('authenticated', 'public.behavioral_story_question_links', 'select'), 'authenticated can read owned story links through RLS');
select ok(has_table_privilege('authenticated', 'public.behavioral_answers', 'select'), 'authenticated can read owned answers through RLS');
select ok(has_function_privilege('authenticated', 'public.set_behavioral_primary_answer(uuid, boolean)', 'execute'), 'authenticated old clients receive the stable no-mutation primary-answer failure');
select ok(has_function_privilege('authenticated', 'public.create_behavioral_answer_aggregate(uuid,text,uuid,text,uuid,text,text,text,text,text,text,text,boolean)', 'execute'), 'authenticated can create an atomic answer aggregate');
select ok(has_function_privilege('authenticated', 'public.update_behavioral_answer_aggregate_if_revision(uuid,timestamptz,uuid,text,uuid,text,uuid,text,text,text,text,text,text,text,boolean)', 'execute'), 'authenticated can update an answer aggregate with a revision');
select ok(not has_function_privilege('anon', 'public.create_behavioral_answer_aggregate(uuid,text,uuid,text,uuid,text,text,text,text,text,text,text,boolean)', 'execute'), 'anon cannot create answer aggregates');
select ok(not has_function_privilege('anon', 'public.update_behavioral_answer_aggregate_if_revision(uuid,timestamptz,uuid,text,uuid,text,uuid,text,text,text,text,text,text,text,boolean)', 'execute'), 'anon cannot update answer aggregates');
select ok(has_function_privilege('authenticated', 'public.create_behavioral_story_with_themes(text,text,text,text,text,text,text,text,text,text,text,text,text[])', 'execute'), 'authenticated can create an atomic story aggregate');
select ok(has_function_privilege('authenticated', 'public.update_behavioral_story_with_themes_if_revision(uuid,timestamptz,text,text,text,text,text,text,text,text,text,text,text,text,text[])', 'execute'), 'authenticated can update an atomic story aggregate with a revision');
select ok(has_function_privilege('authenticated', 'public.duplicate_behavioral_story_with_themes(uuid)', 'execute'), 'authenticated can duplicate an owned story aggregate');
select ok(not has_function_privilege('anon', 'public.create_behavioral_story_with_themes(text,text,text,text,text,text,text,text,text,text,text,text,text[])', 'execute'), 'anon cannot create story aggregates');
select ok(not has_function_privilege('anon', 'public.update_behavioral_story_with_themes_if_revision(uuid,timestamptz,text,text,text,text,text,text,text,text,text,text,text,text,text[])', 'execute'), 'anon cannot update story aggregates');
select ok(not has_function_privilege('anon', 'public.duplicate_behavioral_story_with_themes(uuid)', 'execute'), 'anon cannot duplicate story aggregates');
select ok(has_function_privilege('authenticated', 'public.delete_behavioral_story_if_revision(uuid,timestamptz)', 'execute'), 'authenticated can delete an exact Behavioral story revision');
select ok(not has_function_privilege('anon', 'public.delete_behavioral_story_if_revision(uuid,timestamptz)', 'execute'), 'anon cannot delete Behavioral stories');
select ok(not has_column_privilege('authenticated', 'public.behavioral_stories', 'title', 'insert'), 'clients cannot bypass aggregate creation with a direct story insert');
select ok(not has_column_privilege('authenticated', 'public.behavioral_stories', 'title', 'update'), 'clients cannot bypass aggregate revision checks with a direct story update');
select ok(not has_table_privilege('authenticated', 'public.behavioral_stories', 'delete'), 'clients cannot bypass story revision checks with a direct delete');
select ok(not has_column_privilege('authenticated', 'public.behavioral_story_themes', 'theme', 'insert'), 'clients cannot insert themes outside an aggregate mutation');
select ok(not has_table_privilege('authenticated', 'public.behavioral_story_themes', 'delete'), 'clients cannot delete themes outside an aggregate mutation');
select ok(not has_column_privilege('authenticated', 'public.behavioral_answers', 'is_primary', 'update'), 'clients cannot directly update primary-answer state');
select ok(not has_column_privilege('authenticated', 'public.behavioral_answers', 'opening_framing', 'insert'), 'clients cannot bypass aggregate answer creation');
select ok(not has_column_privilege('authenticated', 'public.behavioral_answers', 'answer_text', 'update'), 'clients cannot bypass aggregate answer revision checks');
select ok(has_table_privilege('authenticated', 'public.behavioral_answers', 'select'), 'clients retain owner-scoped answer reads');
select ok(not has_table_privilege('authenticated', 'public.behavioral_answers', 'delete'), 'clients cannot bypass answer revision checks with a direct delete');
select ok(has_function_privilege('authenticated', 'public.delete_behavioral_answer_if_revision(uuid,timestamptz,uuid,text)', 'execute'), 'authenticated can delete an exact Behavioral answer revision');
select ok(not has_function_privilege('anon', 'public.delete_behavioral_answer_if_revision(uuid,timestamptz,uuid,text)', 'execute'), 'anon cannot delete Behavioral answers');
select ok(not has_column_privilege('authenticated', 'public.behavioral_stories', 'status', 'insert'), 'clients cannot assign story readiness on insert');
select ok(not has_column_privilege('authenticated', 'public.behavioral_stories', 'status', 'update'), 'clients cannot assign story readiness on update');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'authenticated', 'authenticated', 'behavioral-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'authenticated', 'authenticated', 'behavioral-b@example.test', '', now(), '{}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true);

select set_config(
  'test.behavioral_custom_question_id',
  'c1111111-1111-4111-8111-111111111111',
  true
);
select public.save_behavioral_custom_question_if_revision(
  current_setting('test.behavioral_custom_question_id')::uuid,
  true,
  null,
  'Tell me about a private example question?',
  'Private original context.',
  'Leadership',
  null,
  'Private original notes.'
);
select set_config(
  'test.behavioral_custom_question_revision',
  (select updated_at::text from public.behavioral_custom_questions where id = current_setting('test.behavioral_custom_question_id')::uuid),
  true
);
select set_config(
  'test.behavioral_story_id',
  (
    select story_id::text
    from public.create_behavioral_story_with_themes(
      'Recovered a delayed launch',
      null,
      null,
      null,
      null,
      repeat('Launch context ', 4),
      repeat('I owned the task ', 2),
      repeat('I reset scope, aligned owners, communicated risk, and protected the rollback path. ', 2),
      repeat('The team shipped safely with evidence and no customer impact. ', 2),
      null,
      null,
      null,
      array[' Leadership ', 'Leadership']
    )
  ),
  true
);
select set_config(
  'test.behavioral_story_revision',
  (select updated_at::text from public.behavioral_stories where id = current_setting('test.behavioral_story_id')::uuid),
  true
);
insert into public.behavioral_story_question_links (user_id, story_id, curated_question_id)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_story_id')::uuid, 'beh-lead-01');
insert into public.behavioral_story_question_links (user_id, story_id, custom_question_id)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_story_id')::uuid, current_setting('test.behavioral_custom_question_id')::uuid);
select set_config(
  'test.behavioral_answer_id',
  (
    select answer_id::text
    from public.create_behavioral_answer_aggregate(
      null,
      'beh-lead-01',
      current_setting('test.behavioral_story_id')::uuid,
      null,
      null,
      'General version',
      'First answer version',
      null,
      null,
      null,
      null,
      'Draft',
      false
    )
  ),
  true
);
select public.create_behavioral_answer_aggregate(
  null,
  'beh-lead-01',
  current_setting('test.behavioral_story_id')::uuid,
  null,
  null,
  'Concise version',
  'Second answer version',
  null,
  null,
  null,
  null,
  'Ready',
  false
);
select public.create_behavioral_answer_aggregate(
  current_setting('test.behavioral_custom_question_id')::uuid,
  null,
  current_setting('test.behavioral_story_id')::uuid,
  null,
  null,
  'Custom response',
  'Private response',
  null,
  null,
  null,
  null,
  'Draft',
  false
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
select is(
  (
    select count(*)::integer
    from public.save_behavioral_custom_question_if_revision(
      current_setting('test.behavioral_custom_question_id')::uuid,
      false,
      current_setting('test.behavioral_custom_question_revision')::timestamptz,
      'Tell me about an updated private example question?',
      'Updated private context.',
      'Leadership',
      'engineering-foundry',
      'Owner-edited private note.'
    )
  ),
  1,
  'an exact custom-question revision saves the complete private snapshot'
);
select ok(
  (select updated_at > current_setting('test.behavioral_custom_question_revision')::timestamptz from public.behavioral_custom_questions where id = current_setting('test.behavioral_custom_question_id')::uuid),
  'an exact custom-question revision advances monotonically'
);
select set_config(
  'test.behavioral_custom_question_current_revision',
  (select updated_at::text from public.behavioral_custom_questions where id = current_setting('test.behavioral_custom_question_id')::uuid),
  true
);
select is(
  (
    select count(*)::integer
    from public.save_behavioral_custom_question_if_revision(
      current_setting('test.behavioral_custom_question_id')::uuid,
      false,
      current_setting('test.behavioral_custom_question_revision')::timestamptz,
      'Stale custom question overwrite',
      null,
      'Other',
      null,
      'Stale private notes'
    )
  ),
  0,
  'a stale custom-question revision returns no row'
);
select is((select notes from public.behavioral_custom_questions where id = current_setting('test.behavioral_custom_question_id')::uuid), 'Owner-edited private note.', 'a stale custom-question revision preserves private notes');
select is(
  (
    select count(*)::integer
    from public.save_behavioral_custom_question_if_revision(
      current_setting('test.behavioral_custom_question_id')::uuid,
      true,
      null,
      'Absent replay overwrite',
      null,
      'Other',
      null,
      null
    )
  ),
  0,
  'an absent replay cannot overwrite an existing custom question'
);
select is(
  (
    select count(*)::integer
    from public.delete_behavioral_custom_question_if_revision(
      current_setting('test.behavioral_custom_question_id')::uuid,
      current_setting('test.behavioral_custom_question_revision')::timestamptz
    )
  ),
  0,
  'a stale custom-question delete returns no row'
);
select is((select count(*)::integer from public.behavioral_custom_questions where id = current_setting('test.behavioral_custom_question_id')::uuid), 1, 'a stale custom-question delete preserves the question');
select throws_ok($$insert into public.behavioral_custom_questions (user_id, question_text) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Direct custom-question insert')$$, '42501');
select throws_ok($$update public.behavioral_custom_questions set notes = 'Direct custom-question update' where id = current_setting('test.behavioral_custom_question_id')::uuid$$, '42501');
select throws_ok($$delete from public.behavioral_custom_questions where id = current_setting('test.behavioral_custom_question_id')::uuid$$, '42501');
select is(
  (
    select count(*)::integer
    from public.update_behavioral_story_with_themes_if_revision(
      current_setting('test.behavioral_story_id')::uuid,
      current_setting('test.behavioral_story_revision')::timestamptz,
      'Recovered a delayed launch',
      null,
      null,
      null,
      null,
      repeat('Launch context ', 4),
      repeat('I owned the task ', 2),
      'Brief action.',
      repeat('The team shipped safely with evidence and no customer impact. ', 2),
      null,
      null,
      null,
      array['Ownership', 'Leadership']
    )
  ),
  1,
  'the exact aggregate revision updates the parent and themes'
);
select is((select status from public.behavioral_stories where id = current_setting('test.behavioral_story_id')::uuid), 'Needs Work', 'database derives story readiness after STAR content changes');
select ok((select updated_at > current_setting('test.behavioral_story_revision')::timestamptz from public.behavioral_stories where id = current_setting('test.behavioral_story_id')::uuid), 'an aggregate update advances the revision monotonically');
select set_config(
  'test.behavioral_story_current_revision',
  (select updated_at::text from public.behavioral_stories where id = current_setting('test.behavioral_story_id')::uuid),
  true
);
select is(
  (select array_agg(theme order by theme) from public.behavioral_story_themes where story_id = current_setting('test.behavioral_story_id')::uuid),
  array['Leadership', 'Ownership']::text[],
  'an aggregate update replaces themes coherently'
);
select is(
  (
    select count(*)::integer
    from public.update_behavioral_story_with_themes_if_revision(
      current_setting('test.behavioral_story_id')::uuid,
      current_setting('test.behavioral_story_revision')::timestamptz,
      'Stale parent overwrite', null, null, null, null, null, null, null, null, null, null, 'Stale notes', array['Conflict']
    )
  ),
  0,
  'a stale aggregate revision returns no row'
);
select is((select title from public.behavioral_stories where id = current_setting('test.behavioral_story_id')::uuid), 'Recovered a delayed launch', 'a stale aggregate update preserves the parent row');
select is((select array_agg(theme order by theme) from public.behavioral_story_themes where story_id = current_setting('test.behavioral_story_id')::uuid), array['Leadership', 'Ownership']::text[], 'a stale aggregate update preserves the theme set');
select is(
  (
    select count(*)::integer
    from public.delete_behavioral_story_if_revision(
      current_setting('test.behavioral_story_id')::uuid,
      current_setting('test.behavioral_story_revision')::timestamptz
    )
  ),
  0,
  'a stale story delete returns no row'
);
select is((select count(*)::integer from public.behavioral_stories where id = current_setting('test.behavioral_story_id')::uuid), 1, 'a stale story delete preserves the parent');
select is((select array_agg(theme order by theme) from public.behavioral_story_themes where story_id = current_setting('test.behavioral_story_id')::uuid), array['Leadership', 'Ownership']::text[], 'a stale story delete preserves the theme snapshot');
select is((select count(*)::integer from public.behavioral_story_question_links where story_id = current_setting('test.behavioral_story_id')::uuid), 2, 'a stale story delete preserves question links');
select is((select count(*)::integer from public.behavioral_answers where story_id = current_setting('test.behavioral_story_id')::uuid), 3, 'a stale story delete preserves linked answer provenance');
select throws_ok($$update public.behavioral_stories set status = 'Ready' where id = current_setting('test.behavioral_story_id')::uuid$$, '42501');
select set_config(
  'test.behavioral_answer_revision',
  (select updated_at::text from public.behavioral_answers where id = current_setting('test.behavioral_answer_id')::uuid),
  true
);
select is(
  (
    select count(*)::integer
    from public.update_behavioral_answer_aggregate_if_revision(
      current_setting('test.behavioral_answer_id')::uuid,
      current_setting('test.behavioral_answer_revision')::timestamptz,
      null,
      'beh-lead-01',
      current_setting('test.behavioral_story_id')::uuid,
      null,
      null,
      'General version',
      'First answer version',
      null,
      null,
      null,
      null,
      'Draft',
      true
    )
  ),
  1,
  'an exact answer revision saves content and desired primary state atomically'
);
select is((select is_primary from public.behavioral_answers where id = current_setting('test.behavioral_answer_id')::uuid), true, 'aggregate primary designation is persisted');
select ok((select updated_at > current_setting('test.behavioral_answer_revision')::timestamptz from public.behavioral_answers where id = current_setting('test.behavioral_answer_id')::uuid), 'an aggregate answer update advances its revision monotonically');
select set_config(
  'test.behavioral_answer_current_revision',
  (select updated_at::text from public.behavioral_answers where id = current_setting('test.behavioral_answer_id')::uuid),
  true
);
select is(
  (
    select count(*)::integer
    from public.update_behavioral_answer_aggregate_if_revision(
      current_setting('test.behavioral_answer_id')::uuid,
      current_setting('test.behavioral_answer_revision')::timestamptz,
      null,
      'beh-lead-01',
      current_setting('test.behavioral_story_id')::uuid,
      null,
      null,
      'Stale answer overwrite',
      'Stale answer body',
      null,
      null,
      null,
      'Stale notes',
      'Ready',
      false
    )
  ),
  0,
  'a stale answer revision returns no row'
);
select is((select title from public.behavioral_answers where id = current_setting('test.behavioral_answer_id')::uuid), 'General version', 'a stale aggregate update preserves the answer snapshot');
select is((select is_primary from public.behavioral_answers where id = current_setting('test.behavioral_answer_id')::uuid), true, 'a stale aggregate update preserves primary state');
select is(
  (
    select count(*)::integer
    from public.delete_behavioral_answer_if_revision(
      current_setting('test.behavioral_answer_id')::uuid,
      current_setting('test.behavioral_answer_revision')::timestamptz,
      null,
      'beh-lead-01'
    )
  ),
  0,
  'a stale answer delete returns no row'
);
select is((select title from public.behavioral_answers where id = current_setting('test.behavioral_answer_id')::uuid), 'General version', 'a stale answer delete preserves the answer snapshot');
select is((select is_primary from public.behavioral_answers where id = current_setting('test.behavioral_answer_id')::uuid), true, 'a stale answer delete preserves primary state');
select throws_ok($$select public.set_behavioral_primary_answer(current_setting('test.behavioral_answer_id')::uuid, true)$$, '0A000');
select set_config(
  'test.behavioral_story_two_id',
  (
    select story_id::text
    from public.create_behavioral_story_with_themes(
      'Alternative leadership story', null, null, null, null,
      'A second team needed direction during a risky launch.',
      'I owned the decision path.',
      'I gathered the constraints, proposed a reversible plan, and aligned the affected owners before the launch window.',
      'The team made the decision on time and kept a safe rollback path.',
      null, null, null, array[]::text[]
    )
  ),
  true
);
insert into public.behavioral_story_question_links (user_id, story_id, curated_question_id)
values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_story_two_id')::uuid, 'beh-lead-01');
select is((select count(*)::integer from public.behavioral_story_question_links where curated_question_id = 'beh-lead-01'), 2, 'one question can map to multiple stories');
select throws_ok($$insert into public.behavioral_story_question_links (user_id, story_id, curated_question_id) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_story_two_id')::uuid, 'beh-lead-01')$$, '23505');
select set_config(
  'test.behavioral_answer_two_id',
  (
    select answer_id::text
    from public.create_behavioral_answer_aggregate(
      null,
      'beh-lead-01',
      current_setting('test.behavioral_story_two_id')::uuid,
      'wrong-company',
      current_setting('test.behavioral_application_id')::uuid,
      'Company preparation',
      '',
      'Frame the decision gap.',
      'Emphasize the reversible plan.',
      'Avoid confidential launch details.',
      'Private question-specific note.',
      'Draft',
      true
    )
  ),
  true
);
select set_config(
  'test.behavioral_answer_two_revision',
  (select updated_at::text from public.behavioral_answers where id = current_setting('test.behavioral_answer_two_id')::uuid),
  true
);
select is((select answer_text from public.behavioral_answers where id = current_setting('test.behavioral_answer_two_id')::uuid), '', 'question preparation can omit a full rehearsal draft');
select is((select is_primary from public.behavioral_answers where id = current_setting('test.behavioral_answer_id')::uuid), false, 'replacing a primary clears the previous answer atomically');
select is((select is_primary from public.behavioral_answers where id = current_setting('test.behavioral_answer_two_id')::uuid), true, 'the replacement primary is persisted');
select is((select notes from public.behavioral_answers where id = current_setting('test.behavioral_answer_two_id')::uuid), 'Private question-specific note.', 'question-specific notes are stored separately from the reusable story');
select is((select company_slug from public.behavioral_answers where id = current_setting('test.behavioral_answer_two_id')::uuid), 'behavioral-test-company', 'application preparation derives company context from the owned application');
select set_config(
  'test.behavioral_story_three_id',
  (
    select story_id::text
    from public.create_behavioral_story_with_themes(
      'Automatically linked evidence', null, null, null, null, null, null, null, null, null, null, null, array[]::text[]
    )
  ),
  true
);
select public.create_behavioral_answer_aggregate(
  null,
  'beh-tech-01',
  current_setting('test.behavioral_story_three_id')::uuid,
  null,
  null,
  'Preparation creates its canonical mapping',
  '',
  null,
  null,
  null,
  null,
  'Draft',
  false
);
select is((select count(*)::integer from public.behavioral_story_question_links where curated_question_id = 'beh-tech-01'), 1, 'saving preparation with a story creates the canonical story-question mapping');
select set_config(
  'test.behavioral_duplicate_id',
  (select story_id::text from public.duplicate_behavioral_story_with_themes(current_setting('test.behavioral_story_id')::uuid)),
  true
);
select is((select title from public.behavioral_stories where id = current_setting('test.behavioral_duplicate_id')::uuid), 'Recovered a delayed launch (copy)', 'duplicate creates a bounded copy title');
select is((select notes from public.behavioral_stories where id = current_setting('test.behavioral_duplicate_id')::uuid), null, 'duplicate copies the parent snapshot');
select is((select array_agg(theme order by theme) from public.behavioral_story_themes where story_id = current_setting('test.behavioral_duplicate_id')::uuid), array['Leadership', 'Ownership']::text[], 'duplicate copies the coherent theme snapshot');
select throws_ok(
  $$select * from public.create_behavioral_story_with_themes('Invalid theme story', null, null, null, null, null, null, null, null, null, null, null, array['Not supported'])$$,
  '23514'
);
select throws_ok(
  $$select * from public.create_behavioral_story_with_themes('Unbounded theme story', null, null, null, null, null, null, null, null, null, null, null, array_fill('Leadership'::text, array[21]))$$,
  '23514'
);
select is((select count(*)::integer from public.behavioral_stories where title = 'Invalid theme story'), 0, 'invalid themes roll back aggregate creation');
select throws_ok($$select public.replace_behavioral_story_themes(current_setting('test.behavioral_story_id')::uuid, array['Conflict'])$$, '0A000');
select throws_ok($$insert into public.behavioral_stories (user_id, title) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Direct aggregate bypass')$$, '42501');
select throws_ok($$delete from public.behavioral_story_themes where story_id = current_setting('test.behavioral_story_id')::uuid$$, '42501');
select throws_ok(
  $$select * from public.create_behavioral_answer_aggregate(null,null,current_setting('test.behavioral_story_id')::uuid,null,null,'Invalid question','',null,null,null,null,'Draft',false)$$,
  '23514'
);
select throws_ok(
  $$select * from public.create_behavioral_answer_aggregate(null,'beh-missing-999',current_setting('test.behavioral_story_id')::uuid,null,null,'Unknown question','',null,null,null,null,'Draft',false)$$,
  '23503'
);
select throws_ok(
  $$select * from public.create_behavioral_answer_aggregate(null,'beh-lead-01',null,null,null,'Missing story','',null,null,null,null,'Draft',false)$$,
  '23503'
);
select throws_ok(
  $$select * from public.create_behavioral_answer_aggregate(null,'beh-lead-01',current_setting('test.behavioral_story_id')::uuid,null,null,'Invalid status','',null,null,null,null,'Unknown',false)$$,
  '23514'
);
select throws_ok(
  $$select * from public.create_behavioral_answer_aggregate(null,'beh-lead-01',current_setting('test.behavioral_story_id')::uuid,null,null,'Missing primary state','',null,null,null,null,'Draft',null)$$,
  '23514'
);
select throws_ok(
  $$select * from public.create_behavioral_answer_aggregate(null,'beh-lead-01',current_setting('test.behavioral_story_id')::uuid,null,null,repeat('x',201),'',null,null,null,null,'Draft',false)$$,
  '23514'
);
select is((select id from public.behavioral_answers where is_primary and curated_question_id = 'beh-lead-01'), current_setting('test.behavioral_answer_two_id')::uuid, 'a rejected aggregate save leaves the prior primary unchanged');
select throws_ok(
  $$insert into public.behavioral_answers (user_id,curated_question_id,story_id,title) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','beh-lead-01',current_setting('test.behavioral_story_id')::uuid,'Direct answer bypass')$$,
  '42501'
);
select throws_ok(
  $$update public.behavioral_answers set notes = 'Direct stale overwrite' where id = current_setting('test.behavioral_answer_two_id')::uuid$$,
  '42501'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', true);
select is((select count(*)::integer from public.behavioral_custom_questions), 0, 'another user cannot read custom questions');
select is((select count(*)::integer from public.behavioral_stories), 0, 'another user cannot read stories');
select is((select count(*)::integer from public.behavioral_story_themes), 0, 'another user cannot read themes');
select is((select count(*)::integer from public.behavioral_story_question_links), 0, 'another user cannot read story links');
select is((select count(*)::integer from public.behavioral_answers), 0, 'another user cannot read answers');
select set_config(
  'test.behavioral_user_b_story_id',
  (
    select story_id::text
    from public.create_behavioral_story_with_themes(
      'User B answer relationship', null, null, null, null,
      'User B private situation for answer aggregate privacy.',
      'User B private task.',
      'User B private action that keeps answer relationships owner scoped.',
      'User B private result.',
      null, null, null, array[]::text[]
    )
  ),
  true
);
select is(
  (
    select count(*)::integer
    from public.save_behavioral_custom_question_if_revision(
      current_setting('test.behavioral_custom_question_id')::uuid,
      false,
      current_setting('test.behavioral_custom_question_current_revision')::timestamptz,
      'Foreign custom question update', null, 'Other', null, 'Intrusion'
    )
  ),
  0,
  'another user receives no custom-question save row'
);
select is(
  (
    select count(*)::integer
    from public.save_behavioral_custom_question_if_revision(
      'c9999999-9999-4999-8999-999999999999'::uuid,
      false,
      pg_catalog.clock_timestamp(),
      'Missing custom question update', null, 'Other', null, null
    )
  ),
  0,
  'a missing custom-question save returns the same zero-row result'
);
select is((select count(*)::integer from public.delete_behavioral_custom_question_if_revision(current_setting('test.behavioral_custom_question_id')::uuid, pg_catalog.clock_timestamp())), 0, 'another user receives no custom-question delete row');
select is((select count(*)::integer from public.delete_behavioral_custom_question_if_revision('c9999999-9999-4999-8999-999999999999'::uuid, pg_catalog.clock_timestamp())), 0, 'a missing custom-question delete returns the same zero-row result');
select throws_ok($$insert into public.behavioral_story_themes (user_id, story_id, theme) values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', current_setting('test.behavioral_story_id')::uuid, 'Ownership')$$, '42501');
select throws_ok($$insert into public.behavioral_story_question_links (user_id, story_id, curated_question_id) values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', current_setting('test.behavioral_story_id')::uuid, 'beh-lead-02')$$, '42501');
select throws_ok($$insert into public.behavioral_answers (user_id, custom_question_id, title, answer_text) values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', current_setting('test.behavioral_custom_question_id')::uuid, 'Intrusion', 'No access')$$, '42501');
select throws_ok($$update public.behavioral_stories set title = 'Intrusion' where id = current_setting('test.behavioral_story_id')::uuid$$, '42501');
select throws_ok($$delete from public.behavioral_stories where id = current_setting('test.behavioral_story_id')::uuid$$, '42501');
select throws_ok($$delete from public.behavioral_answers where id = current_setting('test.behavioral_answer_id')::uuid$$, '42501');
select is((select count(*)::integer from public.delete_behavioral_story_if_revision(current_setting('test.behavioral_story_id')::uuid, current_setting('test.behavioral_story_current_revision')::timestamptz)), 0, 'another user receives no story delete row');
select is((select count(*)::integer from public.delete_behavioral_story_if_revision('99999999-9999-4999-8999-999999999999'::uuid, pg_catalog.clock_timestamp())), 0, 'a missing story delete returns the same zero-row result');
select throws_ok($$update public.behavioral_custom_questions set notes = 'Intrusion' where id = current_setting('test.behavioral_custom_question_id')::uuid$$, '42501');
select throws_ok($$select public.set_behavioral_primary_answer(current_setting('test.behavioral_answer_two_id')::uuid, true)$$, '0A000');
select throws_ok($$insert into public.behavioral_answers (user_id, curated_question_id, application_id, title, answer_text) values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'beh-lead-02', current_setting('test.behavioral_application_id')::uuid, 'Foreign application', '')$$, '42501');
select is(
  (
    select count(*)::integer
    from public.update_behavioral_answer_aggregate_if_revision(
      current_setting('test.behavioral_answer_two_id')::uuid,
      current_setting('test.behavioral_answer_two_revision')::timestamptz,
      null,
      'beh-lead-01',
      current_setting('test.behavioral_user_b_story_id')::uuid,
      null,
      null,
      'Foreign update',
      '',
      null,
      null,
      null,
      null,
      'Draft',
      false
    )
  ),
  0,
  'another user receives no answer aggregate update row'
);
select is(
  (
    select count(*)::integer
    from public.update_behavioral_answer_aggregate_if_revision(
      '99999999-9999-4999-8999-999999999999'::uuid,
      pg_catalog.clock_timestamp(),
      null,
      'beh-lead-01',
      current_setting('test.behavioral_user_b_story_id')::uuid,
      null,
      null,
      'Missing update',
      '',
      null,
      null,
      null,
      null,
      'Draft',
      false
    )
  ),
  0,
  'a missing answer aggregate update returns the same zero-row result'
);
select is((select count(*)::integer from public.delete_behavioral_answer_if_revision(current_setting('test.behavioral_answer_id')::uuid, current_setting('test.behavioral_answer_current_revision')::timestamptz, null, 'beh-lead-01')), 0, 'another user receives no answer delete row');
select is((select count(*)::integer from public.delete_behavioral_answer_if_revision('99999999-9999-4999-8999-999999999999'::uuid, pg_catalog.clock_timestamp(), null, 'beh-lead-01')), 0, 'a missing answer delete returns the same zero-row result');
select is((select count(*)::integer from public.duplicate_behavioral_story_with_themes(current_setting('test.behavioral_story_id')::uuid)), 0, 'another user cannot distinguish or duplicate an owned story');
select is((select count(*)::integer from public.duplicate_behavioral_story_with_themes('99999999-9999-4999-8999-999999999999'::uuid)), 0, 'a missing story duplicate returns the same zero-row result');
select is(
  (
    select count(*)::integer
    from public.update_behavioral_story_with_themes_if_revision(
      current_setting('test.behavioral_story_id')::uuid,
      current_setting('test.behavioral_story_revision')::timestamptz,
      'Foreign update', null, null, null, null, null, null, null, null, null, null, null, array[]::text[]
    )
  ),
  0,
  'another user receives no aggregate update row'
);
select is(
  (
    select count(*)::integer
    from public.update_behavioral_story_with_themes_if_revision(
      '99999999-9999-4999-8999-999999999999'::uuid,
      current_setting('test.behavioral_story_revision')::timestamptz,
      'Missing update', null, null, null, null, null, null, null, null, null, null, null, array[]::text[]
    )
  ),
  0,
  'a missing story update returns the same zero-row result'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true);
select throws_ok($$insert into public.behavioral_story_question_links (user_id, story_id) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_story_id')::uuid)$$, '23514');
select throws_ok($$insert into public.behavioral_stories (user_id, title, status) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Spoofed readiness', 'Ready')$$, '42501');
select throws_ok($$insert into public.behavioral_story_question_links (user_id, story_id, curated_question_id) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', current_setting('test.behavioral_story_id')::uuid, 'beh-missing-999')$$, '23503');
select throws_ok($$insert into public.behavioral_answers (user_id, curated_question_id, title) values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'beh-missing-999', 'Direct missing-reference bypass')$$, '42501');
select public.delete_behavioral_story_if_revision(id, updated_at) from public.behavioral_stories where id = current_setting('test.behavioral_story_three_id')::uuid;
select public.delete_behavioral_story_if_revision(id, updated_at) from public.behavioral_stories where id = current_setting('test.behavioral_duplicate_id')::uuid;
select public.delete_behavioral_story_if_revision(id, updated_at) from public.behavioral_stories where id = current_setting('test.behavioral_story_two_id')::uuid;
select set_config(
  'test.behavioral_custom_question_current_revision',
  (select updated_at::text from public.behavioral_custom_questions where id = current_setting('test.behavioral_custom_question_id')::uuid),
  true
);
select is(
  (select count(*)::integer from public.delete_behavioral_custom_question_if_revision(current_setting('test.behavioral_custom_question_id')::uuid, current_setting('test.behavioral_custom_question_current_revision')::timestamptz)),
  1,
  'an exact custom-question delete removes one owned row'
);
select is((select count(*)::integer from public.behavioral_story_question_links where custom_question_id is not null), 0, 'an exact custom-question delete cascades its private children');
select is((select count(*)::integer from public.behavioral_answers where custom_question_id is not null), 0, 'deleting a custom question cascades its answers');
select is(
  (
    select count(*)::integer
    from public.delete_behavioral_answer_if_revision(
      current_setting('test.behavioral_answer_two_id')::uuid,
      (select updated_at from public.behavioral_answers where id = current_setting('test.behavioral_answer_two_id')::uuid),
      'c9999999-9999-4999-8999-999999999999'::uuid,
      null
    )
  ),
  0,
  'a mismatched question identity cannot delete an answer'
);
select is(
  (
    select count(*)::integer
    from public.delete_behavioral_answer_if_revision(
      current_setting('test.behavioral_answer_two_id')::uuid,
      (select updated_at from public.behavioral_answers where id = current_setting('test.behavioral_answer_two_id')::uuid),
      null,
      'beh-lead-01'
    )
  ),
  1,
  'an exact answer revision deletes one owned answer'
);
select is((select count(*)::integer from public.behavioral_answers where id = current_setting('test.behavioral_answer_two_id')::uuid), 0, 'an exact answer delete removes its target');
select is(
  (
    select count(*)::integer
    from public.delete_behavioral_story_if_revision(
      current_setting('test.behavioral_story_id')::uuid,
      (select updated_at from public.behavioral_stories where id = current_setting('test.behavioral_story_id')::uuid)
    )
  ),
  1,
  'an exact story revision deletes one owned aggregate'
);
select is((select count(*)::integer from public.behavioral_story_themes), 0, 'deleting a story cascades its themes');
select is((select count(*)::integer from public.behavioral_story_question_links), 0, 'deleting a story cascades remaining question links');
select is((select story_id from public.behavioral_answers where title = 'General version'), null, 'deleting a story preserves answer text and clears its story link');
select is((select count(*)::integer from public.behavioral_answers where curated_question_id = 'beh-lead-01'), 2, 'remaining curated answer preparation survives story deletion');

select * from finish();
rollback;
