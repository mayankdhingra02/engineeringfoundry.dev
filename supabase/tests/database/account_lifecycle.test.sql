begin;

create extension if not exists pgtap with schema extensions;
select plan(61);

select has_column('public', 'profiles', 'onboarding_completed_at', 'profiles store an explicit onboarding completion timestamp');
select has_column('public', 'user_preparation_preferences', 'preferred_role_level', 'preparation preferences store preferred role level');
select has_column('public', 'user_preparation_preferences', 'primary_preparation_focus', 'preparation preferences store primary focus');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'onboarding_complete', 'update'), 'clients cannot forge onboarding completion');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'onboarding_completed_at', 'update'), 'clients cannot forge onboarding completion time');
select ok(has_function_privilege('authenticated', 'public.complete_account_onboarding(text,text,text)', 'execute'), 'authenticated users can invoke actor-derived onboarding');
select ok(not has_function_privilege('anon', 'public.complete_account_onboarding(text,text,text)', 'execute'), 'anonymous users cannot invoke onboarding');
select ok(has_function_privilege('authenticated', 'public.save_account_preparation_preferences(text,text,text)', 'execute'), 'authenticated users can save actor-derived preparation preferences');
select ok(not has_function_privilege('anon', 'public.save_account_preparation_preferences(text,text,text)', 'execute'), 'anonymous users cannot save preparation preferences');
select has_function(
  'public',
  'save_account_preparation_preferences_if_revision',
  array['boolean', 'timestamp with time zone', 'text', 'text', 'text'],
  'revision-checked preparation preference saving exists'
);
select ok(has_function_privilege('authenticated', 'public.save_account_preparation_preferences_if_revision(boolean,timestamp with time zone,text,text,text)', 'execute'), 'authenticated users can invoke revision-checked preparation preference saving');
select ok(not has_function_privilege('anon', 'public.save_account_preparation_preferences_if_revision(boolean,timestamp with time zone,text,text,text)', 'execute'), 'anonymous users cannot invoke revision-checked preparation preference saving');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('81818181-8181-4818-8818-818181818181', 'authenticated', 'authenticated', 'account-lifecycle-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('82828282-8282-4828-8828-828282828282', 'authenticated', 'authenticated', 'account-lifecycle-b@example.test', '', now(), '{}', '{}', now(), now()),
  ('83838383-8383-4838-8838-838383838383', 'authenticated', 'authenticated', 'account-lifecycle-delete@example.test', '', now(), '{}', '{}', now(), now());

select is((select onboarding_complete from public.profiles where id = '81818181-8181-4818-8818-818181818181'), false, 'a genuinely new profile starts incomplete');
select is((select onboarding_completed_at from public.profiles where id = '81818181-8181-4818-8818-818181818181'), null, 'a genuinely new profile has no completion timestamp');

set local role authenticated;
select set_config('request.jwt.claim.sub', '81818181-8181-4818-8818-818181818181', true);

select lives_ok(
  $$select public.complete_account_onboarding('sde2', 'dsa', 'America/Chicago')$$,
  'owner can complete onboarding with useful preferences'
);
select is((select onboarding_complete from public.profiles), true, 'onboarding completion persists on the owned profile');
select ok((select onboarding_completed_at is not null from public.profiles), 'onboarding completion persists an explicit timestamp');
select is((select preferred_role_level from public.user_preparation_preferences), 'sde2', 'preferred role persists');
select is((select primary_preparation_focus from public.user_preparation_preferences), 'dsa', 'preparation focus persists');
select is((select dsa_level from public.user_preparation_preferences), 'sde2', 'onboarding suggests the matching DSA roadmap when no explicit roadmap exists');
select is((select preferred_timezone from public.interview_reminder_preferences), 'America/Chicago', 'onboarding reuses the Phase 7 timezone preference');

update public.user_preparation_preferences set dsa_level = 'sde1';
select public.complete_account_onboarding('senior', 'system_design', 'America/New_York');
select is((select dsa_level from public.user_preparation_preferences), 'sde1', 'onboarding never overwrites an explicit DSA roadmap');

select set_config('request.jwt.claim.sub', '82828282-8282-4828-8828-828282828282', true);
select lives_ok(
  $$select public.complete_account_onboarding(null, null, null)$$,
  'skip completes onboarding without inventing preferences'
);
select is((select onboarding_complete from public.profiles), true, 'skipped onboarding still persists explicit completion');
select is((select count(*)::integer from public.user_preparation_preferences), 0, 'skip creates no inferred preparation preference row');
select is((
  select count(*)::integer
  from public.save_account_preparation_preferences_if_revision(
    true, null, 'staff', 'behavioral', 'sde3plus'
  )
), 1, 'revision-checked settings create returns one saved revision');
select is((select preferred_role_level from public.user_preparation_preferences), 'staff', 'settings persist preferred role for the current actor');
select is((select primary_preparation_focus from public.user_preparation_preferences), 'behavioral', 'settings persist primary focus for the current actor');
select is((select dsa_level from public.user_preparation_preferences), 'sde3plus', 'settings persist an explicit preferred DSA roadmap');
select is((
  select count(*)::integer
  from public.save_account_preparation_preferences_if_revision(
    false, '2000-01-01T00:00:00Z', 'sde1', 'dsa', 'sde1'
  )
), 0, 'a stale preparation preference revision returns no saved row');
select is(
  (select row(preferred_role_level, primary_preparation_focus, dsa_level)::text from public.user_preparation_preferences),
  '(staff,behavioral,sde3plus)',
  'a stale preparation preference save changes no desired field'
);
with prior as materialized (
  select updated_at from public.user_preparation_preferences
), saved as materialized (
  select updated_at
  from public.save_account_preparation_preferences_if_revision(
    false,
    (select updated_at from prior),
    'senior',
    'system_design',
    'sde2'
  )
)
select ok(
  (select count(*) = 1 from saved)
    and (select saved.updated_at > prior.updated_at from saved cross join prior),
  'an exact preparation preference revision saves once and advances monotonically'
);
select throws_ok(
  $$select public.save_account_preparation_preferences('sde1', 'dsa', 'sde1')$$,
  '0A000',
  'Revision-checked preparation preference saving is required',
  'legacy preparation preference snapshot saving fails safely'
);
select is(
  (select row(preferred_role_level, primary_preparation_focus, dsa_level)::text from public.user_preparation_preferences),
  '(senior,system_design,sde2)',
  'legacy preparation preference saving leaves the revision-checked snapshot unchanged'
);
select throws_ok(
  $$select public.save_account_preparation_preferences_if_revision(false, null, 'senior', 'system_design', 'sde2')$$,
  '23514',
  'Exactly one preparation preference revision state is required',
  'preference saving requires one correlated revision state'
);
select throws_ok(
  $$update public.profiles set display_name = 'Unauthorized' where id = '81818181-8181-4818-8818-818181818181' returning id$$,
  '42501'
);
select is((select count(*)::integer from public.user_preparation_preferences), 1, 'User B cannot read User A preferences');
select throws_ok(
  $$select public.save_account_preparation_preferences_if_revision(false, (select updated_at from public.user_preparation_preferences), 'invalid', 'dsa', 'sde1')$$,
  '22023',
  'Invalid preferred role level',
  'preference RPC rejects values outside the shared taxonomy'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '83838383-8383-4838-8838-838383838383', true);
select public.complete_account_onboarding('sde2', 'applications', 'America/Chicago');

reset role;

insert into public.applications (id, user_id, company_name, role_title, status)
values ('83838383-8383-4838-8838-838383838301', '83838383-8383-4838-8838-838383838383', 'Disposable Co', 'SDE II', 'Interviewing');
insert into public.interview_rounds (id, application_id, user_id, round_number, round_name, round_type, scheduled_at, timezone, status)
values ('83838383-8383-4838-8838-838383838302', '83838383-8383-4838-8838-838383838301', '83838383-8383-4838-8838-838383838383', 1, 'Technical screen', 'Coding', '2099-09-01T18:00:00Z', 'America/Chicago', 'Scheduled');
select public.save_interview_preparation_notes_if_revision('83838383-8383-4838-8838-838383838302', true, null, 'Private preparation note');
select public.set_interview_preparation_checklist_item('83838383-8383-4838-8838-838383838302', 'dsa-review-queue', true);
select public.add_interview_preparation_task('83838383-8383-4838-8838-838383838302', 'Review two sum');

select public.save_behavioral_custom_question_if_revision(
  '83838383-8383-4838-8838-838383838303',
  true,
  null,
  'Tell me about a disposable lifecycle test?',
  null,
  'Other',
  null,
  null
);
insert into public.behavioral_stories (id, user_id, title, situation)
values ('83838383-8383-4838-8838-838383838304', '83838383-8383-4838-8838-838383838383', 'Disposable story', 'Private situation');
insert into public.behavioral_story_themes (id, user_id, story_id, theme)
values ('83838383-8383-4838-8838-838383838305', '83838383-8383-4838-8838-838383838383', '83838383-8383-4838-8838-838383838304', 'Ownership');
insert into public.behavioral_story_question_links (id, user_id, story_id, custom_question_id)
values ('83838383-8383-4838-8838-838383838306', '83838383-8383-4838-8838-838383838383', '83838383-8383-4838-8838-838383838304', '83838383-8383-4838-8838-838383838303');
insert into public.behavioral_answers (id, user_id, custom_question_id, story_id, application_id, title, answer_text)
values ('83838383-8383-4838-8838-838383838307', '83838383-8383-4838-8838-838383838383', '83838383-8383-4838-8838-838383838303', '83838383-8383-4838-8838-838383838304', '83838383-8383-4838-8838-838383838301', 'Disposable answer', 'Private rehearsal');
insert into public.behavioral_saved_questions (id, user_id, custom_question_id)
values ('83838383-8383-4838-8838-838383838308', '83838383-8383-4838-8838-838383838383', '83838383-8383-4838-8838-838383838303');

insert into public.dsa_progress (user_id, item_kind, item_id, status)
values ('83838383-8383-4838-8838-838383838383', 'problem', 'two-sum', 'attempted');
insert into public.dsa_question_progress (user_id, question_id, status, notes, first_attempted_at, last_practiced_at)
values ('83838383-8383-4838-8838-838383838383', 'two-sum', 'attempted', 'Private DSA note', now(), now());
insert into public.system_design_progress (user_id, item_kind, item_id, status)
values ('83838383-8383-4838-8838-838383838383', 'topic', 'introduction', 'in-progress');
insert into public.system_design_item_progress (user_id, item_id, item_type, status, notes, first_reviewed_at)
values ('83838383-8383-4838-8838-838383838383', 'introduction', 'concept', 'reviewed', 'Private design note', now());
insert into public.system_design_attempts (id, user_id, problem_id, application_id, title, document)
values (
  '83838383-8383-4838-8838-838383838309',
  '83838383-8383-4838-8838-838383838383',
  'url-shortener',
  '83838383-8383-4838-8838-838383838301',
  'Disposable design attempt',
  '{"functional_requirements":[],"non_functional_requirements":[],"capacity":{"assumptions":[],"calculations":[]},"apis":[],"data_models":[],"high_level_design":"Private design","deep_dives":[],"bottlenecks":[],"failure_modes":[],"tradeoffs":[],"follow_ups":[],"final_review_notes":""}'::jsonb
);
insert into public.preparation_track_progress (user_id, track, item_id, status, completed_at)
values ('83838383-8383-4838-8838-838383838383', 'ml-design', 'ml-problem-recommendation', 'completed', now());
select public.record_interview_calendar_export('83838383-8383-4838-8838-838383838302', 'ics');

select ok((select count(*) > 0 from public.interview_reminders), 'disposable account has pending reminder jobs before deletion');

reset role;
delete from auth.users where id = '83838383-8383-4838-8838-838383838383';

select is((select count(*)::integer from auth.users where id = '83838383-8383-4838-8838-838383838383'), 0, 'Auth identity is removed');
select is((select count(*)::integer from public.profiles where id = '83838383-8383-4838-8838-838383838383'), 0, 'profile cascades');
select is((select count(*)::integer from public.applications where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'applications cascade');
select is((select count(*)::integer from public.interview_rounds where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'interview rounds cascade');
select is((select count(*)::integer from public.interview_preparations where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'interview preparation cascades');
select is((select count(*)::integer from public.interview_preparation_custom_tasks where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'preparation tasks cascade');
select is((select count(*)::integer from public.behavioral_custom_questions where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'custom behavioral questions cascade');
select is((select count(*)::integer from public.behavioral_stories where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'behavioral stories cascade');
select is((select count(*)::integer from public.behavioral_story_themes where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'behavioral story themes cascade');
select is((select count(*)::integer from public.behavioral_story_question_links where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'behavioral links cascade');
select is((select count(*)::integer from public.behavioral_answers where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'behavioral answers cascade');
select is((select count(*)::integer from public.behavioral_saved_questions where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'saved behavioral questions cascade');
select is((select count(*)::integer from public.user_preparation_preferences where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'preparation preferences cascade');
select is((select count(*)::integer from public.dsa_progress where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'legacy DSA progress cascades');
select is((select count(*)::integer from public.dsa_question_progress where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'DSA question progress and notes cascade');
select is((select count(*)::integer from public.system_design_progress where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'legacy System Design progress cascades');
select is((select count(*)::integer from public.system_design_item_progress where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'System Design item progress and notes cascade');
select is((select count(*)::integer from public.system_design_attempts where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'System Design attempts cascade');
select is((select count(*)::integer from public.preparation_track_progress where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'ML and Behavioral preparation activity cascades');
select is((select count(*)::integer from public.interview_reminder_preferences where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'reminder preferences cascade');
select is((select count(*)::integer from public.interview_reminders where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'pending reminder jobs cascade');
select is((select count(*)::integer from public.interview_calendar_exports where user_id = '83838383-8383-4838-8838-838383838383'), 0, 'calendar export audit rows cascade');

select * from finish();
rollback;
