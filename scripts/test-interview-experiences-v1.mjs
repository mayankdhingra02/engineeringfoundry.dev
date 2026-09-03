import fs from "node:fs";
import {
  parseInterviewExperienceManagementInput,
  parseInterviewExperienceSaveInput,
} from "../lib/interview-experiences/action-input.ts";

const read = (path) => fs.readFileSync(path, "utf8");
const migration = read("supabase/migrations/202608220001_create_interview_experiences_v1.sql");
const columnPrivacyMigration = read("supabase/migrations/202608230003_restrict_public_interview_experience_columns.sql");
const page = read("app/interview-experiences/page.tsx");
const companyPage = read("app/interview-experiences/[company]/page.tsx");
const directory = read("features/interview-experiences/experience-directory.tsx");
const publicClient = read("lib/supabase/public.ts");
const companyNormalization = read("lib/interview-experiences/company.ts");
const actions = read("app/interview-experiences/actions.ts");
const form = read("features/interview-experiences/experience-submission.tsx");
const globalStyles = read("app/globals.css");
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };

const validId = "123e4567-e89b-42d3-a456-426614174000";
const validSubmission = {
  id: validId,
  companyName: "  Example Company  ",
  roleTitle: "  Senior Engineer  ",
  roleLevel: "Senior",
  region: "  Chicago  ",
  interviewDate: "2026-09",
  summary: "  A high-level account of the interview process and preparation lessons.  ",
  preparationLessons: "  Practice concise tradeoff explanations.  ",
  publicIdentity: "anonymous",
  publicationConsent: true,
  roundType: "  System design  ",
  topics: ["  Scalability  ", "", "Caching"],
};

const newDraftInput = { ...validSubmission };
delete newDraftInput.id;
const draft = parseInterviewExperienceSaveInput(newDraftInput, false);
expect(draft.ok && draft.value.submit === false && draft.value.input.id === undefined, "A valid new private-draft request must parse without requiring an ID or becoming a submission.");
expect(draft.ok && draft.value.input.companyName === "Example Company" && draft.value.input.topics.join(",") === "Scalability,Caching", "The production parser must apply the bounded normalization used by persistence.");
const submission = parseInterviewExperienceSaveInput(validSubmission, true);
expect(submission.ok && submission.value.submit === true && submission.value.input.id === validId, "A valid submission request must preserve its explicit submit decision and UUID.");
for (const action of ["withdraw", "delete"]) {
  const result = parseInterviewExperienceManagementInput(validId, action);
  expect(result.ok && result.value.action === action && result.value.id === validId, `A valid ${action} request must parse exactly.`);
}

for (const input of [null, undefined, "submission", 1, true, [], [validSubmission]]) {
  expect(!parseInterviewExperienceSaveInput(input, false).ok, "Submission input must be a non-array object.");
}
for (const field of ["companyName", "roleTitle", "roleLevel", "region", "interviewDate", "summary", "preparationLessons", "publicIdentity", "publicationConsent", "roundType", "topics"]) {
  const input = { ...validSubmission };
  delete input[field];
  expect(!parseInterviewExperienceSaveInput(input, false).ok, `Submission input must reject a missing ${field}.`);
}
for (const field of ["companyName", "roleTitle", "roleLevel", "region", "interviewDate", "summary", "preparationLessons", "roundType"]) {
  for (const value of [null, false, 1, {}, []]) {
    expect(!parseInterviewExperienceSaveInput({ ...validSubmission, [field]: value }, false).ok, `${field} must reject non-string values.`);
  }
}
for (const value of [null, "true", 1, 0, {}, []]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, publicationConsent: value }, false).ok, "Publication consent must be a boolean.");
}
for (const value of [null, "Caching", {}, true, 1]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, topics: value }, false).ok, "Topics must be an array.");
}
for (const value of [null, 1, true, {}, [], ["nested"]]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, topics: ["Caching", value] }, false).ok, "Every topic must be a string.");
}
for (const value of ["Anonymous", "USERNAME", "public", "", null, 1]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, publicIdentity: value }, false).ok, "Public identity must use an exact allowed value.");
}
for (const value of ["entry", "Senior ", "Director", null, 1]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, roleLevel: value }, false).ok, "Role level must use an exact allowed value.");
}
for (const value of ["2026-00", "2026-13", "2026-1", "026-01", "0000-01", "2026-01-01", "September 2026"]) {
  expect(!parseInterviewExperienceSaveInput({ ...validSubmission, interviewDate: value }, false).ok, `Interview month must reject ${value}.`);
}
for (const value of [undefined, null, 0, 1, "false", "true", {}, []]) {
  expect(!parseInterviewExperienceSaveInput(validSubmission, value).ok, "The submit decision must be a boolean.");
}
for (const value of [null, undefined, "", "not-a-uuid", "00000000-0000-0000-0000-000000000000", 1, {}, []]) {
  if (value !== undefined) expect(!parseInterviewExperienceSaveInput({ ...validSubmission, id: value }, false).ok, "Save actions must reject invalid supplied UUIDs.");
  expect(!parseInterviewExperienceManagementInput(value, "withdraw").ok, "Management actions must reject invalid UUIDs.");
}
for (const value of [undefined, null, "", "archive", "submit", "Withdraw", "DELETE", 1, {}, []]) {
  expect(!parseInterviewExperienceManagementInput(validId, value).ok, "Management verbs must be present and match the exact allowlist.");
}

