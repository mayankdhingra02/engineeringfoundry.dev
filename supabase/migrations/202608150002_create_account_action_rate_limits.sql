begin;

-- Phase 9. Server-authoritative throttling for expensive account-owned actions.
--
-- The Phase 8 export throttle lived in a client-controlled cookie, so deleting
-- the cookie removed the limit. Throttle identity must come from the same
-- authenticated actor that owns the data, and the state must survive the
-- browser. This table is that state; the RPC below is its only writer.
--
-- Scope is deliberately narrow. Supabase Auth already rate limits sign-in,
-- sign-up, and recovery; duplicating that here would be redundant and would
-- risk locking users out of authentication we do not own. This covers only
-- operations Engineering Foundry itself makes expensive.

create table public.account_action_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0,
  last_request_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, action),
  constraint account_action_rate_limits_action check (action in ('account_export')),
  constraint account_action_rate_limits_count_bounded check (request_count >= 0 and request_count <= 10000)
);

comment on table public.account_action_rate_limits is
  'Owner-scoped rate-limit state for expensive account actions. Written only by consume_account_action_rate_limit.';

alter table public.account_action_rate_limits enable row level security;

-- Owners may read their own throttle state so the product can explain a limit.
-- Nobody may write it directly; the actor-derived RPC is the only writer.
create policy "Users read their own rate limit state"
  on public.account_action_rate_limits
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.account_action_rate_limits from anon, authenticated;
grant select on table public.account_action_rate_limits to authenticated;

/**
 * Atomically consumes one unit of an action's rate budget for the calling user.
 *
 * Ownership comes from auth.uid() only; there is no user parameter, so a client
 * cannot select another account's budget. The row lock serializes concurrent
 * callers, so parallel requests cannot race past the limit.
 *
 * Returns the decision plus the seconds remaining in the current window.
 */
create or replace function public.consume_account_action_rate_limit(
  action_key text,
  max_requests integer,
  window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer, remaining integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  now_ts timestamptz := transaction_timestamp();
  window_interval interval;
  state public.account_action_rate_limits%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if action_key is null or action_key not in ('account_export') then
    raise exception 'Unknown rate limited action' using errcode = '22023';
  end if;
  if max_requests is null or max_requests < 1 or max_requests > 1000 then
    raise exception 'Invalid rate limit maximum' using errcode = '22023';
  end if;
  if window_seconds is null or window_seconds < 1 or window_seconds > 86400 then
    raise exception 'Invalid rate limit window' using errcode = '22023';
  end if;

  window_interval := make_interval(secs => window_seconds);

  insert into public.account_action_rate_limits as limits (user_id, action, window_started_at, request_count, last_request_at)
  values (current_user_id, action_key, now_ts, 0, now_ts)
  on conflict (user_id, action) do nothing;

  -- Lock the owner's row. Concurrent requests for the same action wait here, so
  -- two simultaneous exports cannot both read a stale count.
  select * into state
  from public.account_action_rate_limits
  where user_id = current_user_id and action = action_key
  for update;

  -- An elapsed window starts fresh.
  if state.window_started_at <= now_ts - window_interval then
    state.window_started_at := now_ts;
    state.request_count := 0;
  end if;

  if state.request_count >= max_requests then
    -- Already over budget. Record the attempt time but do not extend the window
    -- or inflate the count; being throttled should not deepen the penalty.
    update public.account_action_rate_limits
    set window_started_at = state.window_started_at,
        request_count = state.request_count,
        last_request_at = now_ts
    where user_id = current_user_id and action = action_key;

    return query select
      false,
      greatest(1, ceil(extract(epoch from (state.window_started_at + window_interval - now_ts)))::integer),
      0;
    return;
  end if;

  update public.account_action_rate_limits
  set window_started_at = state.window_started_at,
      request_count = state.request_count + 1,
      last_request_at = now_ts
  where user_id = current_user_id and action = action_key;

  return query select true, 0, max_requests - (state.request_count + 1);
end;
$$;

revoke all on function public.consume_account_action_rate_limit(text, integer, integer) from public;
grant execute on function public.consume_account_action_rate_limit(text, integer, integer) to authenticated;

commit;
