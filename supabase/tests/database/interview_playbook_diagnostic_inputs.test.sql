begin;

create extension if not exists pgtap with schema extensions;
select plan(112);

-- --- Privilege surface -------------------------------------------------
select ok(not has_table_privilege('anon', 'public.interview_playbook_diagnostic_settings', 'select'), 'anon cannot read diagnostic settings');
select ok(not has_table_privilege('anon', 'public.interview_playbook_confidence', 'select'), 'anon cannot read confidence');
select ok(not has_table_privilege('anon', 'public.interview_playbook_priorities', 'select'), 'anon cannot read priorities');
select ok(not has_table_privilege('anon', 'public.interview_playbook_constraints', 'select'), 'anon cannot read constraints');
select ok(has_table_privilege('authenticated', 'public.interview_playbook_diagnostic_settings', 'select'), 'authenticated can read owned diagnostic settings through RLS');
select ok(has_table_privilege('authenticated', 'public.interview_playbook_confidence', 'select'), 'authenticated can read owned confidence through RLS');
select ok(has_table_privilege('authenticated', 'public.interview_playbook_priorities', 'select'), 'authenticated can read owned priorities through RLS');
select ok(has_table_privilege('authenticated', 'public.interview_playbook_constraints', 'select'), 'authenticated can read owned constraints through RLS');
select ok(not has_table_privilege('authenticated', 'public.interview_playbook_diagnostic_settings', 'insert'), 'direct authenticated INSERT is blocked on diagnostic settings');
select ok(not has_table_privilege('authenticated', 'public.interview_playbook_diagnostic_settings', 'update'), 'direct authenticated UPDATE is blocked on diagnostic settings');
select ok(not has_table_privilege('authenticated', 'public.interview_playbook_diagnostic_settings', 'delete'), 'direct authenticated DELETE is blocked on diagnostic settings');
select ok(not has_table_privilege('authenticated', 'public.interview_playbook_confidence', 'insert'), 'direct authenticated INSERT is blocked on confidence');
select ok(not has_table_privilege('authenticated', 'public.interview_playbook_confidence', 'update'), 'direct authenticated UPDATE is blocked on confidence');
select ok(not has_table_privilege('authenticated', 'public.interview_playbook_confidence', 'delete'), 'direct authenticated DELETE is blocked on confidence');
select ok(not has_table_privilege('authenticated', 'public.interview_playbook_priorities', 'insert'), 'direct authenticated INSERT is blocked on priorities');
select ok(not has_table_privilege('authenticated', 'public.interview_playbook_priorities', 'update'), 'direct authenticated UPDATE is blocked on priorities');
select ok(not has_table_privilege('authenticated', 'public.interview_playbook_priorities', 'delete'), 'direct authenticated DELETE is blocked on priorities');
select ok(not has_table_privilege('authenticated', 'public.interview_playbook_constraints', 'insert'), 'direct authenticated INSERT is blocked on constraints');
select ok(not has_table_privilege('authenticated', 'public.interview_playbook_constraints', 'update'), 'direct authenticated UPDATE is blocked on constraints');
select ok(not has_table_privilege('authenticated', 'public.interview_playbook_constraints', 'delete'), 'direct authenticated DELETE is blocked on constraints');
select ok(not has_function_privilege('anon', 'public.save_interview_playbook_diagnostic_inputs(numeric,jsonb,text[],jsonb,text,text)', 'execute'), 'anon cannot invoke the diagnostic save RPC');
select ok(has_function_privilege('authenticated', 'public.save_interview_playbook_diagnostic_inputs(numeric,jsonb,text[],jsonb,text,text)', 'execute'), 'authenticated can invoke the diagnostic save RPC');
select ok(not has_function_privilege('anon', 'public.save_interview_playbook_diagnostic_inputs_if_revision(boolean,timestamptz,numeric,jsonb,text[],jsonb,text,text)', 'execute'), 'anon cannot invoke the revision-checked diagnostic save RPC');
select ok(has_function_privilege('authenticated', 'public.save_interview_playbook_diagnostic_inputs_if_revision(boolean,timestamptz,numeric,jsonb,text[],jsonb,text,text)', 'execute'), 'authenticated can invoke the revision-checked diagnostic save RPC');
select ok(not has_function_privilege('anon', 'public.get_interview_playbook_diagnostic_inputs_snapshot()', 'execute'), 'anon cannot invoke the coherent diagnostic snapshot RPC');
select ok(has_function_privilege('authenticated', 'public.get_interview_playbook_diagnostic_inputs_snapshot()', 'execute'), 'authenticated can invoke the coherent diagnostic snapshot RPC');
select ok(not has_function_privilege('authenticated', 'public.set_interview_playbook_diagnostic_settings_updated_at()', 'execute'), 'authenticated cannot invoke the diagnostic revision trigger function');

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'diagnostic-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'diagnostic-b@example.test', '', now(), '{}', '{}', now(), now());

