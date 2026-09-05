begin;

create extension if not exists pgtap with schema extensions;
select plan(30);

select is((select count(*)::integer from public.ml_design_problem_catalog), 13, 'catalog contains the thirteen canonical ML Design problems');
select ok(has_table_privilege('anon', 'public.ml_design_problem_catalog', 'select'), 'public problem catalog remains readable signed out');
select ok(not has_table_privilege('anon', 'public.ml_design_attempts', 'select'), 'anonymous users cannot read private attempts');
select ok(has_table_privilege('authenticated', 'public.ml_design_attempts', 'select'), 'authenticated users can read owned attempts');
select ok(not has_table_privilege('authenticated', 'public.ml_design_attempts', 'insert'), 'clients cannot directly insert attempts');
select ok(not has_table_privilege('authenticated', 'public.ml_design_attempts', 'update'), 'clients cannot directly update attempts');
select ok(not has_table_privilege('authenticated', 'public.ml_design_attempts', 'delete'), 'clients cannot directly delete attempts');
select ok(not has_function_privilege('anon', 'public.create_ml_design_attempt(text,integer,text,text,integer,jsonb)', 'execute'), 'anonymous users cannot create attempts');
select ok(has_function_privilege('authenticated', 'public.create_ml_design_attempt(text,integer,text,text,integer,jsonb)', 'execute'), 'authenticated users create attempts only through the validated RPC');
select ok(not has_function_privilege('anon', 'public.save_ml_design_attempt(uuid,bigint,text,text,text,integer,jsonb)', 'execute'), 'anonymous users cannot save attempts');
select ok(has_function_privilege('authenticated', 'public.save_ml_design_attempt(uuid,bigint,text,text,text,integer,jsonb)', 'execute'), 'authenticated users save attempts through the revision-checked RPC');
select ok(not has_function_privilege('anon', 'public.delete_ml_design_attempt_if_revision(uuid,text,bigint)', 'execute'), 'anonymous users cannot delete attempts');
select ok(has_function_privilege('authenticated', 'public.delete_ml_design_attempt_if_revision(uuid,text,bigint)', 'execute'), 'authenticated users delete attempts through the revision-checked RPC');
select ok(not has_function_privilege('authenticated', 'public.ml_design_attempt_document_valid(jsonb)', 'execute'), 'clients cannot execute the document validator directly');

insert into auth.users (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
  ('31313131-3131-4131-8131-313131313131','authenticated','authenticated','ml-attempt-a@example.test','',now(),'{}','{}',now(),now()),
  ('42424242-4242-4242-8242-424242424242','authenticated','authenticated','ml-attempt-b@example.test','',now(),'{}','{}',now(),now());

select set_config('test.ml_document', jsonb_build_object(
  'assumptions', '10M daily users',
  'design_notes', 'Candidate generation then ranking.',
  'completed_decide_sections', jsonb_build_array('define','establish'),
  'hints_used', 1,
  'self_review', jsonb_build_object('metrics','Strong'),
  'dimension_evidence', jsonb_build_object('metrics','Separates ranking quality from guardrails.'),
  'follow_up_actions', jsonb_build_array('Test long-tail recall'),
  'fresh_exposure', true
)::text, true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '31313131-3131-4131-8131-313131313131', true);
select set_config('test.ml_attempt', public.create_ml_design_attempt(
  'personalized-recommendation',1,'Recommendation rehearsal','timed',45,current_setting('test.ml_document')::jsonb
)::text, true);
select ok(current_setting('test.ml_attempt')::uuid is not null, 'User A creates a canonical private attempt');
select is((select mode from public.ml_design_attempts where id = current_setting('test.ml_attempt')::uuid), 'timed', 'practice mode persists');
select is((select document->>'fresh_exposure' from public.ml_design_attempts where id = current_setting('test.ml_attempt')::uuid), 'true', 'fresh exposure evidence persists');
select set_config('test.ml_revision', (select revision::text from public.ml_design_attempts where id = current_setting('test.ml_attempt')::uuid), true);
select results_eq(
  $$select status from public.save_ml_design_attempt(current_setting('test.ml_attempt')::uuid,current_setting('test.ml_revision')::bigint,'Recommendation review','review','timed',45,current_setting('test.ml_document')::jsonb)$$,
  $$values ('review'::text)$$,
  'an exact revision saves the structured attempt'
);
select is((select revision from public.ml_design_attempts where id = current_setting('test.ml_attempt')::uuid), 2::bigint, 'a successful save advances the revision exactly once');
select ok((select first_practiced_at is not null from public.ml_design_attempts where id = current_setting('test.ml_attempt')::uuid), 'review status records the first practice time');
select is_empty(
  $$select id from public.save_ml_design_attempt(current_setting('test.ml_attempt')::uuid,current_setting('test.ml_revision')::bigint,'Stale overwrite','practiced','guided',null,current_setting('test.ml_document')::jsonb)$$,
  'a stale save cannot overwrite the winning worksheet'
);
select throws_ok(
  $$select public.create_ml_design_attempt('personalized-recommendation',1,'Bad document','guided',null,'{}'::jsonb)$$,
  '23514', 'Invalid ML Design attempt document', 'unvalidated JSONB is rejected'
);
select throws_ok(
  $$select public.create_ml_design_attempt('invented-problem',1,'Fake problem','guided',null,current_setting('test.ml_document')::jsonb)$$,
  '23503', 'Unknown canonical ML Design problem version', 'fabricated problem versions are rejected'
);
select throws_ok(
  $$select public.create_ml_design_attempt('personalized-recommendation',1,'Bad timing','guided',45,current_setting('test.ml_document')::jsonb)$$,
  '23514', 'Invalid practice duration', 'guided attempts cannot forge a timed duration'
);
select set_config('test.ml_current_revision', (select revision::text from public.ml_design_attempts where id = current_setting('test.ml_attempt')::uuid), true);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '42424242-4242-4242-8242-424242424242', true);
select is((select count(*)::integer from public.ml_design_attempts), 0, 'User B cannot read User A attempts');
select is_empty(
  $$select id from public.save_ml_design_attempt(current_setting('test.ml_attempt')::uuid,current_setting('test.ml_current_revision')::bigint,'Foreign overwrite','review','timed',45,current_setting('test.ml_document')::jsonb)$$,
  'foreign and missing attempts are indistinguishable save conflicts'
);
select is_empty(
  $$select attempt_id from public.delete_ml_design_attempt_if_revision(current_setting('test.ml_attempt')::uuid,'personalized-recommendation',current_setting('test.ml_current_revision')::bigint)$$,
  'User B cannot delete User A attempt'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '31313131-3131-4131-8131-313131313131', true);
select is_empty(
  $$select attempt_id from public.delete_ml_design_attempt_if_revision(current_setting('test.ml_attempt')::uuid,'personalized-recommendation',current_setting('test.ml_revision')::bigint)$$,
  'a stale revision cannot delete newer saved work'
);
select results_eq(
  $$select attempt_id from public.delete_ml_design_attempt_if_revision(current_setting('test.ml_attempt')::uuid,'personalized-recommendation',current_setting('test.ml_current_revision')::bigint)$$,
  $$values (current_setting('test.ml_attempt')::uuid)$$,
  'User A deletes the attempt with the exact displayed revision'
);
select is((select count(*)::integer from public.ml_design_attempts), 0, 'successful deletion removes only the owned attempt');

select * from finish();
rollback;
