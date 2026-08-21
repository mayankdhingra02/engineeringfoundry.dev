import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const migration = read("supabase/migrations/202608220001_create_interview_experiences_v1.sql");
const page = read("app/interview-experiences/page.tsx");
const directory = read("features/interview-experiences/experience-directory.tsx");
const actions = read("app/interview-experiences/actions.ts");
const form = read("features/interview-experiences/experience-submission.tsx");
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

for (const marker of ["interview_experiences", "interview_experience_rounds", "draft','submitted','needs_changes','approved','rejected','archived","enable row level security", "approved experiences are publicly readable", "authors read own experiences", "revoke insert, update, delete", "save_interview_experience_draft", "submit_interview_experience", "withdraw_interview_experience", "delete_interview_experience"]) expect(migration.includes(marker), `Migration is missing ${marker}.`);
expect(migration.includes("status = 'approved' and publication_consent"), "Public access must be limited to approved consented reports.");
expect(page.includes("createSupabaseServerClient") && page.includes("const publicSupabase = await createSupabaseServerClient()"), "Signed-out directory needs its own anon-capable server client.");
expect(page.includes("const publicResult = publicSupabase ? await publicSupabase") && !page.includes("const [publicResult, ownResult] = actor ?"), "Public directory query must not be conditional on an authenticated actor.");
expect(page.includes('eq("status", "approved").eq("publication_consent", true)') && page.includes("const ownResult = actor ? await actor.supabase"), "Public query must remain approved/consented while private history stays actor-gated.");
expect(page.includes("Reviewed experience directory") && directory.includes("No reviewed public interview experiences are published yet."), "Directory-first route needs an honest empty state.");
for (const marker of ["Company", "Level", "Region", "Stage"]) expect(directory.includes(marker), `Directory is missing the ${marker} filter.`);
expect(page.includes("Contribute a high-level experience") && page.includes("interview_experience_rounds"), "Route must provide contribution and reviewed process context.");
expect(actions.includes("getAuthenticatedActor") && actions.includes("save_interview_experience_draft"), "Mutations must authenticate and use the controlled RPC boundary.");
expect(!actions.includes("author_id:"), "Caller-controlled author identity is forbidden.");
for (const marker of ["Save private draft", "Submit for review", "Withdraw", "Delete", "publicationConsent", "exact proprietary questions", "editableStatuses", "setInput({ id: item.id", "Cancel edit", "Preview report", "Return to edit", "This is not public yet", "preview.publicationConsent"]) expect(form.includes(marker), `Submission UI is missing ${marker}.`);
expect(form.includes('editableStatuses.has(item.status) && <button') && !form.includes('submitted", "approved"'), "Only draft, needs_changes, and withdrawn reports may enter edit mode.");
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("Interview Experiences v1 passed: directory-first, authenticated submission, moderation states, and controlled publication boundaries are present.");
