begin;

create extension if not exists pgtap with schema extensions;
select plan(92);

select ok(not has_table_privilege('anon', 'public.dsa_question_progress', 'select'), 'anonymous users cannot read private DSA question progress');
select ok(has_table_privilege('anon', 'public.dsa_question_catalog', 'select'), 'anonymous users can read the global canonical question catalog');
select ok(has_table_privilege('authenticated', 'public.dsa_question_progress', 'select'), 'authenticated users can read owned DSA question progress through RLS');
select ok(has_table_privilege('authenticated', 'public.dsa_question_progress', 'delete'), 'authenticated users can delete owned DSA question progress through RLS');
select ok(not has_table_privilege('authenticated', 'public.dsa_question_progress', 'insert'), 'clients cannot bypass the authoritative progress RPC with direct inserts');
select ok(not has_table_privilege('authenticated', 'public.dsa_question_progress', 'update'), 'clients cannot bypass the authoritative progress RPC with direct updates');
select ok(not has_function_privilege('anon', 'public.save_dsa_question_progress(text,text,text,boolean,text)', 'execute'), 'anonymous users cannot invoke the progress RPC');
select ok(has_function_privilege('authenticated', 'public.save_dsa_question_progress(text,text,text,boolean,text)', 'execute'), 'authenticated old clients reach the stable retired progress RPC');
select ok(not has_function_privilege('anon', 'public.save_dsa_question_progress_if_revision(text,boolean,timestamptz,text,text,boolean,text)', 'execute'), 'anonymous users cannot invoke revision-checked progress saving');
select ok(has_function_privilege('authenticated', 'public.save_dsa_question_progress_if_revision(text,boolean,timestamptz,text,text,boolean,text)', 'execute'), 'authenticated users can invoke revision-checked owner progress saving');
select ok(not has_function_privilege('anon', 'public.set_dsa_question_quick_progress(text,text,boolean)', 'execute'), 'anonymous users cannot invoke the atomic quick-progress RPC');
select ok(has_function_privilege('authenticated', 'public.set_dsa_question_quick_progress(text,text,boolean)', 'execute'), 'authenticated users can invoke the owner-resolved atomic quick-progress RPC');
select is((select count(*)::integer from public.dsa_question_catalog), 162, 'the migration seeds the complete canonical question catalog');
select is((select count(*)::integer from public.dsa_question_catalog where id = 'two-sum'), 1, 'Two Sum has one stable canonical ID');

