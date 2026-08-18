begin;

create table public.behavioral_curated_questions (
  id text primary key,
  prompt text not null,
  category text not null,
  position integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint behavioral_curated_questions_id check (id ~ '^beh-[a-z0-9-]+$'),
  constraint behavioral_curated_questions_prompt check (char_length(trim(prompt)) between 5 and 1000),
  constraint behavioral_curated_questions_category check (char_length(trim(category)) between 1 and 100),
  constraint behavioral_curated_questions_position check (position > 0),
  constraint behavioral_curated_questions_position_unique unique (position)
);

insert into public.behavioral_curated_questions (id, prompt, category, position) values
  ('beh-lead-01', 'Describe a time you created direction for a group even though you were not the formal decision-maker.', 'Leadership', 1),
  ('beh-lead-02', 'Tell me about a project that had lost momentum and how you helped the team move again.', 'Leadership', 2),
  ('beh-lead-03', 'Share an example of how you improved a decision by making room for perspectives that were being missed.', 'Leadership', 3),
  ('beh-own-01', 'Walk through a risk you should have identified earlier and what you did after it became visible.', 'Ownership', 4),
  ('beh-own-02', 'Describe a time you found an important gap between teams and took responsibility for closing it.', 'Ownership', 5),
  ('beh-own-03', 'Tell me about inheriting a fragile area of work and deciding what to stabilize first.', 'Ownership', 6),
  ('beh-collab-01', 'Give an example of adapting your working style so a partnership became more effective.', 'Collaboration', 7),
  ('beh-collab-02', 'Tell me about a time you helped a teammate become unblocked without taking over their work.', 'Collaboration', 8),
  ('beh-collab-03', 'Describe a solution that improved because you combined expertise from people with different specialties.', 'Collaboration', 9),
  ('beh-conflict-01', 'Tell me about a time you disagreed with a teammate.', 'Conflict & Influence', 10),
  ('beh-conflict-02', 'Tell me about feedback you initially resisted but later found useful.', 'Conflict & Influence', 11),
  ('beh-conflict-03', 'Share a time you needed commitment from people whose priorities you could not control.', 'Conflict & Influence', 12),
  ('beh-conflict-04', 'Describe a time you pushed back on a request while preserving the working relationship.', 'Conflict & Influence', 13),
  ('beh-amb-01', 'Walk through how you turned unclear requirements into a plan the team could test.', 'Ambiguity', 14),
  ('beh-amb-02', 'Tell me about a consequential decision you made with incomplete data.', 'Ambiguity', 15),
  ('beh-amb-03', 'Describe a project whose direction changed after work had begun and how you responded.', 'Ambiguity', 16),
  ('beh-growth-01', 'Choose a decision you would make differently today and explain what changed your judgment.', 'Failure & Growth', 17),
  ('beh-growth-02', 'Tell me about an important goal you did not meet and how you handled the outcome.', 'Failure & Growth', 18),
  ('beh-growth-03', 'Describe feedback that led you to change a recurring work habit.', 'Failure & Growth', 19),
  ('beh-growth-04', 'Tell me about a skill gap that limited your work and how you addressed it.', 'Failure & Growth', 20),
  ('beh-exec-01', 'Describe a time several urgent priorities competed and how you decided what moved first.', 'Execution & Prioritization', 21),
  ('beh-exec-02', 'Tell me about delivering under a tight deadline without hiding the quality tradeoffs.', 'Execution & Prioritization', 22),
  ('beh-exec-03', 'Share a time reducing scope produced a better outcome than completing the original plan.', 'Execution & Prioritization', 23),
  ('beh-exec-04', 'Describe a critical dependency that slipped and how you protected the broader outcome.', 'Execution & Prioritization', 24),
  ('beh-mentor-01', 'Tell me about helping someone grow into work they could not yet handle independently.', 'Mentorship', 25),
  ('beh-mentor-02', 'Describe a time you gave feedback that was difficult but important for a teammate to hear.', 'Mentorship', 26),
  ('beh-tech-01', 'Tell me about a difficult technical decision you made.', 'Technical Judgment', 27),
  ('beh-tech-02', 'Describe how you made the case for maintenance or reliability work that was not immediately visible to users.', 'Technical Judgment', 28),
  ('beh-tech-03', 'Tell me about reversing or substantially changing a technical decision after new evidence appeared.', 'Technical Judgment', 29),
  ('beh-customer-01', 'Describe a user problem your team had underestimated and how you helped make it visible.', 'Customer Impact', 30),
  ('beh-customer-02', 'Tell me about protecting user trust when delivery pressure favored a faster but riskier path.', 'Customer Impact', 31),
  ('beh-xfn-01', 'Describe how you translated a technical constraint into a decision that non-engineering partners could use.', 'Cross-functional Work', 32),
  ('beh-xfn-02', 'Tell me about resolving a conflict between engineering priorities and another function''s goals.', 'Cross-functional Work', 33),
  ('beh-incident-01', 'Walk through your role in a production incident, from first signal through stabilization and learning.', 'Incident & Quality', 34),
  ('beh-incident-02', 'Describe a quality concern you raised before it became an incident and how the team responded.', 'Incident & Quality', 35),
  ('beh-general-01', 'Tell me about yourself and the thread that connects your recent engineering work.', 'Communication', 36),
  ('beh-own-04', 'Tell me about a time you went beyond your assigned responsibilities because the outcome needed it.', 'Ownership', 37),
  ('beh-learn-01', 'Describe a time you had to learn an unfamiliar technology or domain quickly to deliver.', 'Learning', 38),
  ('beh-process-01', 'Tell me about a process you improved after noticing repeated friction for the team.', 'Execution & Prioritization', 39),
  ('beh-manager-01', 'Describe a time you disagreed with your manager and how you handled the decision.', 'Conflict & Influence', 40),
  ('beh-project-01', 'Walk me through the most challenging engineering project you have owned and why it was difficult.', 'Execution & Prioritization', 41),
  ('beh-comm-01', 'Tell me about a time you had to communicate bad news or a material risk to stakeholders.', 'Communication', 42),
  ('beh-customer-03', 'Describe a time customer or user feedback caused you to change the direction of your work.', 'Customer Impact', 43),
  ('beh-innovate-01', 'Tell me about a time you simplified a complicated system, workflow, or decision.', 'Technical Judgment', 44),
  ('beh-priority-05', 'Describe a time you stopped or redirected work after learning it would not create enough value.', 'Execution & Prioritization', 45),
  ('beh-mentor-03', 'Tell me about delegating important work while remaining accountable for the outcome.', 'Mentorship', 46),
  ('beh-ethics-01', 'Describe a time you raised an uncomfortable concern because quality, safety, privacy, or trust was at risk.', 'Ownership', 47),
  ('beh-collab-04', 'Tell me about a working relationship that became strained and what you did to repair it.', 'Collaboration', 48);

