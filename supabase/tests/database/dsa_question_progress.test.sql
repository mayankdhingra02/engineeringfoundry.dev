begin;

create extension if not exists pgtap with schema extensions;
select plan(41);

select ok(not has_table_privilege('anon', 'public.dsa_question_progress', 'select'), 'anonymous users cannot read private DSA question progress');
select ok(has_table_privilege('anon', 'public.dsa_question_catalog', 'select'), 'anonymous users can read the global canonical question catalog');
select ok(has_table_privilege('authenticated', 'public.dsa_question_progress', 'select'), 'authenticated users can read owned DSA question progress through RLS');
select ok(has_table_privilege('authenticated', 'public.dsa_question_progress', 'delete'), 'authenticated users can delete owned DSA question progress through RLS');
select ok(not has_table_privilege('authenticated', 'public.dsa_question_progress', 'insert'), 'clients cannot bypass the authoritative progress RPC with direct inserts');
select ok(not has_table_privilege('authenticated', 'public.dsa_question_progress', 'update'), 'clients cannot bypass the authoritative progress RPC with direct updates');
select ok(not has_function_privilege('anon', 'public.save_dsa_question_progress(text,text,text,boolean,text)', 'execute'), 'anonymous users cannot invoke the progress RPC');
select ok(has_function_privilege('authenticated', 'public.save_dsa_question_progress(text,text,text,boolean,text)', 'execute'), 'authenticated users can invoke the owner-resolved progress RPC');
select is((select count(*)::integer from public.dsa_question_catalog), 162, 'the migration seeds the complete canonical question catalog');
select is((select count(*)::integer from public.dsa_question_catalog where id = 'two-sum'), 1, 'Two Sum has one stable canonical ID');

