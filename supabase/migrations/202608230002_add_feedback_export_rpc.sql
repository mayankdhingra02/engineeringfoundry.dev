begin;

-- Feedback remains unreadable through the table to normal members. Account
-- export needs the sender's own immutable submission history, so expose only
-- that bounded projection through an actor-derived RPC.
create or replace function public.export_own_feedback_submissions()
returns table (
  reference_id text,
  category text,
  message text,
  page_context text,
  contact_email text,
  contact_consent boolean,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  return query
    select f.reference_id, f.category, f.message, f.page_context, f.contact_email, f.contact_consent, f.status, f.created_at, f.updated_at
    from public.feedback_submissions f
    where f.actor_id = current_user_id
    order by f.created_at, f.id;
end;
$$;

revoke all on function public.export_own_feedback_submissions() from public;
grant execute on function public.export_own_feedback_submissions() to authenticated;

commit;
