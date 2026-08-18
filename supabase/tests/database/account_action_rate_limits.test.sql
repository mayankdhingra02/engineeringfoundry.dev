begin;

create extension if not exists pgtap with schema extensions;
select plan(30);

-- Structure and privilege boundary -----------------------------------------
select has_table('public', 'account_action_rate_limits', 'rate-limit state is a real owner-scoped table');
select has_column('public', 'account_action_rate_limits', 'window_started_at', 'rate-limit state records its window start');
select has_column('public', 'account_action_rate_limits', 'request_count', 'rate-limit state records a request count');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.account_action_rate_limits'::regclass),
  'rate-limit state enforces row level security'
);

-- The client may read its own budget but must never write it directly; the
-- actor-derived RPC is the only writer.
select ok(has_table_privilege('authenticated', 'public.account_action_rate_limits', 'select'), 'owners can read their own throttle state');
select ok(not has_table_privilege('authenticated', 'public.account_action_rate_limits', 'insert'), 'clients cannot insert throttle state');
select ok(not has_table_privilege('authenticated', 'public.account_action_rate_limits', 'update'), 'clients cannot update throttle state');
select ok(not has_table_privilege('authenticated', 'public.account_action_rate_limits', 'delete'), 'clients cannot delete throttle state to reset a limit');
select ok(not has_table_privilege('anon', 'public.account_action_rate_limits', 'select'), 'anonymous clients cannot read throttle state');

select ok(has_function_privilege('authenticated', 'public.consume_account_action_rate_limit(text,integer,integer)', 'execute'), 'authenticated users can consume their own budget');
select ok(not has_function_privilege('anon', 'public.consume_account_action_rate_limit(text,integer,integer)', 'execute'), 'anonymous users cannot consume a budget');

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('91919191-9191-4919-8919-919191919191', 'authenticated', 'authenticated', 'rate-limit-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('92929292-9292-4929-8929-929292929292', 'authenticated', 'authenticated', 'rate-limit-b@example.test', '', now(), '{}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '91919191-9191-4919-8919-919191919191', true);

-- Budget consumption --------------------------------------------------------
select is((select allowed from public.consume_account_action_rate_limit('account_export', 3, 900)), true, 'the first request is allowed');
select is((select remaining from public.consume_account_action_rate_limit('account_export', 3, 900)), 1, 'remaining budget decreases');
select is((select allowed from public.consume_account_action_rate_limit('account_export', 3, 900)), true, 'the last request inside the budget is allowed');
select is((select allowed from public.consume_account_action_rate_limit('account_export', 3, 900)), false, 'the request past the budget is denied');
select ok((select retry_after_seconds > 0 from public.consume_account_action_rate_limit('account_export', 3, 900)), 'a denied request reports when to retry');

-- Being throttled must not deepen the penalty or extend the window.
select is((select request_count from public.account_action_rate_limits where user_id = '91919191-9191-4919-8919-919191919191'), 3, 'denied attempts do not inflate the counter');

-- Ownership -----------------------------------------------------------------
select is(
  (select count(*)::int from public.account_action_rate_limits),
  1,
  'a caller sees only their own throttle row'
);

select set_config('request.jwt.claim.sub', '92929292-9292-4929-8929-929292929292', true);
select is((select allowed from public.consume_account_action_rate_limit('account_export', 3, 900)), true, 'a second user has an independent budget');
select is(
  (select count(*)::int from public.account_action_rate_limits),
  1,
  'RLS hides another account''s throttle row'
);

-- A client cannot spend or clear another account's budget.
select is(
  (select count(*)::int from public.account_action_rate_limits where user_id = '91919191-9191-4919-8919-919191919191'),
  0,
  'a caller cannot read the other account''s throttle row'
);

-- Validation ----------------------------------------------------------------
select throws_ok(
  $$select public.consume_account_action_rate_limit('not_a_real_action', 3, 900)$$,
  '22023',
  'Unknown rate limited action',
  'an unrecognized action is rejected'
);
select throws_ok($$select public.consume_account_action_rate_limit('account_export', 0, 900)$$, '22023', 'Invalid rate limit maximum', 'a non-positive maximum is rejected');
select throws_ok($$select public.consume_account_action_rate_limit('account_export', 3, 0)$$, '22023', 'Invalid rate limit window', 'a non-positive window is rejected');
select throws_ok($$select public.consume_account_action_rate_limit('account_export', 3, 999999)$$, '22023', 'Invalid rate limit window', 'an unbounded window is rejected');

-- Clearing the subject claim is what makes auth.uid() null; resetting the role
-- alone leaves the previous caller's claim in place.
reset role;
select set_config('request.jwt.claim.sub', '', true);
select throws_ok(
  $$select public.consume_account_action_rate_limit('account_export', 3, 900)$$,
  '42501',
  'Authentication required',
  'an unauthenticated caller cannot consume a budget'
);

-- Window expiry -------------------------------------------------------------
-- Age the window past its horizon; the next request starts a fresh budget.
update public.account_action_rate_limits
set window_started_at = now() - interval '2 hours'
where user_id = '91919191-9191-4919-8919-919191919191';

set local role authenticated;
select set_config('request.jwt.claim.sub', '91919191-9191-4919-8919-919191919191', true);
select is((select allowed from public.consume_account_action_rate_limit('account_export', 3, 900)), true, 'an elapsed window starts a fresh budget');
select is((select request_count from public.account_action_rate_limits where user_id = '91919191-9191-4919-8919-919191919191'), 1, 'an elapsed window resets the counter');

-- Deletion cascade ----------------------------------------------------------
reset role;
delete from auth.users where id = '91919191-9191-4919-8919-919191919191';
select is(
  (select count(*)::int from public.account_action_rate_limits where user_id = '91919191-9191-4919-8919-919191919191'),
  0,
  'throttle state disappears when the account is deleted'
);
select is(
  (select count(*)::int from public.account_action_rate_limits where user_id = '92929292-9292-4929-8929-929292929292'),
  1,
  'deleting one account leaves the other account''s throttle state intact'
);

select * from finish();
rollback;
