begin;

alter table public.behavioral_answers
  add column opening_framing text,
  add column details_to_emphasize text,
  add column details_to_avoid text,
  add column is_primary boolean not null default false;

alter table public.behavioral_answers
  alter column answer_text set default '',
  drop constraint behavioral_answers_text,
  add constraint behavioral_answers_text check (char_length(answer_text) <= 50000),
  add constraint behavioral_answers_opening_framing check (
    opening_framing is null or char_length(opening_framing) <= 10000
  ),
  add constraint behavioral_answers_details_to_emphasize check (
    details_to_emphasize is null or char_length(details_to_emphasize) <= 20000
  ),
  add constraint behavioral_answers_details_to_avoid check (
    details_to_avoid is null or char_length(details_to_avoid) <= 20000
  ),
  add constraint behavioral_answers_primary_has_story check (
    not is_primary or story_id is not null
  );

create unique index behavioral_answers_primary_curated_unique
  on public.behavioral_answers (user_id, curated_question_id)
  where curated_question_id is not null and is_primary;

create unique index behavioral_answers_primary_custom_unique
  on public.behavioral_answers (user_id, custom_question_id)
  where custom_question_id is not null and is_primary;

create index behavioral_answers_user_application_updated_idx
  on public.behavioral_answers (user_id, application_id, updated_at desc)
  where application_id is not null;

create or replace function public.clear_behavioral_primary_before_story_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.behavioral_answers
  set is_primary = false
  where story_id = old.id
    and user_id = old.user_id
    and is_primary;
  return old;
end;
$$;

revoke all on function public.clear_behavioral_primary_before_story_delete() from public;

create trigger behavioral_stories_clear_primary_before_delete
before delete on public.behavioral_stories
for each row execute function public.clear_behavioral_primary_before_story_delete();

create or replace function public.set_behavioral_primary_answer(
  target_answer_id uuid,
  make_primary boolean default true
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_curated_question_id text;
  target_custom_question_id uuid;
  target_story_id uuid;
begin
  if current_user_id is null or target_answer_id is null or make_primary is null then
    return false;
  end if;

  select curated_question_id, custom_question_id, story_id
  into target_curated_question_id, target_custom_question_id, target_story_id
  from public.behavioral_answers
  where id = target_answer_id
    and user_id = current_user_id
  for update;

  if not found or (make_primary and target_story_id is null) then
    return false;
  end if;

  if make_primary then
    perform 1
    from public.behavioral_answers
    where user_id = current_user_id
      and (
        (target_curated_question_id is not null and curated_question_id = target_curated_question_id)
        or (target_custom_question_id is not null and custom_question_id = target_custom_question_id)
      )
    order by id
    for update;

    update public.behavioral_answers
    set is_primary = false
    where user_id = current_user_id
      and is_primary
      and id <> target_answer_id
      and (
        (target_curated_question_id is not null and curated_question_id = target_curated_question_id)
        or (target_custom_question_id is not null and custom_question_id = target_custom_question_id)
      );
  end if;

  update public.behavioral_answers
  set is_primary = make_primary
  where id = target_answer_id
    and user_id = current_user_id;

  return found;
end;
$$;

revoke all on function public.set_behavioral_primary_answer(uuid, boolean) from public;
grant execute on function public.set_behavioral_primary_answer(uuid, boolean) to authenticated;

grant insert (
  user_id,
  custom_question_id,
  curated_question_id,
  story_id,
  company_slug,
  application_id,
  title,
  answer_text,
  opening_framing,
  details_to_emphasize,
  details_to_avoid,
  notes,
  status
) on public.behavioral_answers to authenticated;

grant update (
  story_id,
  company_slug,
  application_id,
  title,
  answer_text,
  opening_framing,
  details_to_emphasize,
  details_to_avoid,
  notes,
  status
) on public.behavioral_answers to authenticated;

commit;
