begin;
create extension if not exists pgtap with schema extensions;
select plan(28);

select ok(not has_table_privilege('anon','public.dsa_practice_attempts','select'), 'anonymous users cannot read private DSA attempts');
select ok(has_table_privilege('authenticated','public.dsa_practice_attempts','select'), 'authenticated users can read owned DSA attempts');
select ok(not has_table_privilege('authenticated','public.dsa_practice_attempts','insert'), 'clients cannot directly insert DSA attempts');
select ok(not has_table_privilege('authenticated','public.dsa_practice_attempts','update'), 'clients cannot directly update DSA attempts');
select ok(not has_table_privilege('authenticated','public.dsa_practice_attempts','delete'), 'clients cannot directly delete DSA attempts');
select ok(not has_function_privilege('anon','public.create_dsa_practice_attempt(text,integer,text,text,integer,text,jsonb)','execute'), 'anonymous users cannot create attempts');
select ok(has_function_privilege('authenticated','public.create_dsa_practice_attempt(text,integer,text,text,integer,text,jsonb)','execute'), 'authenticated users create through the validated RPC');
select ok(not has_function_privilege('anon','public.save_dsa_practice_attempt(uuid,bigint,text,text,text,integer,text,integer,jsonb)','execute'), 'anonymous users cannot save attempts');
select ok(has_function_privilege('authenticated','public.save_dsa_practice_attempt(uuid,bigint,text,text,text,integer,text,integer,jsonb)','execute'), 'authenticated users save through revision checks');
select ok(not has_function_privilege('authenticated','public.dsa_practice_attempt_document_valid(jsonb)','execute'), 'clients cannot invoke the document validator');

insert into auth.users (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('51515151-5151-4151-8151-515151515151','authenticated','authenticated','dsa-attempt-a@example.test','',now(),'{}','{}',now(),now()),
('62626262-6262-4262-8262-626262626262','authenticated','authenticated','dsa-attempt-b@example.test','',now(),'{}','{}',now(),now());

select set_config('test.dsa_document', jsonb_build_object(
  'clarification_notes','Input may be empty','brute_force_notes','Compare every pair','approach_notes','Store complements',
  'implementation_notes','private code','test_notes','empty, duplicate, no answer','complexity_notes','O(n) expected time',
  'reflection','Check before update','completed_checkpoints',jsonb_build_array('clarified','brute_force','plan_before_code'),
  'hints_used',0,'error_recovery','recovered','self_review',jsonb_build_object('problem-recognition','strong'),
  'dimension_evidence',jsonb_build_object('problem-recognition','Named complement lookup.'),'follow_up','Retry with a fresh pair problem'
)::text, true);

set local role authenticated;
select set_config('request.jwt.claim.sub','51515151-5151-4151-8151-515151515151',true);
select set_config('test.dsa_attempt', public.create_dsa_practice_attempt('two-sum',1,'Two Sum timed rehearsal','timed',45,'unseen',current_setting('test.dsa_document')::jsonb)::text,true);
select ok(current_setting('test.dsa_attempt')::uuid is not null, 'User A creates a canonical private attempt');
select is((select mode from public.dsa_practice_attempts where id=current_setting('test.dsa_attempt')::uuid),'timed','timed provenance persists');
select is((select prior_exposure from public.dsa_practice_attempts where id=current_setting('test.dsa_attempt')::uuid),'unseen','prior exposure persists');
select set_config('test.dsa_revision',(select revision::text from public.dsa_practice_attempts where id=current_setting('test.dsa_attempt')::uuid),true);
select results_eq(
  $$select status from public.save_dsa_practice_attempt(current_setting('test.dsa_attempt')::uuid,current_setting('test.dsa_revision')::bigint,'Two Sum timed rehearsal','completed','timed',45,'unseen',2730,current_setting('test.dsa_document')::jsonb)$$,
  $$values ('completed'::text)$$,
  'exact revision saves structured timed evidence'
);
select is((select elapsed_seconds from public.dsa_practice_attempts where id=current_setting('test.dsa_attempt')::uuid),2730,'elapsed time persists');
select ok((select completed_at is not null from public.dsa_practice_attempts where id=current_setting('test.dsa_attempt')::uuid),'completed evidence receives a server timestamp');
select is((select review_reason from public.dsa_practice_attempts where id=current_setting('test.dsa_attempt')::uuid),'elapsed','exceeding configured time records a review reason');
select is((select revision from public.dsa_practice_attempts where id=current_setting('test.dsa_attempt')::uuid),2::bigint,'successful save advances revision once');
select is_empty(
  $$select id from public.save_dsa_practice_attempt(current_setting('test.dsa_attempt')::uuid,current_setting('test.dsa_revision')::bigint,'Stale','review','review',null,'solved_before',0,current_setting('test.dsa_document')::jsonb)$$,
  'stale save cannot overwrite a newer attempt'
);
select throws_ok($$select public.create_dsa_practice_attempt('invented-question',1,'Invalid','untimed',null,'unseen',current_setting('test.dsa_document')::jsonb)$$,'23503','Unknown canonical DSA question version','fabricated question IDs are rejected');
select throws_ok($$select public.create_dsa_practice_attempt('two-sum',1,'Bad timing','untimed',45,'unseen',current_setting('test.dsa_document')::jsonb)$$,'23514','Invalid practice duration','untimed attempts cannot forge timed duration');
select throws_ok($$select public.create_dsa_practice_attempt('two-sum',1,'Bad exposure','timed',45,'invented',current_setting('test.dsa_document')::jsonb)$$,'23514','Invalid prior exposure','invalid exposure provenance is rejected');
select throws_ok($$select public.create_dsa_practice_attempt('two-sum',1,'Bad document','mixed',null,'unseen','{}'::jsonb)$$,'23514','Invalid DSA practice document','unvalidated private documents are rejected');
select throws_ok($$select public.create_dsa_practice_attempt('two-sum',1,'Null recovery','mixed',null,'unseen',jsonb_set(current_setting('test.dsa_document')::jsonb,'{error_recovery}','null'::jsonb))$$,'23514','Invalid DSA practice document','null error-recovery state is rejected');
select throws_ok($$select public.create_dsa_practice_attempt('two-sum',1,'Null checkpoint','mixed',null,'unseen',jsonb_set(current_setting('test.dsa_document')::jsonb,'{completed_checkpoints}','[null]'::jsonb))$$,'23514','Invalid DSA practice document','non-string checkpoints are rejected');

reset role; set local role authenticated;
select set_config('request.jwt.claim.sub','62626262-6262-4262-8262-626262626262',true);
select is((select count(*)::integer from public.dsa_practice_attempts),0,'User B cannot read User A attempts');
select is_empty($$select id from public.save_dsa_practice_attempt(current_setting('test.dsa_attempt')::uuid,2,'Foreign overwrite','review','review',null,'solved_before',0,current_setting('test.dsa_document')::jsonb)$$,'foreign attempt is indistinguishable from missing');

reset role;
delete from auth.users where id='51515151-5151-4151-8151-515151515151';
select is((select count(*)::integer from public.dsa_practice_attempts where user_id='51515151-5151-4151-8151-515151515151'),0,'account deletion cascades private DSA attempts');

select * from finish();
rollback;