alter table public.behavioral_curated_questions enable row level security;
create policy "Curated behavioral questions are readable"
  on public.behavioral_curated_questions for select to anon, authenticated using (true);
revoke all on table public.behavioral_curated_questions from anon, authenticated;
grant select on table public.behavioral_curated_questions to anon, authenticated;

alter table public.behavioral_story_question_links
  add constraint behavioral_links_curated_question_fkey
  foreign key (curated_question_id) references public.behavioral_curated_questions(id) on update cascade on delete restrict;
alter table public.behavioral_answers
  add constraint behavioral_answers_curated_question_fkey
  foreign key (curated_question_id) references public.behavioral_curated_questions(id) on update cascade on delete restrict;
alter table public.behavioral_saved_questions
  add constraint behavioral_saved_questions_curated_question_fkey
  foreign key (curated_question_id) references public.behavioral_curated_questions(id) on update cascade on delete restrict;

create or replace function public.behavioral_story_database_status(
  story_situation text,
  story_task text,
  story_action text,
  story_result text
)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when char_length(trim(coalesce(story_situation, ''))) >= 40
      and char_length(trim(coalesce(story_task, ''))) >= 20
      and char_length(trim(coalesce(story_action, ''))) >= 80
      and char_length(trim(coalesce(story_result, ''))) >= 40 then 'Ready'
    when (
      (case when char_length(trim(coalesce(story_situation, ''))) >= 20 then 1 else 0 end) +
      (case when char_length(trim(coalesce(story_task, ''))) >= 20 then 1 else 0 end) +
      (case when char_length(trim(coalesce(story_action, ''))) >= 20 then 1 else 0 end) +
      (case when char_length(trim(coalesce(story_result, ''))) >= 20 then 1 else 0 end)
    ) >= 2
      or char_length(trim(concat_ws(' ', story_situation, story_task, story_action, story_result))) >= 80 then 'Needs Work'
    else 'Draft'
  end
$$;

create or replace function public.derive_behavioral_story_status()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.status := public.behavioral_story_database_status(new.situation, new.task, new.action, new.result);
  return new;
end;
$$;

create trigger behavioral_stories_derive_status
before insert or update of situation, task, action, result, status on public.behavioral_stories
for each row execute function public.derive_behavioral_story_status();

revoke insert (status), update (status) on public.behavioral_stories from authenticated;

create or replace function public.enforce_behavioral_answer_context()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owned_application_company text;
begin
  if new.application_id is not null then
    select company_slug into owned_application_company
    from public.applications
    where id = new.application_id and user_id = new.user_id;
    if not found then
      raise exception 'Behavioral preparation application must belong to its owner' using errcode = '23503';
    end if;
    new.company_slug := owned_application_company;
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_behavioral_answer_context() from public;

create trigger behavioral_answers_enforce_context
before insert or update of user_id, application_id, company_slug on public.behavioral_answers
for each row execute function public.enforce_behavioral_answer_context();

create or replace function public.ensure_behavioral_answer_story_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.story_id is not null then
    insert into public.behavioral_story_question_links (
      user_id, story_id, custom_question_id, curated_question_id
    ) values (
      new.user_id, new.story_id, new.custom_question_id, new.curated_question_id
    ) on conflict do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.ensure_behavioral_answer_story_link() from public;

create trigger behavioral_answers_ensure_story_link
after insert or update of story_id, custom_question_id, curated_question_id on public.behavioral_answers
for each row execute function public.ensure_behavioral_answer_story_link();

create or replace function public.protect_behavioral_answer_story_link()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.behavioral_answers answer
    where answer.user_id = old.user_id
      and answer.story_id = old.story_id
      and answer.custom_question_id is not distinct from old.custom_question_id
      and answer.curated_question_id is not distinct from old.curated_question_id
  ) then
    raise exception 'Delete the linked preparation before unlinking this story' using errcode = '23503';
  end if;
  return old;
end;
$$;
revoke all on function public.protect_behavioral_answer_story_link() from public;

create constraint trigger behavioral_story_links_protect_answer_relationship
after delete on public.behavioral_story_question_links
deferrable initially deferred
for each row execute function public.protect_behavioral_answer_story_link();

commit;