-- Keep the original validation coverage readable while exercising only the
-- new production RPC. This test helper resolves the current owner revision
-- immediately before each sequential validation call; concurrency behavior
-- is tested separately with explicit stale revisions and by the local
-- Promise.all qualifier.
create function pg_temp.test_save_interview_playbook_diagnostic_inputs(
  available_hours_per_week_value numeric,
  confidence_entries jsonb,
  priority_areas text[],
  constraint_entries jsonb,
  behavioral_stories_coverage_value text,
  project_deep_dive_coverage_value text
)
returns public.interview_playbook_diagnostic_settings
language plpgsql
security invoker
set search_path = ''
as $$
declare
  expected_updated_at timestamptz;
  expect_absent boolean;
  saved_updated_at timestamptz;
  saved public.interview_playbook_diagnostic_settings%rowtype;
begin
  select settings.updated_at into expected_updated_at
  from public.interview_playbook_diagnostic_settings as settings
  where settings.user_id = auth.uid();
  expect_absent := not found;

  select result.updated_at into saved_updated_at
  from public.save_interview_playbook_diagnostic_inputs_if_revision(
    expect_absent,
    expected_updated_at,
    available_hours_per_week_value,
    confidence_entries,
    priority_areas,
    constraint_entries,
    behavioral_stories_coverage_value,
    project_deep_dive_coverage_value
  ) as result;

  if saved_updated_at is null then
    raise exception 'Sequential test save unexpectedly conflicted';
  end if;

  select settings.* into saved
  from public.interview_playbook_diagnostic_settings as settings
  where settings.user_id = auth.uid();
  return saved;
end;
$$;

