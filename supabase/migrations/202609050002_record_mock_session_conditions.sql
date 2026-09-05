begin;

alter table public.mock_interview_sessions drop constraint mock_interview_sessions_track_check;
alter table public.mock_interview_sessions add constraint mock_interview_sessions_track_check check (track in ('dsa','system-design','low-level-design','ml-design','behavioral'));

alter table public.mock_interview_sessions
  add column prompt_exposure text not null default 'fresh'
    constraint mock_interview_sessions_prompt_exposure_check check (prompt_exposure in ('fresh','repeated')),
  add column timing_mode text not null default 'suggested'
    constraint mock_interview_sessions_timing_mode_check check (timing_mode in ('suggested','extended','untimed')),
  add column hint_policy text not null default 'on-request'
    constraint mock_interview_sessions_hint_policy_check check (hint_policy in ('none','on-request','guided')),
  add column assistance_state text not null default 'unassisted'
    constraint mock_interview_sessions_assistance_state_check check (assistance_state in ('unassisted','hint-used','redirection-used','hint-and-redirection')),
  add column session_outcome text not null default 'completed'
    constraint mock_interview_sessions_outcome_check check (session_outcome in ('completed','interrupted','technical-failure')),
  add column session_issue text
    constraint mock_interview_sessions_issue_length_check check (char_length(session_issue) <= 5000),
  add constraint mock_interview_sessions_issue_required_check
    check (session_outcome = 'completed' or nullif(btrim(session_issue), '') is not null);

revoke all on function public.save_mock_interview_review(uuid,text,text,text,text,text,timestamptz,integer,text,text,text,jsonb) from public;
drop function public.save_mock_interview_review(uuid,text,text,text,text,text,timestamptz,integer,text,text,text,jsonb);

create function public.save_mock_interview_review(
  target_session_id uuid,
  target_track text,
  target_mode text,
  target_plan_id text,
  target_prompt_id text,
  target_rubric_id text,
  target_started_at timestamptz,
  target_elapsed_seconds integer,
  target_prompt_exposure text,
  target_timing_mode text,
  target_hint_policy text,
  target_assistance_state text,
  target_session_outcome text,
  target_session_issue text,
  target_strength text,
  target_improvement text,
  target_follow_up_practice text,
  target_ratings jsonb
) returns uuid language plpgsql security definer set search_path='' as $$
declare
  uid uuid := auth.uid();
  existing public.mock_interview_sessions%rowtype;
  saved uuid;
  allowed text[];
begin
  if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if (target_track,target_rubric_id) not in (('dsa','rubric-dsa'),('system-design','rubric-system-design'),('low-level-design','rubric-low-level-design'),('ml-design','rubric-ml-design'),('behavioral','rubric-behavioral')) then raise exception 'Invalid mock rubric' using errcode='23514'; end if;
  if target_mode not in ('solo','peer') or target_prompt_exposure not in ('fresh','repeated') or target_timing_mode not in ('suggested','extended','untimed') or target_hint_policy not in ('none','on-request','guided') or target_assistance_state not in ('unassisted','hint-used','redirection-used','hint-and-redirection') or target_session_outcome not in ('completed','interrupted','technical-failure') or (target_session_outcome <> 'completed' and nullif(btrim(target_session_issue), '') is null) then raise exception 'Invalid mock session conditions' using errcode='23514'; end if;
  allowed:=case target_rubric_id when 'rubric-dsa' then array['clarification','approach','correctness','complexity','implementation','testing','communication'] when 'rubric-system-design' then array['requirements','decomposition','scalability','data','reliability','tradeoffs','communication'] when 'rubric-low-level-design' then array['clarification','modeling','responsibilities','contracts','invariants','evolution','tradeoffs','communication'] when 'rubric-ml-design' then array['product','metrics','data','model','serving','monitoring','tradeoffs','communication'] else array['relevance','context','ownership','actions','outcome','reflection','communication'] end;
  if jsonb_typeof(target_ratings)<>'array' or jsonb_array_length(target_ratings)=0 or exists(select 1 from jsonb_array_elements(target_ratings) r where r->>'dimension_id' is null or not (r->>'dimension_id'=any(allowed)) or r->>'rating' not in ('Strong','Developing','Needs attention')) or (select count(*) from jsonb_array_elements(target_ratings))<>(select count(distinct r->>'dimension_id') from jsonb_array_elements(target_ratings) r) then raise exception 'Invalid rubric ratings' using errcode='23514'; end if;
  select * into existing from public.mock_interview_sessions where id=target_session_id;
  if found and (existing.user_id<>uid or (existing.track,existing.practice_mode,existing.plan_id,existing.prompt_id,existing.rubric_id,existing.started_at,existing.prompt_exposure,existing.timing_mode,existing.hint_policy)<>(target_track,target_mode,target_plan_id,target_prompt_id,target_rubric_id,target_started_at,target_prompt_exposure,target_timing_mode,target_hint_policy)) then raise exception 'Mock session identity cannot change' using errcode='42501'; end if;
  insert into public.mock_interview_sessions(id,user_id,track,practice_mode,plan_id,prompt_id,rubric_id,started_at,reviewed_at,elapsed_seconds,prompt_exposure,timing_mode,hint_policy,assistance_state,session_outcome,session_issue,strength,improvement,follow_up_practice)
  values(target_session_id,uid,target_track,target_mode,target_plan_id,target_prompt_id,target_rubric_id,target_started_at,transaction_timestamp(),target_elapsed_seconds,target_prompt_exposure,target_timing_mode,target_hint_policy,target_assistance_state,target_session_outcome,nullif(btrim(target_session_issue),''),target_strength,target_improvement,target_follow_up_practice)
  on conflict(id) do update set reviewed_at=excluded.reviewed_at,elapsed_seconds=excluded.elapsed_seconds,assistance_state=excluded.assistance_state,session_outcome=excluded.session_outcome,session_issue=excluded.session_issue,strength=excluded.strength,improvement=excluded.improvement,follow_up_practice=excluded.follow_up_practice returning id into saved;
  delete from public.mock_interview_rubric_ratings where session_id=saved;
  insert into public.mock_interview_rubric_ratings select saved,r->>'dimension_id',r->>'rating' from jsonb_array_elements(target_ratings) r;
  return saved;
end $$;

revoke all on function public.save_mock_interview_review(uuid,text,text,text,text,text,timestamptz,integer,text,text,text,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.save_mock_interview_review(uuid,text,text,text,text,text,timestamptz,integer,text,text,text,text,text,text,text,text,text,jsonb) to authenticated;

commit;
