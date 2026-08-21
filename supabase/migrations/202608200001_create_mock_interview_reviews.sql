begin;

create table public.mock_interview_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  track text not null check (track in ('dsa','system-design','ml-design','behavioral')),
  practice_mode text not null check (practice_mode in ('solo','peer')),
  plan_id text not null, prompt_id text not null, rubric_id text not null,
  started_at timestamptz not null default now(), reviewed_at timestamptz,
  elapsed_seconds integer check (elapsed_seconds is null or elapsed_seconds >= 0),
  strength text, improvement text, follow_up_practice text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (strength is null or char_length(strength) <= 5000), check (improvement is null or char_length(improvement) <= 5000), check (follow_up_practice is null or char_length(follow_up_practice) <= 5000)
);
create table public.mock_interview_rubric_ratings (
  session_id uuid not null references public.mock_interview_sessions(id) on delete cascade,
  dimension_id text not null, rating text not null check (rating in ('Strong','Developing','Needs attention')),
  primary key (session_id, dimension_id)
);
create trigger mock_interview_sessions_updated before update on public.mock_interview_sessions for each row execute function public.set_updated_at();
alter table public.mock_interview_sessions enable row level security;
alter table public.mock_interview_rubric_ratings enable row level security;
create policy "Owners read mock sessions" on public.mock_interview_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners read mock ratings" on public.mock_interview_rubric_ratings for select to authenticated using (exists (select 1 from public.mock_interview_sessions s where s.id = session_id and s.user_id = (select auth.uid())));

create or replace function public.save_mock_interview_review(target_session_id uuid, target_track text, target_mode text, target_plan_id text, target_prompt_id text, target_rubric_id text, target_started_at timestamptz, target_elapsed_seconds integer, target_strength text, target_improvement text, target_follow_up_practice text, target_ratings jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); saved_id uuid;
begin
 if current_user_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
 if target_track not in ('dsa','system-design','ml-design','behavioral') then raise exception 'Invalid mock track' using errcode='23514'; end if;
 if target_mode not in ('solo','peer') then raise exception 'Invalid mock mode' using errcode='23514'; end if;
 if target_rubric_id not in ('rubric-dsa','rubric-system-design','rubric-ml-design','rubric-behavioral') then raise exception 'Invalid mock rubric' using errcode='23514'; end if;
 if jsonb_typeof(target_ratings) <> 'array' or jsonb_array_length(target_ratings) = 0 then raise exception 'At least one rubric rating is required' using errcode='23514'; end if;
 insert into public.mock_interview_sessions (id,user_id,track,practice_mode,plan_id,prompt_id,rubric_id,started_at,reviewed_at,elapsed_seconds,strength,improvement,follow_up_practice)
 values (target_session_id,current_user_id,target_track,target_mode,target_plan_id,target_prompt_id,target_rubric_id,target_started_at,transaction_timestamp(),target_elapsed_seconds,target_strength,target_improvement,target_follow_up_practice)
 on conflict (id) do update set track=excluded.track,practice_mode=excluded.practice_mode,plan_id=excluded.plan_id,prompt_id=excluded.prompt_id,rubric_id=excluded.rubric_id,reviewed_at=excluded.reviewed_at,elapsed_seconds=excluded.elapsed_seconds,strength=excluded.strength,improvement=excluded.improvement,follow_up_practice=excluded.follow_up_practice where public.mock_interview_sessions.user_id=current_user_id returning id into saved_id;
 if saved_id is null then raise exception 'Mock session is not available' using errcode='42501'; end if;
 if exists (select 1 from jsonb_array_elements(target_ratings) r where r->>'rating' not in ('Strong','Developing','Needs attention') or coalesce(r->>'dimension_id','') = '') then raise exception 'Invalid rubric rating' using errcode='23514'; end if;
 delete from public.mock_interview_rubric_ratings where session_id=saved_id;
 insert into public.mock_interview_rubric_ratings(session_id,dimension_id,rating) select saved_id,r->>'dimension_id',r->>'rating' from jsonb_array_elements(target_ratings) r;
 return saved_id;
end; $$;
revoke all on function public.save_mock_interview_review(uuid,text,text,text,text,text,timestamptz,integer,text,text,text,jsonb) from public;
grant execute on function public.save_mock_interview_review(uuid,text,text,text,text,text,timestamptz,integer,text,text,text,jsonb) to authenticated;
commit;
