begin;

create or replace function public.save_interview_preparation(
  target_round_id uuid,
  notes_value text default null,
  completed_ids_value text[] default null,
  topics_asked_value text default null,
  went_well_value text default null,
  needs_improvement_value text default null,
  follow_up_notes_value text default null
) returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); preparation_id uuid; round_status text;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if completed_ids_value is not null then
    raise exception 'Checklist items must be updated individually'
      using errcode = '0A000';
  end if;
  select status into round_status from public.interview_rounds where id = target_round_id and user_id = current_user_id for update;
  if round_status is null then raise exception 'Interview round not found'; end if;
  if (topics_asked_value is not null or went_well_value is not null or needs_improvement_value is not null or follow_up_notes_value is not null)
    and round_status <> 'Completed' then raise exception 'Reflection is available after the round is completed'; end if;
  insert into public.interview_preparations(round_id, user_id, private_notes, completed_template_item_ids, topics_asked, went_well, needs_improvement, follow_up_notes)
  values (target_round_id, current_user_id, notes_value, '{}', topics_asked_value, went_well_value, needs_improvement_value, follow_up_notes_value)
  on conflict (round_id) do update set
    private_notes = coalesce(notes_value, public.interview_preparations.private_notes),
    topics_asked = coalesce(topics_asked_value, public.interview_preparations.topics_asked),
    went_well = coalesce(went_well_value, public.interview_preparations.went_well),
    needs_improvement = coalesce(needs_improvement_value, public.interview_preparations.needs_improvement),
    follow_up_notes = coalesce(follow_up_notes_value, public.interview_preparations.follow_up_notes),
    updated_at = statement_timestamp()
  returning id into preparation_id;
  return preparation_id;
end $$;

create or replace function public.set_interview_preparation_checklist_item(
  target_round_id uuid,
  target_item_id text,
  target_completed boolean
) returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); owned_application_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if target_item_id is null or not (target_item_id = any(array[
    'dsa-review-queue', 'dsa-company-set', 'dsa-explain',
    'behavioral-story-set', 'behavioral-gaps', 'behavioral-questions',
    'system-design-attempt', 'system-design-concepts', 'system-design-narrate',
    'company-research', 'logistics-confirm', 'logistics-environment'
  ]::text[])) then
    raise exception 'Unknown interview preparation checklist item'
      using errcode = '23514', constraint = 'interview_preparations_checklist_known';
  end if;
  if target_completed is null then
    raise exception 'Checklist completion state is required'
      using errcode = '23502', constraint = 'interview_preparations_checklist_completion_required';
  end if;

  select application_id
  into owned_application_id
  from public.interview_rounds
  where id = target_round_id and user_id = current_user_id
  for update;
  if not found then
    raise exception 'Interview round not found' using errcode = 'P0002';
  end if;

  if target_completed then
    insert into public.interview_preparations(round_id, user_id, completed_template_item_ids)
    values (target_round_id, current_user_id, array[target_item_id])
    on conflict (round_id) do update set
      completed_template_item_ids = array_append(public.interview_preparations.completed_template_item_ids, target_item_id),
      updated_at = statement_timestamp()
    where not (target_item_id = any(public.interview_preparations.completed_template_item_ids));
  else
    update public.interview_preparations
    set completed_template_item_ids = array_remove(completed_template_item_ids, target_item_id),
        updated_at = statement_timestamp()
    where round_id = target_round_id
      and user_id = current_user_id
      and target_item_id = any(completed_template_item_ids);
  end if;

  return owned_application_id;
end $$;

revoke all on function public.save_interview_preparation(uuid,text,text[],text,text,text,text) from public;
revoke all on function public.save_interview_preparation(uuid,text,text[],text,text,text,text) from anon;
revoke all on function public.save_interview_preparation(uuid,text,text[],text,text,text,text) from authenticated;
grant execute on function public.save_interview_preparation(uuid,text,text[],text,text,text,text) to authenticated;

revoke all on function public.set_interview_preparation_checklist_item(uuid,text,boolean) from public;
revoke all on function public.set_interview_preparation_checklist_item(uuid,text,boolean) from anon;
revoke all on function public.set_interview_preparation_checklist_item(uuid,text,boolean) from authenticated;
grant execute on function public.set_interview_preparation_checklist_item(uuid,text,boolean) to authenticated;

commit;
