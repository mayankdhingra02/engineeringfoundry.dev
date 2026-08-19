begin;

create extension if not exists pgtap with schema extensions;
select plan(78);

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

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa', 'authenticated', 'authenticated', 'diagnostic-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb', 'authenticated', 'authenticated', 'diagnostic-b@example.test', '', now(), '{}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa', true);

-- --- User A: a full, valid save --------------------------------------
select is(
  (public.save_interview_playbook_diagnostic_inputs(
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

-- --- Exact ordinal invariant (WITH ORDINALITY, not row_number()) ------------
select is(
  (public.save_interview_playbook_diagnostic_inputs(
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
  $$select public.save_interview_playbook_diagnostic_inputs(0, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  'available hours of exactly 0 is accepted'
);
select lives_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(168, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  'available hours of exactly 168 is accepted'
);
select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(169, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'available hours above 168 is rejected'
);
select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(-1, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'negative available hours is rejected'
);

-- --- Confidence validation -------------------------------------------------
select lives_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null,
    '[{"area":"algorithmic-coding","confidence":"low"},{"area":"practical-coding","confidence":"medium"},{"area":"debugging","confidence":"high"},{"area":"code-review","confidence":"low"},{"area":"low-level-design","confidence":"medium"},{"area":"system-design","confidence":"high"},{"area":"ml-system-design","confidence":"low"},{"area":"behavioral","confidence":"medium"},{"area":"project-deep-dive","confidence":"high"}]'::jsonb,
    '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  'all nine canonical confidence areas are accepted together'
);
select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null, '[{"area":"hiring-manager","confidence":"low"}]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'a non-canonical confidence area is rejected'
);
select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null, '[{"area":"system-design","confidence":"expert"}]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'an invalid confidence value is rejected'
);
select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null, '[{"area":"system-design","confidence":"unknown"}]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, '"unknown" is rejected as a stored confidence value'
);
select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null, '[{"area":"system-design","confidence":"low"},{"area":"system-design","confidence":"high"}]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'a duplicate confidence area is rejected'
);

-- --- Priority validation ---------------------------------------------------
select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, array['system-design', 'system-design'], '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'a duplicate priority area is rejected'
);
select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, array['recruiter-screen'], '[]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'a non-canonical priority area is rejected'
);

-- --- Constraint validation --------------------------------------------------
select lives_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}',
    '[{"category":"work","description":"a"},{"category":"school","description":"b"},{"category":"health","description":"c"},{"category":"family","description":"d"},{"category":"other","description":"e"}]'::jsonb,
    'unknown', 'unknown')$$,
  'all five constraint categories are accepted'
);
select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}',
    (select jsonb_agg(jsonb_build_object('category', 'other', 'description', 'row ' || generate_series)) from generate_series(1, 11)),
    'unknown', 'unknown')$$,
  '22023', null, 'more than ten constraints is rejected'
);
select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}', '[{"category":"work","description":"   "}]'::jsonb, 'unknown', 'unknown')$$,
  '22023', null, 'a blank constraint description is rejected'
);
select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}', jsonb_build_array(jsonb_build_object('category', 'work', 'description', repeat('a', 501))), 'unknown', 'unknown')$$,
  '22023', null, 'a description over 500 characters is rejected'
);

-- --- Coverage validation -----------------------------------------------------
select lives_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}', '[]'::jsonb, 'covered', 'covered')$$,
  'Behavioral and Project Deep Dive coverage accept "covered"'
);
select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}', '[]'::jsonb, 'ready', 'unknown')$$,
  '22023', null, 'an invalid Behavioral coverage value is rejected'
);
select throws_ok(
  $$select public.save_interview_playbook_diagnostic_inputs(null, '[]'::jsonb, '{}', '[]'::jsonb, 'unknown', 'ready')$$,
  '22023', null, 'an invalid Project Deep Dive coverage value is rejected'
);

-- --- Atomic replacement ------------------------------------------------------
select public.save_interview_playbook_diagnostic_inputs(
  5,
  '[{"area":"system-design","confidence":"low"},{"area":"behavioral","confidence":"high"}]'::jsonb,
  array['system-design', 'behavioral'],
  '[{"category":"work","description":"Kept"}]'::jsonb,
  'partial', 'partial'
);
select is((select count(*)::integer from public.interview_playbook_confidence where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 2, 'baseline replacement state before the narrowing save');
select public.save_interview_playbook_diagnostic_inputs(
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
  $$select public.save_interview_playbook_diagnostic_inputs(5, '[{"area":"system-design","confidence":"high"}]'::jsonb, '{}', '[]'::jsonb, 'bad-value', 'unknown')$$,
  '22023', null, 'a failed save is rejected before any replacement'
);
select is(
  (select confidence from public.interview_playbook_confidence where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa' and area = 'system-design'),
  'medium',
  'a failed save leaves the previously saved confidence untouched (atomic)'
);
select is((select count(*)::integer from public.interview_playbook_priorities where user_id = 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa'), 1, 'a failed save leaves the previously saved priorities untouched (atomic)');

-- --- User B: cannot read or affect user A --------------------------------
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb', true);

select is((select count(*)::integer from public.interview_playbook_diagnostic_settings), 0, 'another user cannot read owner diagnostic settings');
select is((select count(*)::integer from public.interview_playbook_confidence), 0, 'another user cannot read owner confidence');
select is((select count(*)::integer from public.interview_playbook_priorities), 0, 'another user cannot read owner priorities');
select is((select count(*)::integer from public.interview_playbook_constraints), 0, 'another user cannot read owner constraints');

select is(
  (public.save_interview_playbook_diagnostic_inputs(
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
  5.00,
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