insert into auth.users (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
  ('12121212-1212-4121-8121-121212121212','authenticated','authenticated','dsa-progress-a@example.test','',now(),'{}','{}',now(),now()),
  ('34343434-3434-4343-8343-343434343434','authenticated','authenticated','dsa-progress-b@example.test','',now(),'{}','{}',now(),now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '12121212-1212-4121-8121-121212121212', true);

select results_eq(
  $$select question_id from public.save_dsa_question_progress_if_revision('two-sum',true,null,'attempted','low',true,'Used a hash map; revisit the complement invariant.')$$,
  $$values ('two-sum'::text)$$,
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
  $$select question_id from public.save_dsa_question_progress_if_revision('two-sum',false,(select updated_at from public.dsa_question_progress where question_id = 'two-sum'),'attempted','low',false,'Used a hash map; revisit the complement invariant.')$$,
  $$values ('two-sum'::text)$$,
  'bookmark-only changes keep the practice status'
);
select is((select last_practiced_at::text from public.dsa_question_progress where question_id = 'two-sum'), current_setting('test.dsa_last_practiced'), 'bookmark-only changes do not move last practiced');

select results_eq(
  $$select question_id from public.save_dsa_question_progress_if_revision('two-sum',false,(select updated_at from public.dsa_question_progress where question_id = 'two-sum'),'attempted','medium',false,'Explain why one pass is sufficient.')$$,
  $$values ('two-sum'::text)$$,
  'meaningful confidence and note changes persist'
);
select is((select notes from public.dsa_question_progress where question_id = 'two-sum'), 'Explain why one pass is sufficient.', 'the revision-checked full save persists normalized private notes');
select ok((select last_practiced_at >= current_setting('test.dsa_last_practiced')::timestamptz from public.dsa_question_progress where question_id = 'two-sum'), 'meaningful changes advance last practiced');

select results_eq(
  $$select question_id from public.save_dsa_question_progress_if_revision('two-sum',false,(select updated_at from public.dsa_question_progress where question_id = 'two-sum'),'solved','medium',false,'Explain why one pass is sufficient.')$$,
  $$values ('two-sum'::text)$$,
  'User A can mark the question solved'
);
select ok((select solved_at is not null from public.dsa_question_progress where question_id = 'two-sum'), 'solved state records solved_at');
select is((select first_attempted_at::text from public.dsa_question_progress where question_id = 'two-sum'), current_setting('test.dsa_first_attempted'), 'later transitions preserve first attempted');
select set_config('test.dsa_solved', (select solved_at::text from public.dsa_question_progress where question_id = 'two-sum'), true);

select results_eq(
  $$select question_id from public.save_dsa_question_progress_if_revision('two-sum',false,(select updated_at from public.dsa_question_progress where question_id = 'two-sum'),'review','low',false,'Review edge cases.')$$,
  $$values ('two-sum'::text)$$,
  'User A can move a solved question into review'
);
select is((select solved_at::text from public.dsa_question_progress where question_id = 'two-sum'), current_setting('test.dsa_solved'), 'review preserves the original solved timestamp');
select set_config('test.dsa_quick_first', (select first_attempted_at::text from public.dsa_question_progress where question_id = 'two-sum'), true);
select set_config('test.dsa_quick_last', (select last_practiced_at::text from public.dsa_question_progress where question_id = 'two-sum'), true);
select set_config('test.dsa_quick_solved', (select solved_at::text from public.dsa_question_progress where question_id = 'two-sum'), true);
select set_config('test.dsa_stale_revision', (select updated_at::text from public.dsa_question_progress where question_id = 'two-sum'), true);

select results_eq(
  $$select public.set_dsa_question_quick_progress('two-sum',null,true)$$,
  $$values ('two-sum'::text)$$,
  'the atomic RPC returns the canonical question ID after a bookmark update'
);
select is((select bookmarked from public.dsa_question_progress where question_id = 'two-sum'), true, 'the atomic bookmark update persists its desired state');
select is((select status from public.dsa_question_progress where question_id = 'two-sum'), 'review', 'the atomic bookmark update preserves status');
select is((select confidence from public.dsa_question_progress where question_id = 'two-sum'), 'low', 'the atomic bookmark update preserves confidence');
select is((select notes from public.dsa_question_progress where question_id = 'two-sum'), 'Review edge cases.', 'the atomic bookmark update preserves private notes');
select is((select last_practiced_at::text from public.dsa_question_progress where question_id = 'two-sum'), current_setting('test.dsa_quick_last'), 'the atomic bookmark update preserves last practiced');
select set_config('test.dsa_quick_updated', (select updated_at::text from public.dsa_question_progress where question_id = 'two-sum'), true);
select is_empty(
  $$select * from public.save_dsa_question_progress_if_revision('two-sum',false,current_setting('test.dsa_stale_revision')::timestamptz,'attempted','high',false,'Stale full-editor note.')$$,
  'a full save with the pre-bookmark revision reports a conflict'
);
select results_eq(
  $$select status,confidence,bookmarked,notes from public.dsa_question_progress where question_id = 'two-sum'$$,
  $$values ('review'::text,'low'::text,true,'Review edge cases.'::text)$$,
  'a stale full save preserves the newer bookmark and every rich field'
);
select is_empty(
  $$select * from public.save_dsa_question_progress_if_revision('two-sum',true,null,'attempted','low',false,null)$$,
  'explicit expected absence conflicts with an existing owner row'
);

select results_eq(
  $$select public.set_dsa_question_quick_progress('two-sum',null,true)$$,
  $$values ('two-sum'::text)$$,
  'repeating an atomic desired bookmark state succeeds idempotently'
);
select is((select updated_at::text from public.dsa_question_progress where question_id = 'two-sum'), current_setting('test.dsa_quick_updated'), 'repeating an atomic bookmark state does not churn updated_at');

select results_eq(
  $$select public.set_dsa_question_quick_progress('two-sum','attempted',null)$$,
  $$values ('two-sum'::text)$$,
  'the atomic RPC returns the canonical question ID after a status update'
);
select is((select status from public.dsa_question_progress where question_id = 'two-sum'), 'attempted', 'the atomic status update persists its desired state');
select is((select bookmarked from public.dsa_question_progress where question_id = 'two-sum'), true, 'the atomic status update preserves the bookmark');
select is((select confidence from public.dsa_question_progress where question_id = 'two-sum'), 'low', 'the atomic status update preserves confidence');
select is((select notes from public.dsa_question_progress where question_id = 'two-sum'), 'Review edge cases.', 'the atomic status update preserves private notes');
select is((select first_attempted_at::text from public.dsa_question_progress where question_id = 'two-sum'), current_setting('test.dsa_quick_first'), 'the atomic status update preserves first attempted');
select is((select solved_at::text from public.dsa_question_progress where question_id = 'two-sum'), current_setting('test.dsa_quick_solved'), 'the atomic status update preserves the first solved timestamp');
select is_empty(
  $$select * from public.save_dsa_question_progress_if_revision('two-sum',false,current_setting('test.dsa_quick_updated')::timestamptz,'solved','medium',false,'Stale after quick status.')$$,
  'a full save with the pre-status revision reports a conflict'
);
select results_eq(
  $$select status,confidence,bookmarked,notes from public.dsa_question_progress where question_id = 'two-sum'$$,
  $$values ('attempted'::text,'low'::text,true,'Review edge cases.'::text)$$,
  'a stale full save preserves the newer status and unrelated rich fields'
);
select set_config('test.dsa_full_revision', (select updated_at::text from public.dsa_question_progress where question_id = 'two-sum'), true);
select results_eq(
  $$select question_id from public.save_dsa_question_progress_if_revision('two-sum',false,current_setting('test.dsa_full_revision')::timestamptz,'review','medium',true,'Fresh full-editor snapshot.')$$,
  $$values ('two-sum'::text)$$,
  'a full save succeeds against the exact current revision'
);
select ok((select updated_at > current_setting('test.dsa_full_revision')::timestamptz from public.dsa_question_progress where question_id = 'two-sum'), 'a successful full save advances its persisted revision');
select is_empty(
  $$select * from public.save_dsa_question_progress_if_revision('two-sum',false,current_setting('test.dsa_full_revision')::timestamptz,'review','medium',true,'Fresh full-editor snapshot.')$$,
  'replaying the consumed full-save revision is idempotently rejected'
);

select results_eq(
  $$select public.set_dsa_question_quick_progress('course-schedule',null,false)$$,
  $$values ('course-schedule'::text)$$,
  'removing an absent bookmark succeeds idempotently'
);
select is((select count(*)::integer from public.dsa_question_progress where question_id = 'course-schedule'), 0, 'removing an absent bookmark does not create an empty progress row');
select results_eq(
  $$select public.set_dsa_question_quick_progress('course-schedule','solved',null)$$,
  $$values ('course-schedule'::text)$$,
  'an atomic status update can create an owned progress row'
);
select results_eq(
  $$select status,bookmarked from public.dsa_question_progress where question_id = 'course-schedule'$$,
  $$values ('solved'::text,false)$$,
  'a status-created row keeps the default bookmark state'
);
select ok((select first_attempted_at is not null and last_practiced_at is not null and solved_at is not null from public.dsa_question_progress where question_id = 'course-schedule'), 'a solved atomic status creates consistent practice timestamps');
delete from public.dsa_question_progress where question_id = 'course-schedule';

select throws_ok($$select public.set_dsa_question_quick_progress('two-sum',null,null)$$, '23514', 'Exactly one quick progress value is required', 'an empty quick update is rejected');
select throws_ok($$select public.set_dsa_question_quick_progress('two-sum','solved',true)$$, '23514', 'Exactly one quick progress value is required', 'a multi-field quick update is rejected');
select throws_ok($$select public.set_dsa_question_quick_progress('two-sum','comfortable',null)$$, '23514', 'Invalid DSA question status', 'an invalid quick status is rejected');
select throws_ok($$select public.set_dsa_question_quick_progress('fabricated-question','solved',null)$$, '23503', 'Unknown canonical DSA question', 'an unknown quick-progress question is rejected');
select throws_ok($$select public.set_dsa_question_quick_progress(null,'solved',null)$$, '23503', 'Unknown canonical DSA question', 'a null quick-progress question is rejected');
select throws_ok($$select * from public.save_dsa_question_progress_if_revision('fabricated-question',true,null,'attempted','low',false,null)$$, '23503', 'Unknown canonical DSA question', 'fake question IDs are rejected');
select throws_ok($$select * from public.save_dsa_question_progress_if_revision(null,true,null,'attempted','low',false,null)$$, '23503', 'Unknown canonical DSA question', 'a null full-save question ID is rejected');
select throws_ok($$select * from public.save_dsa_question_progress_if_revision('two-sum',true,null,'comfortable','low',false,null)$$, '23514', 'Invalid DSA question status', 'unsupported statuses are rejected');
select throws_ok($$select * from public.save_dsa_question_progress_if_revision('two-sum',true,null,'attempted','certain',false,null)$$, '23514', 'Invalid confidence', 'unsupported confidence values are rejected');
select throws_ok($$select * from public.save_dsa_question_progress_if_revision('two-sum',true,null,'attempted','',false,null)$$, '23514', 'Invalid confidence', 'empty confidence is rejected instead of becoming null');
select throws_ok($$select * from public.save_dsa_question_progress_if_revision('two-sum',true,null,'attempted','low',false,repeat('x',5001))$$, '22001', 'Notes are too long', 'oversized private notes are rejected');
select throws_ok($$select * from public.save_dsa_question_progress_if_revision('two-sum',true,now(),'attempted','low',false,null)$$, '23514', 'Expected DSA progress revision is invalid', 'expected absence cannot include a persisted revision');
select throws_ok($$select * from public.save_dsa_question_progress_if_revision('two-sum',false,null,'attempted','low',false,null)$$, '23514', 'Expected DSA progress revision is invalid', 'an existing-row save requires a persisted revision');
select throws_ok($$select * from public.save_dsa_question_progress_if_revision('two-sum',null,null,'attempted','low',false,null)$$, '23514', 'Expected DSA progress revision is invalid', 'the expected-absence discriminator is required');
select throws_ok($$select * from public.save_dsa_question_progress_if_revision('two-sum',true,null,null,'low',false,null)$$, '23514', 'Invalid DSA question status', 'a null full-save status is rejected');
select throws_ok($$select * from public.save_dsa_question_progress_if_revision('two-sum',true,null,'attempted','low',null,null)$$, '23514', 'Bookmark state is required', 'a null full-save bookmark is rejected');
select throws_ok($$select * from public.save_dsa_question_progress('two-sum','attempted','low',false,null)$$, '0A000', 'Revision-checked DSA progress saving is required', 'the legacy whole-row RPC fails without mutation');
select is((select notes from public.dsa_question_progress where question_id = 'two-sum'), 'Fresh full-editor snapshot.', 'the retired legacy RPC preserves the current private snapshot');
select throws_ok($$insert into public.dsa_question_progress (user_id,question_id,status) values ('12121212-1212-4121-8121-121212121212','course-schedule','attempted')$$, '42501', 'permission denied for table dsa_question_progress', 'direct progress insertion is denied');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '34343434-3434-4343-8343-343434343434', true);
select is((select count(*)::integer from public.dsa_question_progress), 0, 'User B cannot read User A progress');
select is_empty($$delete from public.dsa_question_progress where user_id = '12121212-1212-4121-8121-121212121212' returning question_id$$, 'User B cannot delete User A progress');
select is_empty(
  $$select * from public.save_dsa_question_progress_if_revision('two-sum',false,current_setting('test.dsa_quick_updated')::timestamptz,'review','low',false,'Foreign revision attempt.')$$,
  'a foreign owner revision is indistinguishable from missing progress'
);
select results_eq(
  $$select public.set_dsa_question_quick_progress('two-sum',null,false)$$,
  $$values ('two-sum'::text)$$,
  'User B can request an idempotent desired state without targeting User A'
);
select is((select count(*)::integer from public.dsa_question_progress where question_id = 'two-sum'), 0, 'User B quick progress cannot expose or mutate User A progress');
select results_eq(
  $$select question_id from public.save_dsa_question_progress_if_revision('longest-substring-without-repeating-characters',true,null,'attempted','low',true,'Track the left boundary carefully.')$$,
  $$values ('longest-substring-without-repeating-characters'::text)$$,
  'User B can create an independent record for a canonical question'
);
select is((select count(*)::integer from public.dsa_question_progress), 1, 'User B sees only their own progress row');
select is((select count(*)::integer from public.dsa_question_progress where question_id = 'two-sum'), 0, 'User A Two Sum notes remain invisible to User B');
select results_eq($$delete from public.dsa_question_progress where question_id = 'longest-substring-without-repeating-characters' returning 1$$, $$values (1)$$, 'User B can delete their own progress row');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '12121212-1212-4121-8121-121212121212', true);
select is((select count(*)::integer from public.dsa_question_progress where question_id = 'two-sum'), 1, 'User A progress survives User B cleanup');
select is((select bookmarked from public.dsa_question_progress where question_id = 'two-sum'), true, 'User A bookmark survives User B atomic quick progress');
select results_eq($$delete from public.dsa_question_progress where question_id = 'two-sum' returning 1$$, $$values (1)$$, 'User A can clean up their own progress row');
select is((select count(*)::integer from public.dsa_question_progress), 0, 'qualification cleanup leaves no progress rows');

select * from finish();
rollback;
