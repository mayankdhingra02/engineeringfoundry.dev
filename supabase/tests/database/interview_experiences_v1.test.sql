begin;
create extension if not exists pgtap with schema extensions;
select plan(50);

select ok(not has_table_privilege('anon','public.interview_experiences','insert'),'anon cannot create experiences');
select ok(not has_table_privilege('authenticated','public.interview_experiences','insert'),'authenticated direct experience insert is blocked');
select ok(not has_table_privilege('authenticated','public.interview_experience_rounds','insert'),'authenticated direct round insert is blocked');
select has_function('public', 'save_interview_experience_if_revision', array['uuid','boolean','timestamptz','boolean','text','text','text','text','date','text','text','text','boolean','jsonb'], 'revision-checked aggregate save exists');
select has_function('public', 'manage_interview_experience_if_revision', array['uuid','timestamptz','text'], 'revision-checked management RPC exists');
select has_function('public', 'moderate_interview_experience_if_revision', array['uuid','timestamptz','text','text'], 'revision-checked moderation RPC exists');
select ok(has_function_privilege('authenticated','public.save_interview_experience_if_revision(uuid,boolean,timestamptz,boolean,text,text,text,text,date,text,text,text,boolean,jsonb)','execute'),'authenticated can save through the revision-checked aggregate RPC');
select ok(not has_function_privilege('anon','public.save_interview_experience_if_revision(uuid,boolean,timestamptz,boolean,text,text,text,text,date,text,text,text,boolean,jsonb)','execute'),'anon cannot save an interview experience aggregate');
select ok(has_function_privilege('authenticated','public.manage_interview_experience_if_revision(uuid,timestamptz,text)','execute'),'authenticated can manage an owned exact revision');
select ok(not has_function_privilege('anon','public.manage_interview_experience_if_revision(uuid,timestamptz,text)','execute'),'anon cannot manage an interview experience');
select ok(has_function_privilege('authenticated','public.moderate_interview_experience_if_revision(uuid,timestamptz,text,text)','execute'),'authenticated admins can reach revision-bound moderation authorization');
select ok(not has_function_privilege('anon','public.moderate_interview_experience_if_revision(uuid,timestamptz,text,text)','execute'),'anon cannot moderate an interview experience');
select ok(has_function_privilege('authenticated','public.save_interview_experience_draft(uuid,jsonb)','execute'),'authenticated old clients retain the fail-safe legacy signature');
select ok(has_function_privilege('authenticated','public.moderate_interview_experience(uuid,text,text)','execute'),'authenticated old moderation clients retain the fail-safe legacy signature');
select ok(not has_function_privilege('anon','public.moderate_interview_experience(uuid,text,text)','execute'),'anon cannot invoke legacy moderation');
select is((select prosecdef from pg_proc where oid = 'public.save_interview_experience_if_revision(uuid,boolean,timestamptz,boolean,text,text,text,text,date,text,text,text,boolean,jsonb)'::regprocedure), true, 'aggregate save is security definer');
select ok((select 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.save_interview_experience_if_revision(uuid,boolean,timestamptz,boolean,text,text,text,text,date,text,text,text,boolean,jsonb)'::regprocedure), 'aggregate save has an empty search path');
select is((select provolatile from pg_proc where oid = 'public.save_interview_experience_if_revision(uuid,boolean,timestamptz,boolean,text,text,text,text,date,text,text,text,boolean,jsonb)'::regprocedure), 'v'::"char", 'aggregate save is volatile');
select is(pg_get_function_result('public.save_interview_experience_if_revision(uuid,boolean,timestamptz,boolean,text,text,text,text,date,text,text,text,boolean,jsonb)'::regprocedure), 'TABLE(experience_id uuid, status text, updated_at timestamp with time zone)', 'aggregate save returns the exact bounded result');

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('e1111111-1111-4111-8111-111111111111','authenticated','authenticated','experience-a@test','',now(),'{}','{}',now(),now()),
('f2222222-2222-4222-8222-222222222222','authenticated','authenticated','experience-b@test','',now(),'{}','{}',now(),now());

select set_config('test.experience_id', 'e1111111-1111-4111-8111-111111111112', true);
set local role authenticated;
select set_config('request.jwt.claim.sub','e1111111-1111-4111-8111-111111111111',true);
select set_config('test.experience_revision',(select saved.updated_at::text from public.save_interview_experience_if_revision(
  current_setting('test.experience_id')::uuid,true,null,false,' Acme ',' Software Engineer ','','',null,
  'Draft process notes.','','anonymous',false,
  '[{"round_type":" Coding ","topic_labels":[" Arrays "],"process_notes":null}]'::jsonb
) as saved),true);
select is((select status from public.interview_experiences where id=current_setting('test.experience_id')::uuid),'draft','owner creates a private draft');
select is((select company_name || '|' || role_title from public.interview_experiences where id=current_setting('test.experience_id')::uuid),'Acme|Software Engineer','aggregate save normalizes required parent text');
select ok((select role_level is null and region is null and preparation_lessons is null from public.interview_experiences where id=current_setting('test.experience_id')::uuid),'empty role and region plus null lessons persist as null');
select is((select round_type || '|' || topic_labels[1] from public.interview_experience_rounds where experience_id=current_setting('test.experience_id')::uuid),'Coding|Arrays','aggregate save normalizes its round and topic snapshot');
select is((select count(*)::integer from public.save_interview_experience_if_revision(
  current_setting('test.experience_id')::uuid,true,null,false,'Acme','Software Engineer',null,null,null,'Duplicate retry',null,'anonymous',false,'[]'::jsonb
)),0,'repeated absent create returns zero without duplicating the report');
select throws_ok($$select * from public.save_interview_experience_if_revision(
  current_setting('test.experience_id')::uuid,true,current_setting('test.experience_revision')::timestamptz,false,
  'Acme','Software Engineer',null,null,null,'Invalid revision state',null,'anonymous',false,'[]'::jsonb
)$$,'23514','Exactly one interview experience revision state is required','ambiguous revision state fails closed');
select throws_ok($$select * from public.save_interview_experience_if_revision(
  current_setting('test.experience_id')::uuid,false,current_setting('test.experience_revision')::timestamptz,false,
  'Acme','Software Engineer',null,null,null,'Malformed round',null,'anonymous',false,
  '[{"round_type":"Coding","topic_labels":[],"unexpected":true}]'::jsonb
)$$,'23514','Invalid interview experience round','unknown round members fail closed');
select throws_ok($$select * from public.save_interview_experience_if_revision(
  current_setting('test.experience_id')::uuid,false,current_setting('test.experience_revision')::timestamptz,false,
  'Acme','Software Engineer',null,null,null,'Malformed topic',null,'anonymous',false,
  '[{"round_type":"Coding","topic_labels":[{"label":"Arrays"}]}]'::jsonb
)$$,'23514','Invalid interview experience topic','non-string topic members fail closed');
select throws_ok($$select * from public.save_interview_experience_if_revision(
  current_setting('test.experience_id')::uuid,false,current_setting('test.experience_revision')::timestamptz,false,
  'Acme','Software Engineer',null,null,null,'Malformed rounds',null,'anonymous',false,
  '["Technical"]'::jsonb
)$$,'23514','Invalid interview experience round','non-object round members fail closed');
select is((select summary from public.interview_experiences where id=current_setting('test.experience_id')::uuid),'Draft process notes.','rejected aggregate input leaves the parent unchanged');

select set_config('test.original_revision', current_setting('test.experience_revision'), true);
select set_config('test.experience_revision',(select saved.updated_at::text from public.save_interview_experience_if_revision(
  current_setting('test.experience_id')::uuid,false,current_setting('test.experience_revision')::timestamptz,false,
  'Acme','Staff Engineer',null,' ',date '2026-08-01','Updated private process summary.',
  'Review system boundaries.','username',true,
  '[{"round_type":"System Design","topic_labels":["Distributed systems"],"process_notes":"High-level process only."}]'::jsonb
) as saved),true);
select isnt(current_setting('test.experience_revision'),current_setting('test.original_revision'),'successful full edit advances the aggregate revision');
select ok((select role_title = 'Staff Engineer' and role_level is null and region is null from public.interview_experiences where id=current_setting('test.experience_id')::uuid),'full edit normalizes null role and empty region in one parent snapshot');
select is((select round_type || '|' || topic_labels[1] || '|' || process_notes from public.interview_experience_rounds where experience_id=current_setting('test.experience_id')::uuid),'System Design|Distributed systems|High-level process only.','full edit replaces rounds as one coherent snapshot');
select is((select count(*)::integer from public.save_interview_experience_if_revision(
  current_setting('test.experience_id')::uuid,false,current_setting('test.original_revision')::timestamptz,false,
  'Acme','Stale role',null,null,null,'Stale summary',null,'anonymous',false,'[]'::jsonb
)),0,'stale full edit returns zero');
select is((select role_title from public.interview_experiences where id=current_setting('test.experience_id')::uuid),'Staff Engineer','stale full edit cannot mutate the winning parent');

select set_config('test.submitted_revision',(select saved.updated_at::text from public.save_interview_experience_if_revision(
  current_setting('test.experience_id')::uuid,false,current_setting('test.experience_revision')::timestamptz,true,
  'Acme','Staff Engineer',null,null,date '2026-08-01',
  'The interview process used high-level coding and system design discussions without proprietary questions.',
  'Review system boundaries.','anonymous',true,
  '[{"round_type":"System Design","topic_labels":["Distributed systems"],"process_notes":null}]'::jsonb
) as saved),true);
select is((select status from public.interview_experiences where id=current_setting('test.experience_id')::uuid),'submitted','content and desired submission state commit atomically');
select ok((select submitted_at is not null and review_note is null from public.interview_experiences where id=current_setting('test.experience_id')::uuid),'submission timestamps and clears the prior moderation note');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','f2222222-2222-4222-8222-222222222222',true);
select is((select count(*)::integer from public.save_interview_experience_if_revision(
  current_setting('test.experience_id')::uuid,false,current_setting('test.submitted_revision')::timestamptz,false,
  'Foreign','Foreign',null,null,null,'Foreign edit',null,'anonymous',false,'[]'::jsonb
)),0,'foreign aggregate save is indistinguishable from a stale or missing target');
select is((select count(*)::integer from public.manage_interview_experience_if_revision(current_setting('test.experience_id')::uuid,current_setting('test.submitted_revision')::timestamptz,'withdraw')),0,'foreign management is indistinguishable from a stale or missing target');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','e1111111-1111-4111-8111-111111111111',true);
select is((select count(*)::integer from public.manage_interview_experience_if_revision(current_setting('test.experience_id')::uuid,current_setting('test.experience_revision')::timestamptz,'withdraw')),0,'stale withdraw returns zero');
select set_config('test.withdrawn_revision',(select managed.updated_at::text from public.manage_interview_experience_if_revision(current_setting('test.experience_id')::uuid,current_setting('test.submitted_revision')::timestamptz,'withdraw') as managed),true);
select is((select status from public.interview_experiences where id=current_setting('test.experience_id')::uuid),'withdrawn','exact revision withdraw persists');

select set_config('test.delete_id','e1111111-1111-4111-8111-111111111113',true);
select set_config('test.delete_revision',(select saved.updated_at::text from public.save_interview_experience_if_revision(
  current_setting('test.delete_id')::uuid,true,null,false,'Delete Co','Engineer',null,null,null,'Private draft to delete.',null,'anonymous',false,'[]'::jsonb
) as saved),true);
select is((select count(*)::integer from public.manage_interview_experience_if_revision(current_setting('test.delete_id')::uuid,current_setting('test.delete_revision')::timestamptz - interval '1 second','delete')),0,'stale delete returns zero');
select is((select managed.status from public.manage_interview_experience_if_revision(current_setting('test.delete_id')::uuid,current_setting('test.delete_revision')::timestamptz,'delete') as managed),'deleted','exact revision delete returns a bounded deleted result');
select is((select count(*)::integer from public.interview_experiences where id=current_setting('test.delete_id')::uuid),0,'exact revision delete removes the report');
select is((select count(*)::integer from public.manage_interview_experience_if_revision('e1111111-1111-4111-8111-111111111119',current_setting('test.withdrawn_revision')::timestamptz,'withdraw')),0,'missing management target returns zero');

select throws_ok($$select public.save_interview_experience_draft(null,'{}'::jsonb)$$,'0A000','Revision-checked interview experience saving is required','legacy draft saving fails safely');
select throws_ok($$select public.submit_interview_experience(current_setting('test.experience_id')::uuid)$$,'0A000','Revision-checked interview experience submission is required','legacy submission fails safely');
select throws_ok($$select public.withdraw_interview_experience(current_setting('test.experience_id')::uuid)$$,'0A000','Revision-checked interview experience management is required','legacy withdraw fails safely');
select throws_ok($$select public.delete_interview_experience(current_setting('test.experience_id')::uuid)$$,'0A000','Revision-checked interview experience management is required','legacy delete fails safely');
select throws_ok($$select public.moderate_interview_experience(current_setting('test.experience_id')::uuid,'approved',null)$$,'0A000','Revision-checked interview experience moderation is required','legacy moderation fails safely');
select is((select status from public.interview_experiences where id=current_setting('test.experience_id')::uuid),'withdrawn','legacy failures leave the aggregate unchanged');

select * from finish();
rollback;