set local role anon;
select throws_ok(
  $$select * from public.get_interview_playbook_diagnostic_inputs_snapshot()$$,
  '42501', null, 'anonymous callers cannot read a diagnostic aggregate snapshot'
);
select throws_ok(
  $$select * from public.save_interview_playbook_diagnostic_inputs_if_revision(true, null, null, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '42501', null, 'anonymous callers cannot save a diagnostic aggregate'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa', true);

select is((select count(*)::integer from public.get_interview_playbook_diagnostic_inputs_snapshot()), 1, 'the coherent reader returns exactly one row when no aggregate exists');
select is((select has_saved_inputs from public.get_interview_playbook_diagnostic_inputs_snapshot()), false, 'the coherent reader marks a missing aggregate explicitly');
select is((select updated_at from public.get_interview_playbook_diagnostic_inputs_snapshot()), null::timestamptz, 'the missing aggregate has no synthetic revision');
select is(
  (select confidence_entries::text || ':' || priority_areas::text || ':' || constraint_entries::text from public.get_interview_playbook_diagnostic_inputs_snapshot()),
  '[]:{}:[]',
  'the missing aggregate returns deterministic neutral child collections'
);

-- --- User A: a full, valid save --------------------------------------
select is(
  (pg_temp.test_save_interview_playbook_diagnostic_inputs(
    10.5,
    '[{"area":"system-design","confidence":"low"},{"area":"behavioral","confidence":"high"}]'::jsonb,
    array['system-design', 'ml-system-design'],
    '[{"category":"work","description":" Limited weekday evenings "},{"category":"health","description":"Recovering from minor surgery"}]'::jsonb,
    'partial',
    'not-started'
  )).available_hours_per_week,
  10.50,
  'owner can save a full diagnostic input set atomically'
);
select is((select count(*)::integer from public.interview_playbook_confidence where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 2, 'confidence rows persisted for the owner');
select is((select count(*)::integer from public.interview_playbook_priorities where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 2, 'priority rows persisted for the owner');
select is((select count(*)::integer from public.interview_playbook_constraints where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 2, 'constraint rows persisted for the owner');
select is(
  (select confidence from public.interview_playbook_confidence where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa' and area = 'system-design'),
  'low',
  'confidence value is stored exactly as saved'
);
select is(
  (select "position" from public.interview_playbook_priorities where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa' and area = 'system-design'),
  1::smallint,
  'priority input order is persisted exactly (first entry -> position 1)'
);
select is(
  (select "position" from public.interview_playbook_priorities where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa' and area = 'ml-system-design'),
  2::smallint,
  'priority input order is persisted exactly (second entry -> position 2)'
);
select is(
  (select description from public.interview_playbook_constraints where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa' and category = 'work'),
  'Limited weekday evenings',
  'constraint description is trimmed'
);
select is(
  (select "position" from public.interview_playbook_constraints where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa' and category = 'work'),
  1::smallint,
  'constraint input order is persisted exactly (first entry -> position 1)'
);
select is(
  (select "position" from public.interview_playbook_constraints where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa' and category = 'health'),
  2::smallint,
  'constraint input order is persisted exactly (second entry -> position 2)'
);
select is(
  (select confidence_entries from public.get_interview_playbook_diagnostic_inputs_snapshot()),
  '[{"area":"system-design","confidence":"low"},{"area":"behavioral","confidence":"high"}]'::jsonb,
  'the coherent reader returns confidence in canonical area order'
);
select is(
  (select priority_areas from public.get_interview_playbook_diagnostic_inputs_snapshot()),
  array['system-design', 'ml-system-design']::text[],
  'the coherent reader returns priorities in stored position order'
);
select is(
  (select pg_catalog.jsonb_path_query_array(constraint_entries, '$[*].category') from public.get_interview_playbook_diagnostic_inputs_snapshot()),
  '["work","health"]'::jsonb,
  'the coherent reader returns constraints in stored position order'
);

-- --- Exact ordinal invariant (WITH ORDINALITY, not row_number()) ------------
select is(
  (pg_temp.test_save_interview_playbook_diagnostic_inputs(
    null, '[]'::jsonb,
    array['ml-system-design', 'system-design', 'behavioral'],
    '[]'::jsonb,
    'unknown', 'unknown'
  )).user_id,
  'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
  'ordinal invariant save succeeds'
);
select is(
  (select "position" from public.interview_playbook_priorities where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa' and area = 'ml-system-design'),
  1::smallint,
  'ordinal invariant: ml-system-design is position 1'
);
select is(
  (select "position" from public.interview_playbook_priorities where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa' and area = 'system-design'),
  2::smallint,
  'ordinal invariant: system-design is position 2'
);
select is(
  (select "position" from public.interview_playbook_priorities where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa' and area = 'behavioral'),
  3::smallint,
  'ordinal invariant: behavioral is position 3'
);

-- --- Boundary values -----------------------------------------------------
select lives_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(0, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  'available hours of exactly 0 is accepted'
);
select lives_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(168, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  'available hours of exactly 168 is accepted'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(169, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'available hours above 168 is rejected'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(-1, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'negative available hours is rejected'
);

-- --- Confidence validation -------------------------------------------------
select lives_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null,
    '[{"area":"algorithmic-coding","confidence":"low"},{"area":"practical-coding","confidence":"medium"},{"area":"debugging","confidence":"high"},{"area":"code-review","confidence":"low"},{"area":"low-level-design","confidence":"medium"},{"area":"system-design","confidence":"high"},{"area":"ml-system-design","confidence":"low"},{"area":"behavioral","confidence":"medium"},{"area":"project-deep-dive","confidence":"high"}]'::jsonb,
    '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  'all nine canonical confidence areas are accepted together'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null, '[{"area":"hiring-manager","confidence":"low"}]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'a non-canonical confidence area is rejected'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null, '[{"area":"system-design","confidence":"expert"}]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'an invalid confidence value is rejected'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null, '[{"area":"system-design","confidence":"unknown"}]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, '"unknown" is rejected as a stored confidence value'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null, '[{"area":"system-design","confidence":"low"},{"area":"system-design","confidence":"high"}]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'a duplicate confidence area is rejected'
);

-- --- Priority validation ---------------------------------------------------
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, array['system-design', 'system-design'], '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'a duplicate priority area is rejected'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, array['recruiter-screen'], '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'a non-canonical priority area is rejected'
);

-- --- Constraint validation --------------------------------------------------
select lives_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}',
    '[{"category":"work","description":"a"},{"category":"school","description":"b"},{"category":"health","description":"c"},{"category":"family","description":"d"},{"category":"other","description":"e"}]'::jsonb,
    'unknown', 'unknown')$$,
  'all five constraint categories are accepted'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}',
    (select jsonb_agg(jsonb_build_object('category', 'other', 'description', 'row ' || generate_series)) from generate_series(1, 11)),
    'unknown', 'unknown')$$,
  '22023', null, 'more than ten constraints is rejected'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}', '[{"category":"work","description":"   "}]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'a blank constraint description is rejected'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}', jsonb_build_array(jsonb_build_object('category', 'work', 'description', repeat('a', 501))), 'unknown', 'unknown')$$,
  '22023', null, 'a description over 500 characters is rejected'
);

-- --- Coverage validation -----------------------------------------------------
select lives_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}', '[]'::jsonb, 'covered', 'covered')$$,
  'Behavioral and Project Deep Dive coverage accept "covered"'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}', '[]'::jsonb, 'ready', 'unknown')$$,
  '22023', null, 'an invalid Behavioral coverage value is rejected'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'ready')$$,
  '22023', null, 'an invalid Project Deep Dive coverage value is rejected'
);

-- --- Atomic replacement ------------------------------------------------------
select pg_temp.test_save_interview_playbook_diagnostic_inputs(
  5,
  '[{"area":"system-design","confidence":"low"},{"area":"behavioral","confidence":"high"}]'::jsonb,
  array['system-design', 'behavioral'],
  '[{"category":"work","description":"Kept"}]'::jsonb,
  'partial', 'partial'
);
select is((select count(*)::integer from public.interview_playbook_confidence where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 2, 'baseline replacement state before the narrowing save');
select pg_temp.test_save_interview_playbook_diagnostic_inputs(
  5,
  '[{"area":"system-design","confidence":"medium"}]'::jsonb,
  array['system-design'],
  '[]'::jsonb,
  'partial', 'partial'
);
select is((select count(*)::integer from public.interview_playbook_confidence where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 1, 'replacement removes confidence rows omitted by the next save');
select is((select count(*)::integer from public.interview_playbook_priorities where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 1, 'replacement removes priority rows omitted by the next save');
select is((select count(*)::integer from public.interview_playbook_constraints where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 0, 'replacement removes constraint rows omitted by the next save');
select is(
  (select confidence from public.interview_playbook_confidence where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa' and area = 'system-design'),
  'medium',
  'replacement updates the surviving row to its new value'
);

select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(5, '[{"area":"system-design","confidence":"high"}]'::jsonb, '{}', '[]'::jsonb, 'bad-value', 'unknown')$$,
  '22023', null, 'a failed save is rejected before any replacement'
);
select is(
  (select confidence from public.interview_playbook_confidence where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa' and area = 'system-design'),
  'medium',
  'a failed save leaves the previously saved confidence untouched (atomic)'
);
select is((select count(*)::integer from public.interview_playbook_priorities where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 1, 'a failed save leaves the previously saved priorities untouched (atomic)');

-- --- Revision contract and coherent aggregate reader ------------------------
select throws_ok(
  $$select * from public.save_interview_playbook_diagnostic_inputs_if_revision(null, null, 5, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '23514', null, 'a null revision discriminator is rejected'
);
select throws_ok(
  $$select * from public.save_interview_playbook_diagnostic_inputs_if_revision(true, now(), 5, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '23514', null, 'expect-absent rejects a supplied revision'
);
select throws_ok(
  $$select * from public.save_interview_playbook_diagnostic_inputs_if_revision(false, null, 5, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '23514', null, 'expect-existing requires an exact revision'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(5, null, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'a null confidence collection is rejected instead of clearing it'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(5, '[{"area":"system-design","confidence":"medium","extra":true}]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'an over-posted confidence object is rejected'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(5, '[]'::jsonb, null, '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'a null priority collection is rejected instead of clearing it'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(5, '[]'::jsonb, '{}', null, 'unknown', 'unknown')$$,
  '22023', null, 'a null constraint collection is rejected instead of clearing it'
);
select throws_ok(
  $$select pg_temp.test_save_interview_playbook_diagnostic_inputs(5, '[]'::jsonb, '{}', '[{"category":"work","description":"Bounded","extra":true}]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'an over-posted constraint object is rejected'
);

select is((select count(*)::integer from public.get_interview_playbook_diagnostic_inputs_snapshot()), 1, 'the coherent reader returns exactly one persisted aggregate row');
select is((select has_saved_inputs from public.get_interview_playbook_diagnostic_inputs_snapshot()), true, 'the coherent reader distinguishes a saved aggregate from neutral absence');
select is(
  (select confidence_entries from public.get_interview_playbook_diagnostic_inputs_snapshot()),
  '[{"area":"system-design","confidence":"medium"}]'::jsonb,
  'the coherent reader returns confidence in canonical order'
);
select is(
  (select priority_areas from public.get_interview_playbook_diagnostic_inputs_snapshot()),
  array['system-design']::text[],
  'the coherent reader returns priorities in stored position order'
);
select is(
  (select constraint_entries from public.get_interview_playbook_diagnostic_inputs_snapshot()),
  '[]'::jsonb,
  'the coherent reader returns the exact saved empty constraint collection'
);

with before as materialized (
  select settings.updated_at
  from public.interview_playbook_diagnostic_settings as settings
  where settings.user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'
), saved as materialized (
  select result.updated_at
  from before
  cross join lateral public.save_interview_playbook_diagnostic_inputs_if_revision(
    false,
    before.updated_at,
    6,
    '[{"area":"system-design","confidence":"high"}]'::jsonb,
    array['system-design'],
    '[{"category":"family","description":"Coherent winner"}]'::jsonb,
    'covered',
    'partial'
  ) as result
)
select cmp_ok((select updated_at from saved), '>', (select updated_at from before), 'a successful aggregate update advances its revision monotonically');
select is((select available_hours_per_week from public.get_interview_playbook_diagnostic_inputs_snapshot()), 6.00, 'the coherent reader observes the winning settings snapshot');
select is(
  (select count(*)::integer from public.save_interview_playbook_diagnostic_inputs_if_revision(
    false,
    '2000-01-01T00:00:00Z'::timestamptz,
    99,
    '[{"area":"behavioral","confidence":"low"}]'::jsonb,
    array['behavioral'],
    '[]'::jsonb,
    'unknown',
    'unknown'
  )),
  0,
  'a stale aggregate update returns zero rows without revealing another state'
);
select is(
  (select confidence_entries from public.get_interview_playbook_diagnostic_inputs_snapshot()),
  '[{"area":"system-design","confidence":"high"}]'::jsonb,
  'a stale aggregate update cannot replace the winning child snapshot'
);
select ok(
  (select updated_at is not null
    and behavioral_stories_coverage = 'covered'
    and project_deep_dive_coverage = 'partial'
    and constraint_entries @> '[{"category":"family","description":"Coherent winner"}]'::jsonb
   from public.get_interview_playbook_diagnostic_inputs_snapshot()),
  'the coherent reader returns the revision, coverage, and ordered constraint winner together'
);

select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(1, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '0A000', 'Revision-checked Interview Playbook diagnostic saving is required',
  'the authenticated legacy aggregate RPC is a stable no-mutation failure'
);
select is((select available_hours_per_week from public.get_interview_playbook_diagnostic_inputs_snapshot()), 6.00, 'the legacy compatibility failure leaves the aggregate unchanged');

-- --- User B: cannot read or affect user A --------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb', true);

select is((select count(*)::integer from public.interview_playbook_diagnostic_settings), 0, 'another user cannot read owner diagnostic settings');
select is((select count(*)::integer from public.interview_playbook_confidence), 0, 'another user cannot read owner confidence');
select is((select count(*)::integer from public.interview_playbook_priorities), 0, 'another user cannot read owner priorities');
select is((select count(*)::integer from public.interview_playbook_constraints), 0, 'another user cannot read owner constraints');

select is(
  (pg_temp.test_save_interview_playbook_diagnostic_inputs(
    20,
    '[{"area":"debugging","confidence":"high"}]'::jsonb,
    array['debugging'],
    '[{"category":"family","description":"Caregiving in the evenings"}]'::jsonb,
    'unknown', 'unknown'
  )).user_id,
  'bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb'::uuid,
  'the RPC derives ownership from auth.uid(), never a caller-supplied id'
);
select is((select count(*)::integer from public.interview_playbook_confidence where user_id = 'bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb'), 1, 'user B save writes only user B rows');

-- RLS means user B's own SELECT can never see user A's rows regardless of
-- their true state, so the next three checks must run with RLS bypassed
-- (reset role) to actually verify user A's data on disk went untouched.
reset role;
select is((select count(*)::integer from public.interview_playbook_confidence where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 1, 'user B save does not modify user A confidence');
select is((select count(*)::integer from public.interview_playbook_priorities where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 1, 'user B save does not modify user A priorities');
select is(
  (select available_hours_per_week from public.interview_playbook_diagnostic_settings where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'),
  6.00,
  'user B save does not modify user A diagnostic settings'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb', true);
select throws_ok(
  $$insert into public.interview_playbook_diagnostic_settings (user_id) values ('bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb')$$,
  '42501'
);
select throws_ok(
  $$update public.interview_playbook_diagnostic_settings set available_hours_per_week = 1 where user_id = 'bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb'$$,
  '42501'
);
select throws_ok(
  $$delete from public.interview_playbook_diagnostic_settings where user_id = 'bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb'$$,
  '42501'
);

-- --- Cascade deletion --------------------------------------------------------
reset role;
delete from auth.users where id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa';

select is((select count(*)::integer from public.interview_playbook_diagnostic_settings where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 0, 'deleting the auth user cascades diagnostic settings');
select is((select count(*)::integer from public.interview_playbook_confidence where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 0, 'deleting the auth user cascades confidence');
select is((select count(*)::integer from public.interview_playbook_priorities where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 0, 'deleting the auth user cascades priorities');
select is((select count(*)::integer from public.interview_playbook_constraints where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 0, 'deleting the auth user cascades constraints');

select * from finish();
rollback;
