begin;

-- ML Design and public Behavioral prompts have no private notes here. This is
-- intentionally only a bounded record of user-reported preparation activity.
create table public.preparation_track_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  track text not null,
  item_id text not null,
  status text not null,
  completed_at timestamptz,
  last_interacted_at timestamptz not null default statement_timestamp(),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  primary key (user_id, track, item_id),
  constraint preparation_track_progress_track check (track in ('ml-design', 'behavioral')),
  constraint preparation_track_progress_item_id check (item_id ~ '^[a-z0-9][a-z0-9:_-]{0,199}$'),
  constraint preparation_track_progress_status check (status in ('in-progress', 'completed')),
  constraint preparation_track_progress_completion check (
    (status = 'completed' and completed_at is not null)
    or (status = 'in-progress' and completed_at is null)
  )
);

create index preparation_track_progress_user_recent_idx
  on public.preparation_track_progress (user_id, last_interacted_at desc);

create trigger preparation_track_progress_set_updated_at
before update on public.preparation_track_progress
for each row execute function public.set_updated_at();

alter table public.preparation_track_progress enable row level security;

create policy "Owners can read preparation track progress"
on public.preparation_track_progress for select to authenticated
using ((select auth.uid()) = user_id);

-- Writes pass through the function below. This prevents a client from forging
-- another user's identifier and keeps the only writable fields bounded.
create or replace function public.save_preparation_track_progress(
  target_track text,
  target_item_id text,
  target_status text
)
returns setof public.preparation_track_progress
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  activity_time timestamptz := statement_timestamp();
begin
  if current_user_id is null
    or target_track not in ('ml-design', 'behavioral')
    or target_status not in ('in-progress', 'completed')
    or target_item_id !~ '^[a-z0-9][a-z0-9:_-]{0,199}$' then
    return;
  end if;

  return query
  insert into public.preparation_track_progress (
    user_id, track, item_id, status, completed_at, last_interacted_at
  ) values (
    current_user_id,
    target_track,
    target_item_id,
    target_status,
    case when target_status = 'completed' then activity_time else null end,
    activity_time
  )
  on conflict (user_id, track, item_id) do update set
    status = excluded.status,
    completed_at = excluded.completed_at,
    last_interacted_at = excluded.last_interacted_at
  returning public.preparation_track_progress.*;
end;
$$;

revoke all on table public.preparation_track_progress from anon, authenticated;
revoke all on function public.save_preparation_track_progress(text, text, text) from public;
grant select on table public.preparation_track_progress to authenticated;
grant execute on function public.save_preparation_track_progress(text, text, text) to authenticated;

commit;
