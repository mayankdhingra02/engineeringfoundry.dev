begin;

-- Expand the user-correctable pipeline vocabulary without rewriting existing
-- records created by the earlier tracker migration.
alter table public.applications
  drop constraint applications_status,
  add constraint applications_status check (
    status in (
      'Wishlist',
      'Interested',
      'Applied',
      'Recruiter Screen',
      'Interviewing',
      'Offer',
      'Accepted',
      'Rejected',
      'Withdrawn',
      'Ghosted',
      'On Hold'
    )
  );

-- Dashboard scheduling reads should touch only future actionable rounds, not a
-- user's full interview history.
create index interview_rounds_user_upcoming_idx
  on public.interview_rounds (user_id, scheduled_at)
  where scheduled_at is not null
    and status in ('Planned', 'Scheduled', 'Rescheduled');

-- Serialize round-number allocation per application. The function derives the
-- owner from auth.uid(), locks the owned parent, and remains subject to RLS and
-- the composite (application_id, user_id) foreign key.
create or replace function public.create_interview_round(
  target_application_id uuid,
  round_name_value text,
  round_type_value text,
  scheduled_at_value timestamptz default null,
  duration_minutes_value integer default null,
  timezone_value text default null,
  interviewer_name_value text default null,
  interviewer_role_value text default null,
  meeting_link_value text default null,
  location_value text default null,
  status_value text default 'Planned',
  result_value text default 'Pending',
  notes_value text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  next_round_number integer;
  new_round_id uuid;
begin
  if current_user_id is null or target_application_id is null then
    return null;
  end if;

  perform 1
  from public.applications
  where id = target_application_id
    and user_id = current_user_id
  for update;

  if not found then
    return null;
  end if;

  select coalesce(max(round_number), 0) + 1
  into next_round_number
  from public.interview_rounds
  where application_id = target_application_id
    and user_id = current_user_id;

  insert into public.interview_rounds (
    application_id,
    user_id,
    round_number,
    round_name,
    round_type,
    scheduled_at,
    duration_minutes,
    timezone,
    interviewer_name,
    interviewer_role,
    meeting_link,
    location,
    status,
    result,
    notes
  )
  values (
    target_application_id,
    current_user_id,
    next_round_number,
    round_name_value,
    round_type_value,
    scheduled_at_value,
    duration_minutes_value,
    timezone_value,
    interviewer_name_value,
    interviewer_role_value,
    meeting_link_value,
    location_value,
    status_value,
    result_value,
    notes_value
  )
  returning id into new_round_id;

  return new_round_id;
end;
$$;

revoke all on function public.create_interview_round(uuid, text, text, timestamptz, integer, text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_interview_round(uuid, text, text, timestamptz, integer, text, text, text, text, text, text, text, text) to authenticated;

commit;