for (const marker of ["interview_experiences", "interview_experience_rounds", "draft','submitted','needs_changes','approved','rejected','archived","enable row level security", "approved experiences are publicly readable", "authors read own experiences", "revoke insert, update, delete", "save_interview_experience_draft", "submit_interview_experience", "withdraw_interview_experience", "delete_interview_experience"]) expect(migration.includes(marker), `Migration is missing ${marker}.`);
expect(migration.includes("status = 'approved' and publication_consent"), "Public access must be limited to approved consented reports.");
expect(columnPrivacyMigration.includes("revoke select on table public.interview_experiences from anon"), "Anon table-wide experience reads must be revoked in a forward migration.");
expect(columnPrivacyMigration.includes("revoke select on table public.interview_experience_rounds from anon"), "Anon table-wide round reads must be revoked in a forward migration.");
expect(columnPrivacyMigration.includes('to anon\nusing (status = \'approved\' and publication_consent)'), "Approved report visibility must not grant authenticated non-owners base-table access.");
const grants = new Map([...columnPrivacyMigration.matchAll(/grant select \(([\s\S]*?)\) on table public\.(\w+) to anon;/g)].map((match) => [match[2], match[1]]));
const experienceGrant = grants.get("interview_experiences") ?? "";
const roundGrant = grants.get("interview_experience_rounds") ?? "";
for (const marker of ["id", "status", "company_name", "role_title", "role_level", "region", "interview_date", "summary", "preparation_lessons", "public_identity", "publication_consent"]) expect(new RegExp(`\\b${marker}\\b`).test(experienceGrant), `Anon experience projection is missing ${marker}.`);
for (const marker of ["experience_id", "round_type", "topic_labels"]) expect(new RegExp(`\\b${marker}\\b`).test(roundGrant), `Anon round projection is missing ${marker}.`);
for (const internalColumn of ["author_id", "submitted_at", "reviewed_at", "review_note", "created_at", "updated_at"]) expect(!new RegExp(`\\b${internalColumn}\\b`).test(experienceGrant), `Anon projection must not grant ${internalColumn}.`);
for (const internalColumn of ["id", "position", "process_notes"]) expect(!new RegExp(`\\b${internalColumn}\\b`).test(roundGrant), `Anon round projection must not grant ${internalColumn}.`);
for (const marker of ['import "server-only"', "createClient", "persistSession: false", "autoRefreshToken: false", "detectSessionInUrl: false"]) expect(publicClient.includes(marker), `Public database client is missing ${marker}.`);
expect(!publicClient.includes('from "next/headers"') && !publicClient.includes("cookies()") && !publicClient.includes("createServerClient"), "Public report reads must never inherit an authenticated request session.");
expect(publicClient.includes("listPublicInterviewExperiences") && publicClient.includes('eq("status", "approved")') && publicClient.includes('eq("publication_consent", true)'), "Public report helper must keep the approved and consented boundary.");
expect(page.includes("listPublicInterviewExperiences") && !page.includes("const [publicResult, ownResult] = actor ?"), "Public directory query must not be conditional on an authenticated actor.");
expect(page.includes("const ownResult = actor ? await actor.supabase"), "Private history must stay actor-gated.");
expect(!page.includes("process_notes") && !directory.includes("process_notes"), "Unrendered process notes must remain outside the public projection.");
expect(page.includes("Reviewed experience directory") && directory.includes("No reviewed public interview experiences are published yet."), "Directory-first route needs an honest empty state.");
for (const marker of ["temporarily unavailable", "does not mean that no reports are published", "cannot make a completeness claim"]) expect(directory.includes(marker), `Public query failures and unconfigured environments need honest messaging: ${marker}.`);
for (const source of [page, companyPage]) expect(source.includes('dynamic = "force-dynamic"') && source.includes("listPublicInterviewExperiences"), "Every public report route must fetch the sessionless projection per request.");
expect(companyPage.includes("companyName: item.name") && companyPage.includes("ExperienceDirectory") && !companyPage.includes("No reviewed public interview experiences are published yet"), "Company-specific routes must show the scoped reviewed directory without a hard-coded false zero state.");
expect(companyPage.includes("Each contributor report reflects the contributor") && !companyPage.includes("future community experience"), "Company-specific report disclaimers must describe the live reviewed directory accurately.");
for (const marker of ["Company", "Level", "Region", "Stage"]) expect(directory.includes(marker), `Directory is missing the ${marker} filter.`);
for (const marker of ["fieldset", "legend", 'aria-live="polite"', "Reset filters", "fixedCompany", "initialCompany", "does not substitute unrelated reports"]) expect(directory.includes(marker), `Accessible company-scoped filtering is missing ${marker}.`);
for (const marker of ["canonicalInterviewExperienceCompany", "normalizeInterviewExperienceCompany"]) expect(companyNormalization.includes(marker), `Company normalization is missing ${marker}.`);
expect(actions.includes("canonicalInterviewExperienceCompany") && form.includes("canonicalInterviewExperienceCompany"), "Known company variants must be canonicalized in both client and server submission boundaries.");
expect(page.includes("Contribute a high-level experience") && page.includes("interview_experience_rounds"), "Route must provide contribution and reviewed process context.");
expect(page.includes("isAccountPlatformAvailable") && page.includes("accountPlatformAvailable ? await getAuthenticatedActor() : null"), "Account-disabled public routes must not initialize an unavailable authenticated contribution path.");
expect(page.includes("Contribution availability") && page.includes("accountPlatformAvailable={accountPlatformAvailable}") && page.includes("reports its own availability separately"), "The page must pass account availability to an honest contribution state without contradicting report-query availability.");
expect(!page.includes("share a privacy-conscious experience for moderation"), "Static metadata must not advertise contribution when the account platform can be disabled.");
const unavailableBranchStart = form.indexOf("if (!accountPlatformAvailable)");
const signedOutBranchStart = form.indexOf("if (!signedIn)");
const unavailableBranch = form.slice(unavailableBranchStart, signedOutBranchStart);
expect(unavailableBranchStart >= 0 && signedOutBranchStart > unavailableBranchStart, "Account unavailability must be handled before the enabled-but-signed-out state.");
for (const marker of ["Contributions are not available in this public configuration.", "when it is available", "nothing can be submitted from this state."]) expect(unavailableBranch.includes(marker), `Account-disabled contribution state is missing ${marker}`);
expect(!unavailableBranch.includes("/signin"), "Account-disabled contribution state must not advertise an inoperable sign-in action.");
expect(form.slice(signedOutBranchStart).includes("/signin?next=/interview-experiences#contribute") && form.slice(signedOutBranchStart).includes("Sign in to contribute"), "Enabled signed-out visitors must retain the contribution sign-in handoff.");
expect(/\.experience-directory-empty p\s*\{[^}]*font-size:\s*var\(--type-meta\)/s.test(globalStyles), "Unavailable-state explanatory copy must preserve the 13px readability floor.");
expect(actions.includes("getAuthenticatedActor") && actions.includes("save_interview_experience_draft"), "Mutations must authenticate and use the controlled RPC boundary.");
expect(!actions.includes("author_id:"), "Caller-controlled author identity is forbidden.");
const saveAction = actions.slice(actions.indexOf("export async function saveInterviewExperience"), actions.indexOf("const managementRpc"));
const manageAction = actions.slice(actions.indexOf("export async function manageInterviewExperience"));
expect(saveAction.indexOf("parseInterviewExperienceSaveInput") >= 0 && saveAction.indexOf("parseInterviewExperienceSaveInput") < saveAction.indexOf("getAuthenticatedActor") && saveAction.indexOf("getAuthenticatedActor") < saveAction.indexOf('rpc("save_interview_experience_draft"'), "Save input must be parsed before actor lookup and draft persistence.");
expect(manageAction.indexOf("parseInterviewExperienceManagementInput") >= 0 && manageAction.indexOf("parseInterviewExperienceManagementInput") < manageAction.indexOf("getAuthenticatedActor") && manageAction.indexOf("getAuthenticatedActor") < manageAction.indexOf("actor.supabase.rpc"), "Management input must be parsed before actor lookup and destructive RPC dispatch.");
expect(actions.includes("managementRpc[parsed.value.action]") && !manageAction.includes('const rpc = action === "withdraw"'), "Management RPC selection must use only the parsed exact action allowlist without a delete fallback.");
for (const marker of ["Save private draft", "Submit for review", "Withdraw", "Delete", "publicationConsent", "exact proprietary questions", "editableStatuses", "setInput({ id: item.id", "Cancel edit", "Preview report", "Return to edit", "This is not public yet", "preview.publicationConsent"]) expect(form.includes(marker), `Submission UI is missing ${marker}.`);
expect(form.includes('editableStatuses.has(item.status) && <button') && !form.includes('submitted", "approved"'), "Only draft, needs_changes, and withdrawn reports may enter edit mode.");
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("Interview Experiences v1 passed: directory-first publication, executable action validation, authenticated submission, moderation states, and controlled publication boundaries are present.");
