begin;

create table public.behavioral_custom_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_text text not null,
  description text,
  category text not null default 'Other',
  company_slug text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint behavioral_custom_questions_text check (char_length(trim(question_text)) between 5 and 1000),
  constraint behavioral_custom_questions_description check (description is null or char_length(description) <= 5000),
  constraint behavioral_custom_questions_category check (char_length(trim(category)) between 1 and 100),
  constraint behavioral_custom_questions_company check (company_slug is null or company_slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  constraint behavioral_custom_questions_notes check (notes is null or char_length(notes) <= 20000)
);

create table public.behavioral_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  company_or_context text,
  role text,
  approximate_period text,
  project text,
  situation text,
  task text,
  action text,
  result text,
  reflection text,
  short_summary text,
  status text not null default 'Draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint behavioral_stories_title check (char_length(trim(title)) between 2 and 200),
  constraint behavioral_stories_context check (company_or_context is null or char_length(company_or_context) <= 200),
  constraint behavioral_stories_role check (role is null or char_length(role) <= 160),
  constraint behavioral_stories_period check (approximate_period is null or char_length(approximate_period) <= 100),
  constraint behavioral_stories_project check (project is null or char_length(project) <= 200),
  constraint behavioral_stories_status check (status in ('Draft', 'Needs Work', 'Ready', 'Retired')),
  constraint behavioral_stories_situation check (situation is null or char_length(situation) <= 50000),
  constraint behavioral_stories_task check (task is null or char_length(task) <= 50000),
  constraint behavioral_stories_action check (action is null or char_length(action) <= 50000),
  constraint behavioral_stories_result check (result is null or char_length(result) <= 50000),
  constraint behavioral_stories_reflection check (reflection is null or char_length(reflection) <= 50000),
  constraint behavioral_stories_summary check (short_summary is null or char_length(short_summary) <= 5000),
  constraint behavioral_stories_notes check (notes is null or char_length(notes) <= 50000)
);

create table public.behavioral_story_themes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references public.behavioral_stories(id) on delete cascade,
  theme text not null,
  created_at timestamptz not null default now(),
  constraint behavioral_story_themes_value check (char_length(trim(theme)) between 1 and 80),
  constraint behavioral_story_themes_unique unique (story_id, theme)
);

create table public.behavioral_story_question_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id uuid not null references public.behavioral_stories(id) on delete cascade,
  custom_question_id uuid references public.behavioral_custom_questions(id) on delete cascade,
  curated_question_id text,
  relevance text,
  notes text,
  created_at timestamptz not null default now(),
  constraint behavioral_links_question_kind check ((custom_question_id is null) <> (curated_question_id is null)),
  constraint behavioral_links_curated_key check (curated_question_id is null or curated_question_id ~ '^beh-[a-z0-9-]+$'),
  constraint behavioral_links_relevance check (relevance is null or char_length(relevance) <= 100),
  constraint behavioral_links_notes check (notes is null or char_length(notes) <= 10000)
);
create unique index behavioral_links_story_curated_unique on public.behavioral_story_question_links (story_id, curated_question_id) where curated_question_id is not null;
create unique index behavioral_links_story_custom_unique on public.behavioral_story_question_links (story_id, custom_question_id) where custom_question_id is not null;

create table public.behavioral_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  custom_question_id uuid references public.behavioral_custom_questions(id) on delete cascade,
  curated_question_id text,
  story_id uuid references public.behavioral_stories(id) on delete set null,
  company_slug text,
  application_id uuid references public.applications(id) on delete set null,
  title text not null,
  answer_text text not null,
  notes text,
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint behavioral_answers_question_kind check ((custom_question_id is null) <> (curated_question_id is null)),
  constraint behavioral_answers_curated_key check (curated_question_id is null or curated_question_id ~ '^beh-[a-z0-9-]+$'),
  constraint behavioral_answers_company check (company_slug is null or company_slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  constraint behavioral_answers_title check (char_length(trim(title)) between 1 and 200),
  constraint behavioral_answers_text check (char_length(trim(answer_text)) between 1 and 50000),
  constraint behavioral_answers_notes check (notes is null or char_length(notes) <= 50000),
  constraint behavioral_answers_status check (status in ('Draft', 'Needs Work', 'Ready', 'Retired'))
);

