begin;
revoke all on public.mock_interview_sessions, public.mock_interview_rubric_ratings from anon;
revoke insert, update, delete on public.mock_interview_sessions, public.mock_interview_rubric_ratings from authenticated;
revoke all on function public.save_mock_interview_review(uuid,text,text,text,text,text,timestamptz,integer,text,text,text,jsonb) from public;
grant select on public.mock_interview_sessions, public.mock_interview_rubric_ratings to authenticated;
grant execute on function public.save_mock_interview_review(uuid,text,text,text,text,text,timestamptz,integer,text,text,text,jsonb) to authenticated;

create or replace function public.save_mock_interview_review(target_session_id uuid, target_track text, target_mode text, target_plan_id text, target_prompt_id text, target_rubric_id text, target_started_at timestamptz, target_elapsed_seconds integer, target_strength text, target_improvement text, target_follow_up_practice text, target_ratings jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); existing public.mock_interview_sessions%rowtype; saved uuid; allowed text[];
begin
 if uid is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if (target_track,target_rubric_id) not in (('dsa','rubric-dsa'),('system-design','rubric-system-design'),('ml-design','rubric-ml-design'),('behavioral','rubric-behavioral')) then raise exception 'Invalid mock rubric' using errcode='23514'; end if;
 allowed:=case target_rubric_id when 'rubric-dsa' then array['clarification','approach','correctness','complexity','implementation','testing','communication'] when 'rubric-system-design' then array['requirements','decomposition','scalability','data','reliability','tradeoffs','communication'] when 'rubric-ml-design' then array['product','metrics','data','model','serving','monitoring','tradeoffs','communication'] else array['relevance','context','ownership','actions','outcome','reflection','communication'] end;
 if jsonb_typeof(target_ratings)<>'array' or jsonb_array_length(target_ratings)=0 or exists(select 1 from jsonb_array_elements(target_ratings) r where r->>'dimension_id' is null or not (r->>'dimension_id'=any(allowed)) or r->>'rating' not in ('Strong','Developing','Needs attention')) or (select count(*) from jsonb_array_elements(target_ratings))<>(select count(distinct r->>'dimension_id') from jsonb_array_elements(target_ratings) r) then raise exception 'Invalid rubric ratings' using errcode='23514'; end if;
 select * into existing from public.mock_interview_sessions where id=target_session_id;
 if found and (existing.user_id<>uid or (existing.track,existing.practice_mode,existing.plan_id,existing.prompt_id,existing.rubric_id,existing.started_at)<>(target_track,target_mode,target_plan_id,target_prompt_id,target_rubric_id,target_started_at)) then raise exception 'Mock session identity cannot change' using errcode='42501'; end if;
 insert into public.mock_interview_sessions(id,user_id,track,practice_mode,plan_id,prompt_id,rubric_id,started_at,reviewed_at,elapsed_seconds,strength,improvement,follow_up_practice) values(target_session_id,uid,target_track,target_mode,target_plan_id,target_prompt_id,target_rubric_id,target_started_at,transaction_timestamp(),target_elapsed_seconds,target_strength,target_improvement,target_follow_up_practice) on conflict(id) do update set reviewed_at=excluded.reviewed_at,elapsed_seconds=excluded.elapsed_seconds,strength=excluded.strength,improvement=excluded.improvement,follow_up_practice=excluded.follow_up_practice returning id into saved;
 delete from public.mock_interview_rubric_ratings where session_id=saved; insert into public.mock_interview_rubric_ratings select saved,r->>'dimension_id',r->>'rating' from jsonb_array_elements(target_ratings) r; return saved;
end $$;
commit;
