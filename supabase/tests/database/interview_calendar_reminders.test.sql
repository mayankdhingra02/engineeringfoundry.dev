begin;
create extension if not exists pgtap with schema extensions;
select plan(64);

select has_table('public', 'interview_reminder_preferences', 'preference table exists');
select has_table('public', 'interview_reminders', 'reminder table exists');
select has_table('public', 'interview_calendar_exports', 'export audit table exists');
select has_column('public', 'interview_rounds', 'calendar_revision', 'calendar revision exists');
select has_column('public', 'interview_rounds', 'reminder_schedule_revision', 'schedule revision exists');
select col_is_pk('public', 'interview_reminder_preferences', 'user_id', 'one preference per user');
select col_is_pk('public', 'interview_reminders', 'id', 'reminder id is primary key');
select has_index('public', 'interview_reminders', 'interview_reminders_due_email_idx', 'due claim index exists');
select has_index('public', 'interview_reminders', 'interview_reminders_user_round_idx', 'owner round index exists');
select has_index('public', 'interview_calendar_exports', 'interview_calendar_exports_user_round_idx', 'export index exists');
select ok((select relrowsecurity from pg_class where oid = 'public.interview_reminder_preferences'::regclass), 'preference RLS active');
select ok((select relrowsecurity from pg_class where oid = 'public.interview_reminders'::regclass), 'reminder RLS active');
select ok((select relrowsecurity from pg_class where oid = 'public.interview_calendar_exports'::regclass), 'export RLS active');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'interview_reminder_preferences'), 1, 'preference owner policy only');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'interview_reminders'), 1, 'reminder owner policy only');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'interview_calendar_exports'), 1, 'export owner policy only');
select has_function('public', 'is_valid_iana_timezone', array['text'], 'timezone validator exists');
select has_function('public', 'save_interview_reminder_preferences', array['text','boolean','boolean','boolean','boolean','boolean'], 'legacy preference RPC exists');
select has_function('public', 'save_interview_reminder_preferences_if_revision', array['boolean','timestamp with time zone','text','boolean','boolean','boolean','boolean','boolean'], 'revision-checked preference RPC exists');
select has_function('public', 'set_interview_reminder_preference_updated_at', array[]::text[], 'monotonic preference revision trigger exists');
select has_function('public', 'record_interview_calendar_export', array['uuid','text'], 'export RPC exists');
select has_function('public', 'claim_due_interview_reminders', array['integer','timestamp with time zone'], 'claim RPC exists');
select has_function('public', 'validate_interview_reminder_claim', array['uuid','uuid'], 'claim validation RPC exists');
select has_function('public', 'mark_interview_reminder_delivered', array['uuid','uuid','text'], 'delivery RPC exists');
select has_function('public', 'fail_interview_reminder_delivery', array['uuid','uuid','text','boolean'], 'failure RPC exists');
select ok(has_function_privilege('authenticated', 'public.save_interview_reminder_preferences(text,boolean,boolean,boolean,boolean,boolean)', 'execute'), 'authenticated retains fail-safe legacy preference RPC execute');
select ok(not has_function_privilege('anon', 'public.save_interview_reminder_preferences(text,boolean,boolean,boolean,boolean,boolean)', 'execute'), 'anonymous cannot execute the legacy preference RPC');
select ok(has_function_privilege('authenticated', 'public.save_interview_reminder_preferences_if_revision(boolean,timestamp with time zone,text,boolean,boolean,boolean,boolean,boolean)', 'execute'), 'authenticated can execute revision-checked preference saves');
select ok(not has_function_privilege('anon', 'public.save_interview_reminder_preferences_if_revision(boolean,timestamp with time zone,text,boolean,boolean,boolean,boolean,boolean)', 'execute'), 'anonymous cannot execute revision-checked preference saves');
select ok(not has_function_privilege('authenticated', 'public.set_interview_reminder_preference_updated_at()', 'execute'), 'clients cannot execute the preference revision trigger');
select is(
  (select prosecdef from pg_proc where oid = 'public.save_interview_reminder_preferences_if_revision(boolean,timestamp with time zone,text,boolean,boolean,boolean,boolean,boolean)'::regprocedure),
  true,
  'revision-checked preference RPC is security definer'
);
select ok(
  (select 'search_path=""' = any(proconfig) from pg_proc where oid = 'public.save_interview_reminder_preferences_if_revision(boolean,timestamp with time zone,text,boolean,boolean,boolean,boolean,boolean)'::regprocedure),
  'revision-checked preference RPC has an empty search path'
);
select is(
  (select provolatile from pg_proc where oid = 'public.save_interview_reminder_preferences_if_revision(boolean,timestamp with time zone,text,boolean,boolean,boolean,boolean,boolean)'::regprocedure),
  'v'::"char",
  'revision-checked preference RPC is volatile'
);
select is(
  pg_get_function_result('public.save_interview_reminder_preferences_if_revision(boolean,timestamp with time zone,text,boolean,boolean,boolean,boolean,boolean)'::regprocedure),
  'TABLE(updated_at timestamp with time zone)',
  'revision-checked preference RPC returns only the new revision'
);
select ok(has_function_privilege('authenticated', 'public.record_interview_calendar_export(uuid,text)', 'execute'), 'authenticated records export');
select ok(not has_function_privilege('authenticated', 'public.claim_due_interview_reminders(integer,timestamp with time zone)', 'execute'), 'authenticated cannot claim');
select ok(has_function_privilege('service_role', 'public.claim_due_interview_reminders(integer,timestamp with time zone)', 'execute'), 'service role can claim');
select ok(not has_table_privilege('anon', 'public.interview_reminders', 'select'), 'anonymous cannot read reminders');
select ok(not has_table_privilege('authenticated', 'public.interview_reminders', 'insert'), 'client cannot insert reminders');
select ok(not has_table_privilege('authenticated', 'public.interview_calendar_exports', 'update'), 'client cannot update exports');

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('85858585-8585-4858-8858-858585858581', 'authenticated', 'authenticated', 'reminder-cas-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('85858585-8585-4858-8858-858585858582', 'authenticated', 'authenticated', 'reminder-cas-b@example.test', '', now(), '{}', '{}', now(), now()),
  ('85858585-8585-4858-8858-858585858583', 'authenticated', 'authenticated', 'reminder-onboarding@example.test', '', now(), '{}', '{}', now(), now()),
  ('85858585-8585-4858-8858-858585858584', 'authenticated', 'authenticated', 'reminder-unverified@example.test', '', null, '{}', '{}', now(), now());

insert into public.applications (id, user_id, company_name, role_title, status)
values (
  '85858585-8585-4858-8858-858585858591',
  '85858585-8585-4858-8858-858585858581',
  'Reminder CAS Co',
  'Engineer',
  'Interviewing'
);

insert into public.interview_rounds (
  id, application_id, user_id, round_number, round_name, round_type,
  scheduled_at, duration_minutes, timezone, status
) values (
  '85858585-8585-4858-8858-858585858592',
  '85858585-8585-4858-8858-858585858591',
  '85858585-8585-4858-8858-858585858581',
  1, 'Reminder CAS panel', 'Coding',
  '2099-09-20T18:00:00Z', 60, 'America/Chicago', 'Scheduled'
);

create temporary table test_reminder_revisions (
  label text primary key,
  value timestamptz not null
) on commit drop;
grant select, insert on test_reminder_revisions to authenticated;

insert into test_reminder_revisions
select 'loaded', updated_at
from public.interview_reminder_preferences
where user_id = '85858585-8585-4858-8858-858585858581';

set local role authenticated;
select set_config('request.jwt.claim.sub', '85858585-8585-4858-8858-858585858581', true);

select throws_ok(
  $$select * from public.save_interview_reminder_preferences_if_revision(null,null,'UTC',true,true,true,true,false)$$,
  '23514',
  'Exactly one reminder preference revision state is required',
  'missing revision-state discriminator is rejected'
);
select throws_ok(
  $$select * from public.save_interview_reminder_preferences_if_revision(true,(select value from test_reminder_revisions where label = 'loaded'),'UTC',true,true,true,true,false)$$,
  '23514',
  'Exactly one reminder preference revision state is required',
  'absent state with a timestamp is rejected'
);
select throws_ok(
  $$select * from public.save_interview_reminder_preferences_if_revision(false,null,'UTC',true,true,true,true,false)$$,
  '23514',
  'Exactly one reminder preference revision state is required',
  'loaded state without a timestamp is rejected'
);
select throws_ok(
  $$select * from public.save_interview_reminder_preferences_if_revision(false,(select value from test_reminder_revisions where label = 'loaded'),'UTC',null,true,true,true,false)$$,
  '23502',
  'Reminder preference values are required',
  'null desired preference values are rejected'
);
select throws_ok(
  $$select * from public.save_interview_reminder_preferences_if_revision(false,(select value from test_reminder_revisions where label = 'loaded'),'Central Time',true,true,true,true,false)$$,
  '23514',
  'Invalid IANA timezone',
  'invalid timezones are rejected before mutation'
);
select throws_ok(
  $$select public.save_interview_reminder_preferences('UTC',true,true,true,true,false)$$,
  '0A000',
  'Revision-checked reminder preference saving is required',
  'legacy full-snapshot preference writes fail closed'
);

insert into test_reminder_revisions
select 'saved-1', updated_at
from public.save_interview_reminder_preferences_if_revision(
  false,
  (select value from test_reminder_revisions where label = 'loaded'),
  'America/Chicago', true, true, true, false, false
);

select ok(
  (select value from test_reminder_revisions where label = 'saved-1')
    > (select value from test_reminder_revisions where label = 'loaded'),
  'a successful preference save advances the revision monotonically'
);
select is(
  (select row(preferred_timezone,in_app_enabled,prep_3_days_enabled,interview_1_day_enabled,interview_1_hour_enabled,email_enabled)::text
   from public.interview_reminder_preferences
   where user_id = '85858585-8585-4858-8858-858585858581'),
  '(America/Chicago,t,t,t,f,f)',
  'a confirmed save stores one complete desired preference snapshot'
);
select is(
  (select count(*)::integer
   from public.interview_reminders
   where round_id = '85858585-8585-4858-8858-858585858592'
     and status = 'pending'),
  2,
  'successful preference saving resynchronizes future reminder rows atomically'
);

reset role;
create function pg_temp.reject_reminder_resync()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Forced reminder resync failure';
end;
$$;
create trigger test_reject_reminder_resync
before insert or update on public.interview_reminders
for each row execute function pg_temp.reject_reminder_resync();
set local role authenticated;
select set_config('request.jwt.claim.sub', '85858585-8585-4858-8858-858585858581', true);

select throws_ok(
  $$select * from public.save_interview_reminder_preferences_if_revision(false,(select value from test_reminder_revisions where label = 'saved-1'),'UTC',false,false,false,false,false)$$,
  'P0001',
  'Forced reminder resync failure',
  'a reminder resync failure rolls the preference snapshot back'
);

reset role;
drop trigger test_reject_reminder_resync on public.interview_reminders;
set local role authenticated;
select set_config('request.jwt.claim.sub', '85858585-8585-4858-8858-858585858581', true);

select is(
  (select row(preferred_timezone,in_app_enabled,prep_3_days_enabled,interview_1_day_enabled,interview_1_hour_enabled,email_enabled,updated_at)::text
   from public.interview_reminder_preferences
   where user_id = '85858585-8585-4858-8858-858585858581'),
  (select row('America/Chicago',true,true,true,false,false,value)::text from test_reminder_revisions where label = 'saved-1'),
  'a failed reminder resync leaves the complete preference snapshot and revision unchanged'
);
select is(
  (select count(*)::integer
   from public.save_interview_reminder_preferences_if_revision(
     false,
     (select value from test_reminder_revisions where label = 'loaded'),
     'UTC', false, false, false, false, false
   )),
  0,
  'a stale preference revision returns zero rows'
);
select is(
  (select row(preferred_timezone,in_app_enabled,prep_3_days_enabled,interview_1_day_enabled,interview_1_hour_enabled,email_enabled,updated_at)::text
   from public.interview_reminder_preferences
   where user_id = '85858585-8585-4858-8858-858585858581'),
  (select row('America/Chicago',true,true,true,false,false,value)::text from test_reminder_revisions where label = 'saved-1'),
  'a stale preference save leaves the complete stored snapshot and revision unchanged'
);
select is(
  (select count(*)::integer
   from public.interview_reminders
   where round_id = '85858585-8585-4858-8858-858585858592'
     and status = 'pending'),
  2,
  'a stale preference save does not resynchronize or cancel reminder rows'
);
select is(
  (select count(*)::integer
   from public.save_interview_reminder_preferences_if_revision(
     true, null, 'UTC', true, true, true, true, false
   )),
  0,
  'an absent expectation conflicts with an existing preference row'
);

reset role;
delete from public.interview_reminder_preferences
where user_id = '85858585-8585-4858-8858-858585858582';
set local role authenticated;
select set_config('request.jwt.claim.sub', '85858585-8585-4858-8858-858585858582', true);

select is(
  (select count(*)::integer
   from public.save_interview_reminder_preferences_if_revision(
     true, null, 'Europe/Berlin', false, true, false, true, false
   )),
  1,
  'an exact absent expectation inserts the owner preference once'
);
select is(
  (select count(*)::integer
   from public.save_interview_reminder_preferences_if_revision(
     true, null, 'UTC', true, true, true, true, false
   )),
  0,
  'a repeated stale absent expectation returns zero rows'
);
select is(
  (select row(preferred_timezone,in_app_enabled,prep_3_days_enabled,interview_1_day_enabled,interview_1_hour_enabled,email_enabled)::text
   from public.interview_reminder_preferences
   where user_id = '85858585-8585-4858-8858-858585858582'),
  '(Europe/Berlin,f,t,f,t,f)',
  'a stale absent retry cannot overwrite the inserted preference snapshot'
);
select is(
  (select count(*)::integer
   from public.interview_reminder_preferences
   where user_id = '85858585-8585-4858-8858-858585858581'),
  0,
  'owner-scoped reads do not expose another user preference row'
);

select set_config('request.jwt.claim.sub', '85858585-8585-4858-8858-858585858584', true);
select throws_ok(
  $$select * from public.save_interview_reminder_preferences_if_revision(false,(select updated_at from public.interview_reminder_preferences where user_id = auth.uid()),'UTC',true,true,true,true,true)$$,
  '23514',
  'Verified account email required',
  'email reminders require a verified owner email'
);

select set_config('request.jwt.claim.sub', '85858585-8585-4858-8858-858585858583', true);
select lives_ok(
  $$select public.complete_account_onboarding('sde2','dsa','America/Chicago')$$,
  'first onboarding completion remains compatible'
);
select lives_ok(
  $$select public.complete_account_onboarding('staff','system_design','Europe/Berlin')$$,
  'repeated onboarding completion is an idempotent success'
);
select is(
  (select preferred_timezone
   from public.interview_reminder_preferences
   where user_id = '85858585-8585-4858-8858-858585858583'),
  'America/Chicago',
  'a stale repeated onboarding call cannot overwrite reminder timezone'
);
select is(
  (select row(preferred_role_level,primary_preparation_focus,dsa_level)::text
   from public.user_preparation_preferences
   where user_id = '85858585-8585-4858-8858-858585858583'),
  '(sde2,dsa,sde2)',
  'a stale repeated onboarding call cannot overwrite preparation preferences'
);

select * from finish();
rollback;