insert into auth.users (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
  ('12121212-1212-4121-8121-121212121212','authenticated','authenticated','dsa-progress-a@example.test','',now(),'{}','{}',now(),now()),
  ('34343434-3434-4343-8343-343434343434','authenticated','authenticated','dsa-progress-b@example.test','',now(),'{}','{}',now(),now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '12121212-1212-4121-8121-121212121212', true);

select results_eq(
  $$select status from public.save_dsa_question_progress('two-sum','attempted','low',true,'Used a hash map; revisit the complement invariant.')$$,
  $$values ('attempted'::text)$$,
  'User A can record an attempted question'
);
select is((select count(*)::integer from public.dsa_question_progress), 1, 'the RPC creates one owned progress row');
select is((select confidence from public.dsa_question_progress where question_id = 'two-sum'), 'low', 'confidence persists');
select is((select bookmarked from public.dsa_question_progress where question_id = 'two-sum'), true, 'bookmark state persists');
select is((select notes from public.dsa_question_progress where question_id = 'two-sum'), 'Used a hash map; revisit the complement invariant.', 'private notes persist');
select ok((select first_attempted_at is not null from public.dsa_question_progress where question_id = 'two-sum'), 'first attempted timestamp is recorded');
select ok((select last_practiced_at is not null from public.dsa_question_progress where question_id = 'two-sum'), 'last practiced timestamp is recorded for meaningful practice');
select ok((select solved_at is null from public.dsa_question_progress where question_id = 'two-sum'), 'attempted state does not forge a solved timestamp');
select set_config('test.dsa_first_attempted', (select first_attempted_at::text from public.dsa_question_progress where question_id = 'two-sum'), true);
select set_config('test.dsa_last_practiced', (select last_practiced_at::text from public.dsa_question_progress where question_id = 'two-sum'), true);

select results_eq(
  $$select status from public.save_dsa_question_progress('two-sum','attempted','low',false,'Used a hash map; revisit the complement invariant.')$$,
  $$values ('attempted'::text)$$,
  'bookmark-only changes keep the practice status'
);
select is((select last_practiced_at::text from public.dsa_question_progress where question_id = 'two-sum'), current_setting('test.dsa_last_practiced'), 'bookmark-only changes do not move last practiced');

select results_eq(
  $$select notes from public.save_dsa_question_progress('two-sum','attempted','medium',false,'Explain why one pass is sufficient.')$$,
  $$values ('Explain why one pass is sufficient.'::text)$$,
  'meaningful confidence and note changes persist'
);
select ok((select last_practiced_at >= current_setting('test.dsa_last_practiced')::timestamptz from public.dsa_question_progress where question_id = 'two-sum'), 'meaningful changes advance last practiced');

select results_eq(
  $$select status from public.save_dsa_question_progress('two-sum','solved','medium',false,'Explain why one pass is sufficient.')$$,
  $$values ('solved'::text)$$,
  'User A can mark the question solved'
);
select ok((select solved_at is not null from public.dsa_question_progress where question_id = 'two-sum'), 'solved state records solved_at');
select is((select first_attempted_at::text from public.dsa_question_progress where question_id = 'two-sum'), current_setting('test.dsa_first_attempted'), 'later transitions preserve first attempted');
select set_config('test.dsa_solved', (select solved_at::text from public.dsa_question_progress where question_id = 'two-sum'), true);

select results_eq(
  $$select status from public.save_dsa_question_progress('two-sum','review','low',false,'Review edge cases.')$$,
  $$values ('review'::text)$$,
  'User A can move a solved question into review'
);
select is((select solved_at::text from public.dsa_question_progress where question_id = 'two-sum'), current_setting('test.dsa_solved'), 'review preserves the original solved timestamp');
select throws_ok($$select * from public.save_dsa_question_progress('fabricated-question','attempted','low',false,null)$$, '23503', 'Unknown canonical DSA question', 'fake question IDs are rejected');
select throws_ok($$select * from public.save_dsa_question_progress('two-sum','comfortable','low',false,null)$$, '23514', 'Invalid DSA question status', 'unsupported statuses are rejected');
select throws_ok($$select * from public.save_dsa_question_progress('two-sum','attempted','certain',false,null)$$, '23514', 'Invalid confidence', 'unsupported confidence values are rejected');
select throws_ok($$select * from public.save_dsa_question_progress('two-sum','attempted','low',false,repeat('x',5001))$$, '22001', 'Notes are too long', 'oversized private notes are rejected');
select throws_ok($$insert into public.dsa_question_progress (user_id,question_id,status) values ('12121212-1212-4121-8121-121212121212','course-schedule','attempted')$$, '42501', 'permission denied for table dsa_question_progress', 'direct progress insertion is denied');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '34343434-3434-4343-8343-343434343434', true);
select is((select count(*)::integer from public.dsa_question_progress), 0, 'User B cannot read User A progress');
select is_empty($$delete from public.dsa_question_progress where user_id = '12121212-1212-4121-8121-121212121212' returning question_id$$, 'User B cannot delete User A progress');
select results_eq(
  $$select status from public.save_dsa_question_progress('longest-substring-without-repeating-characters','attempted','low',true,'Track the left boundary carefully.')$$,
  $$values ('attempted'::text)$$,
  'User B can create an independent record for a canonical question'
);
select is((select count(*)::integer from public.dsa_question_progress), 1, 'User B sees only their own progress row');
select is((select count(*)::integer from public.dsa_question_progress where question_id = 'two-sum'), 0, 'User A Two Sum notes remain invisible to User B');
select results_eq($$delete from public.dsa_question_progress where question_id = 'longest-substring-without-repeating-characters' returning 1$$, $$values (1)$$, 'User B can delete their own progress row');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '12121212-1212-4121-8121-121212121212', true);
select is((select count(*)::integer from public.dsa_question_progress where question_id = 'two-sum'), 1, 'User A progress survives User B cleanup');
select results_eq($$delete from public.dsa_question_progress where question_id = 'two-sum' returning 1$$, $$values (1)$$, 'User A can clean up their own progress row');
select is((select count(*)::integer from public.dsa_question_progress), 0, 'qualification cleanup leaves no progress rows');

select * from finish();
rollback;
