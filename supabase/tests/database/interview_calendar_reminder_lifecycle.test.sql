begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('97979797-9797-4797-8797-979797979797', 'authenticated', 'authenticated', 'calendar-lifecycle@example.test', '', '2099-01-01T00:00:00Z', '{}', '{}', '2099-01-01T00:00:00Z', '2099-01-01T00:00:00Z');

insert into public.applications (id, user_id, company_name, role_title, status)
values ('97979797-9797-4797-8797-979797979701', '97979797-9797-4797-8797-979797979797', 'Calendar Lifecycle Co', 'SDE II', 'Interviewing');

insert into public.interview_rounds (
  id, application_id, user_id, round_number, round_name, round_type,
  scheduled_at, duration_minutes, timezone, status
) values (
  '97979797-9797-4797-8797-979797979702',
  '97979797-9797-4797-8797-979797979701',
  '97979797-9797-4797-8797-979797979797',
  1, 'System Design Panel', 'System Design',
  '2099-08-20T00:00:00Z', 60, 'America/Chicago', 'Scheduled'
);

select is((select count(*)::integer from public.interview_reminders where round_id = '97979797-9797-4797-8797-979797979702'), 3, 'future round schedules three sparse in-app reminders');
select is((select scheduled_for from public.interview_reminders where round_id = '97979797-9797-4797-8797-979797979702' and reminder_type = 'prep_3_days'), '2099-08-17T00:00:00Z'::timestamptz, 'preparation reminder is exactly three days before');
select is((select scheduled_for from public.interview_reminders where round_id = '97979797-9797-4797-8797-979797979702' and reminder_type = 'interview_1_day'), '2099-08-19T00:00:00Z'::timestamptz, 'day reminder is exactly one day before');
select is((select scheduled_for from public.interview_reminders where round_id = '97979797-9797-4797-8797-979797979702' and reminder_type = 'interview_1_hour'), '2099-08-19T23:00:00Z'::timestamptz, 'hour reminder is exactly one hour before');

select public.sync_interview_reminders_for_round('97979797-9797-4797-8797-979797979702', '2099-08-18T00:00:00Z');

select is((select status from public.interview_reminders where round_id = '97979797-9797-4797-8797-979797979702' and reminder_type = 'prep_3_days'), 'cancelled', 'an expired reminder window is suppressed rather than fired late');
select is((select count(*)::integer from public.interview_reminders where round_id = '97979797-9797-4797-8797-979797979702' and status = 'pending'), 2, 'only still-future reminder windows remain pending');
select is((select count(distinct (reminder_type, channel, schedule_revision))::integer from public.interview_reminders where round_id = '97979797-9797-4797-8797-979797979702'), 3, 'logical reminder keys remain duplicate-free');

update public.interview_rounds set status = 'Completed' where id = '97979797-9797-4797-8797-979797979702';
select is((select count(*)::integer from public.interview_reminders where round_id = '97979797-9797-4797-8797-979797979702' and status <> 'cancelled'), 0, 'completion suppresses every future reminder');

update public.interview_rounds
set status = 'Rescheduled', scheduled_at = '2099-08-23T00:00:00Z'
where id = '97979797-9797-4797-8797-979797979702';
select is((select reminder_schedule_revision from public.interview_rounds where id = '97979797-9797-4797-8797-979797979702'), 2, 'reschedule advances the durable schedule revision');
select is((select count(*)::integer from public.interview_reminders where round_id = '97979797-9797-4797-8797-979797979702' and schedule_revision = 1 and status = 'cancelled'), 3, 'reschedule preserves cancelled historical reminders');
select is((select count(*)::integer from public.interview_reminders where round_id = '97979797-9797-4797-8797-979797979702' and schedule_revision = 2 and status = 'pending'), 3, 'reschedule creates three new future reminders');

delete from public.interview_rounds where id = '97979797-9797-4797-8797-979797979702';
select is((select count(*)::integer from public.interview_reminders where round_id = '97979797-9797-4797-8797-979797979702'), 0, 'round deletion cascades reminder state');

select * from finish();
rollback;
