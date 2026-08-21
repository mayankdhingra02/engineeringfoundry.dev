begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

select ok(not has_table_privilege('anon','public.interview_experiences','insert'),'anon cannot create experiences');
select ok(not has_table_privilege('authenticated','public.interview_experiences','insert'),'authenticated direct experience insert is blocked');
select ok(not has_table_privilege('authenticated','public.interview_experience_rounds','insert'),'authenticated direct round insert is blocked');
select ok(has_function_privilege('authenticated','public.save_interview_experience_draft(uuid,jsonb)','execute'),'authenticated can save through owner-derived RPC');

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('e1111111-1111-4111-8111-111111111111','authenticated','authenticated','experience-a@test','',now(),'{}','{}',now(),now()),
('f2222222-2222-4222-8222-222222222222','authenticated','authenticated','experience-b@test','',now(),'{}','{}',now(),now());

set local role authenticated;
select set_config('request.jwt.claim.sub','e1111111-1111-4111-8111-111111111111',true);
select set_config('test.experience_id', public.save_interview_experience_draft(null, '{"company_name":"Acme","role_title":"Software Engineer","role_level":"Mid","summary":"The process used high-level coding and system discussion without proprietary details.","publication_consent":true,"public_identity":"anonymous","rounds":[{"round_type":"Technical","topic_labels":["Algorithms"],"process_notes":"General process context."}]}'::jsonb)::text, true);
select is((select status from public.interview_experiences where id=current_setting('test.experience_id')::uuid),'draft','owner creates a private draft');
select is((select count(*)::int from public.interview_experience_rounds where experience_id=current_setting('test.experience_id')::uuid),1,'draft persists normalized process context');
select is(public.submit_interview_experience(current_setting('test.experience_id')::uuid),true,'owner submits an eligible draft');
select is((select status from public.interview_experiences where id=current_setting('test.experience_id')::uuid),'submitted','submission enters moderation state');
select throws_ok($$select public.save_interview_experience_draft(null, '{"company_name":"Acme","role_title":"SWE","summary":"short","rounds":"not an array"}'::jsonb)$$,'23514','Invalid rounds','invalid normalized rounds are rejected');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','f2222222-2222-4222-8222-222222222222',true);
select is((select count(*)::int from public.interview_experiences),0,'unrelated signed-in user cannot read submitted report');
select is((select count(*)::int from public.interview_experience_rounds),0,'unrelated signed-in user cannot read submitted report rounds');
select throws_ok($$select public.submit_interview_experience(current_setting('test.experience_id')::uuid)$$,'42501','Experience cannot be submitted','unrelated user cannot submit another author draft');

reset role;
update public.interview_experiences set status='approved',reviewed_at=now() where id=current_setting('test.experience_id')::uuid;
set local role anon;
select is((select count(*)::int from public.interview_experiences),1,'anon reads only approved consented report');
select is((select count(*)::int from public.interview_experience_rounds),1,'anon reads rounds only for approved report');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','e1111111-1111-4111-8111-111111111111',true);
select is(public.withdraw_interview_experience(current_setting('test.experience_id')::uuid),true,'owner can withdraw a submitted/approved report');
select is((select status from public.interview_experiences where id=current_setting('test.experience_id')::uuid),'withdrawn','withdrawal persists and removes public status');
reset role;
set local role anon;
select is((select count(*)::int from public.interview_experiences),0,'withdrawn report is no longer public');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','e1111111-1111-4111-8111-111111111111',true);
select is(public.delete_interview_experience(current_setting('test.experience_id')::uuid),true,'owner can delete a withdrawn report');
select is((select count(*)::int from public.interview_experience_rounds),0,'deleting report cascades rounds');

select * from finish();
rollback;
