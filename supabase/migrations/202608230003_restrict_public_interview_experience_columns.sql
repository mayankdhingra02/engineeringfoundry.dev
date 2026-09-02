begin;

-- Public report discovery needs only the reviewed publication projection.
-- Keep the existing RLS predicates in place while preventing direct anon
-- clients from selecting author, moderation, or lifecycle metadata.
drop policy "approved experiences are publicly readable" on public.interview_experiences;
create policy "approved experiences are publicly readable"
on public.interview_experiences
for select
to anon
using (status = 'approved' and publication_consent);

drop policy "approved experience rounds are publicly readable" on public.interview_experience_rounds;
create policy "approved experience rounds are publicly readable"
on public.interview_experience_rounds
for select
to anon
using (
  exists (
    select 1
    from public.interview_experiences experience
    where experience.id = interview_experience_rounds.experience_id
      and experience.status = 'approved'
      and experience.publication_consent
  )
);

revoke select on table public.interview_experiences from anon;
grant select (
  id,
  status,
  company_name,
  role_title,
  role_level,
  region,
  interview_date,
  summary,
  preparation_lessons,
  public_identity,
  publication_consent
) on table public.interview_experiences to anon;

revoke select on table public.interview_experience_rounds from anon;
grant select (
  experience_id,
  round_type,
  topic_labels
) on table public.interview_experience_rounds to anon;

commit;