create index behavioral_custom_questions_user_idx on public.behavioral_custom_questions (user_id, updated_at desc);
create index behavioral_custom_questions_company_idx on public.behavioral_custom_questions (user_id, company_slug);
create index behavioral_stories_user_status_idx on public.behavioral_stories (user_id, status, updated_at desc);
create index behavioral_story_themes_user_theme_idx on public.behavioral_story_themes (user_id, theme);
create index behavioral_links_user_story_idx on public.behavioral_story_question_links (user_id, story_id);
create index behavioral_links_user_curated_idx on public.behavioral_story_question_links (user_id, curated_question_id) where curated_question_id is not null;
create index behavioral_links_user_custom_idx on public.behavioral_story_question_links (user_id, custom_question_id) where custom_question_id is not null;
create index behavioral_answers_user_question_idx on public.behavioral_answers (user_id, curated_question_id, custom_question_id);
create index behavioral_answers_user_company_idx on public.behavioral_answers (user_id, company_slug) where company_slug is not null;
create index behavioral_answers_application_idx on public.behavioral_answers (application_id) where application_id is not null;

create trigger behavioral_custom_questions_set_updated_at before update on public.behavioral_custom_questions for each row execute function public.set_updated_at();
create trigger behavioral_stories_set_updated_at before update on public.behavioral_stories for each row execute function public.set_updated_at();
create trigger behavioral_answers_set_updated_at before update on public.behavioral_answers for each row execute function public.set_updated_at();

alter table public.behavioral_custom_questions enable row level security;
alter table public.behavioral_stories enable row level security;
alter table public.behavioral_story_themes enable row level security;
alter table public.behavioral_story_question_links enable row level security;
alter table public.behavioral_answers enable row level security;

create policy "Owners manage custom behavioral questions" on public.behavioral_custom_questions for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners manage behavioral stories" on public.behavioral_stories for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners manage behavioral story themes" on public.behavioral_story_themes for all to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.behavioral_stories where behavioral_stories.id = behavioral_story_themes.story_id and behavioral_stories.user_id = (select auth.uid()))) with check ((select auth.uid()) = user_id and exists (select 1 from public.behavioral_stories where behavioral_stories.id = behavioral_story_themes.story_id and behavioral_stories.user_id = (select auth.uid())));
create policy "Owners manage behavioral story links" on public.behavioral_story_question_links for all to authenticated using ((select auth.uid()) = user_id and exists (select 1 from public.behavioral_stories where behavioral_stories.id = behavioral_story_question_links.story_id and behavioral_stories.user_id = (select auth.uid())) and (custom_question_id is null or exists (select 1 from public.behavioral_custom_questions where behavioral_custom_questions.id = behavioral_story_question_links.custom_question_id and behavioral_custom_questions.user_id = (select auth.uid())))) with check ((select auth.uid()) = user_id and exists (select 1 from public.behavioral_stories where behavioral_stories.id = behavioral_story_question_links.story_id and behavioral_stories.user_id = (select auth.uid())) and (custom_question_id is null or exists (select 1 from public.behavioral_custom_questions where behavioral_custom_questions.id = behavioral_story_question_links.custom_question_id and behavioral_custom_questions.user_id = (select auth.uid()))));
create policy "Owners manage behavioral answers" on public.behavioral_answers for all to authenticated using ((select auth.uid()) = user_id and (story_id is null or exists (select 1 from public.behavioral_stories where behavioral_stories.id = behavioral_answers.story_id and behavioral_stories.user_id = (select auth.uid()))) and (custom_question_id is null or exists (select 1 from public.behavioral_custom_questions where behavioral_custom_questions.id = behavioral_answers.custom_question_id and behavioral_custom_questions.user_id = (select auth.uid()))) and (application_id is null or exists (select 1 from public.applications where applications.id = behavioral_answers.application_id and applications.user_id = (select auth.uid())))) with check ((select auth.uid()) = user_id and (story_id is null or exists (select 1 from public.behavioral_stories where behavioral_stories.id = behavioral_answers.story_id and behavioral_stories.user_id = (select auth.uid()))) and (custom_question_id is null or exists (select 1 from public.behavioral_custom_questions where behavioral_custom_questions.id = behavioral_answers.custom_question_id and behavioral_custom_questions.user_id = (select auth.uid()))) and (application_id is null or exists (select 1 from public.applications where applications.id = behavioral_answers.application_id and applications.user_id = (select auth.uid()))));

revoke all on table public.behavioral_custom_questions, public.behavioral_stories, public.behavioral_story_themes, public.behavioral_story_question_links, public.behavioral_answers from anon;
grant select, insert, update, delete on table public.behavioral_custom_questions, public.behavioral_stories, public.behavioral_story_themes, public.behavioral_story_question_links, public.behavioral_answers to authenticated;

commit;
