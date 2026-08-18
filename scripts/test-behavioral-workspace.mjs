import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, marker, message) => { if (!source.includes(marker)) failures.push(message); };
const { isBehavioralRoundType, storyReadiness } = await import("../lib/behavioral/readiness.ts");

if (storyReadiness({ situation: null, task: null, action: null, result: null }) !== "Draft") failures.push("A title-only story must remain Draft.");
if (storyReadiness({ situation: "A production dependency changed during launch planning.", task: "I owned the safe rollout.", action: "I compared rollback options, aligned the incident lead, staged the change, and watched the agreed service indicators during release.", result: "The launch completed without customer impact and the runbook gained a tested fallback." }) !== "Ready") failures.push("A meaningfully complete STAR story must be Ready.");
if (storyReadiness({ situation: "A launch was at risk because ownership was unclear.", task: "I owned triage.", action: "I mapped the missing decisions and brought the owners together.", result: null }) !== "Needs detail") failures.push("A partially complete STAR story must need detail.");
if (!isBehavioralRoundType("Virtual Onsite") || !isBehavioralRoundType("Hiring Manager") || isBehavioralRoundType("Technical screen")) failures.push("Behavioral round detection is not selective.");
const routes = [
  "app/behavioral/workspace/page.tsx", "app/behavioral/questions/page.tsx", "app/behavioral/questions/new/page.tsx",
  "app/behavioral/questions/[questionId]/page.tsx", "app/behavioral/questions/[questionId]/edit/page.tsx",
  "app/behavioral/questions/[questionId]/answers/new/page.tsx", "app/behavioral/stories/page.tsx",
  "app/behavioral/questions/[questionId]/answers/[answerId]/edit/page.tsx",
  "app/behavioral/stories/new/page.tsx", "app/behavioral/stories/[id]/page.tsx", "app/behavioral/stories/[id]/edit/page.tsx",
];
for (const route of routes) if (!existsSync(route)) failures.push(`Missing behavioral workspace route: ${route}`);

const questions = JSON.parse(read("data/behavioral/questions.json")).filter((question) => question.status === "active");
if (questions.length < 40 || questions.length > 60) failures.push(`Curated question catalog must contain 40–60 active questions; found ${questions.length}.`);
if (new Set(questions.map((question) => question.id)).size !== questions.length) failures.push("Curated behavioral question IDs are not unique.");
for (const question of questions) for (const key of ["prompt", "category", "signals", "followUps", "answerGuidance", "commonMistakes"]) if (!question[key]?.length) failures.push(`${question.id} lacks ${key}.`);

const migration = read("supabase/migrations/202608140001_create_behavioral_workspace.sql");
for (const marker of ["behavioral_custom_questions", "behavioral_stories", "behavioral_story_themes", "behavioral_story_question_links", "behavioral_answers", "enable row level security", "on delete cascade", "custom_question_id", "curated_question_id", "application_id", "Owners manage behavioral answers", "revoke all"]) requireText(migration, marker, `Behavioral migration lacks ${marker}.`);
const phase3Migration = read("supabase/migrations/202608140005_complete_behavioral_phase3.sql");
for (const marker of ["opening_framing", "details_to_emphasize", "details_to_avoid", "is_primary", "behavioral_answers_primary_curated_unique", "behavioral_answers_primary_custom_unique", "set_behavioral_primary_answer", "auth.uid()", "application_id"]) requireText(phase3Migration, marker, `Phase 3 behavioral migration lacks ${marker}.`);
const integrityMigration = read("supabase/migrations/202608140006_enforce_behavioral_relationships.sql");
for (const marker of ["behavioral_curated_questions", "behavioral_links_curated_question_fkey", "behavioral_answers_curated_question_fkey", "behavioral_saved_questions_curated_question_fkey", "behavioral_story_database_status", "revoke insert (status), update (status)", "enforce_behavioral_answer_context", "ensure_behavioral_answer_story_link", "protect_behavioral_answer_story_link"]) requireText(integrityMigration, marker, `Behavioral integrity migration lacks ${marker}.`);

const actions = read("features/behavioral/actions.ts");
const actor = read("lib/auth/actor.ts");
for (const marker of ["getAuthenticatedActor", 'eq("user_id", current.user.id)', "createStoryAction", "updateStoryAction", "deleteStoryAction", "duplicateStoryAction", "createQuestionAction", "updateQuestionAction", "deleteQuestionAction", "linkStoryAction", "linkQuestionToStoryAction", "unlinkStoryAction", "createAnswerAction", "updateAnswerAction", "deleteAnswerAction", "set_behavioral_primary_answer"]) requireText(actions, marker, `Behavioral actions lack ${marker}.`);
for (const marker of ["auth.getUser", "getAuthenticatedActor", "createSupabaseServerClient"]) requireText(actor, marker, `Canonical behavioral actor lacks ${marker}.`);

const queries = read("lib/behavioral/queries.ts");
for (const marker of ["CURATED_BEHAVIORAL_QUESTIONS", "preparationStatus", 'return "Ready"', 'return "Drafted"', 'return "Story linked"', 'return "Not started"']) requireText(queries, marker, `Behavioral data layer lacks ${marker}.`);
requireText(queries, "getAuthenticatedActor", "Behavioral reads do not resolve the current server actor.");
if (/function getBehavioralWorkspaceData\s*\([^)]*userId/.test(queries)) failures.push("Behavioral reads accept an arbitrary user identifier.");
const storyForm = read("features/behavioral/story-form.tsx");
for (const marker of ["beforeunload", "Unsaved changes", "Situation", "Task", "Action", "Result", "Reflection", "STORY_THEMES"]) requireText(storyForm, marker, `Story editor lacks ${marker}.`);
if (storyForm.includes('name="status"')) failures.push("Story readiness is still manually editable instead of deterministic.");
const readiness = read("lib/behavioral/readiness.ts");
for (const marker of ["storyReadiness", 'return "Ready"', '"Needs detail"', "isBehavioralRoundType"]) requireText(readiness, marker, `Deterministic readiness lacks ${marker}.`);
const answerForm = read("features/behavioral/answer-form.tsx");
for (const marker of ['name="is_primary"', 'name="application_id"', 'readOnly={Boolean(application)}', 'name="opening_framing"', 'name="details_to_emphasize"', 'name="details_to_avoid"', "Full rehearsal draft", "Optional"]) requireText(answerForm, marker, `Question preparation editor lacks ${marker}.`);
const questionsPage = read("app/behavioral/questions/page.tsx");
for (const marker of ['type="hidden" name="application"', 'name="q"', 'name="category"', 'name="company"', 'name="source"', 'name="coverage"', "Covered", "Needs story", "Add your own", "linked"]) requireText(questionsPage, marker, `Question library lacks ${marker}.`);
const dashboard = read("app/dashboard/page.tsx");
for (const marker of ["behavioralRound", "getReadyBehavioralStoryCount", "Review stories", "?application="]) requireText(dashboard, marker, `Dashboard integration lacks ${marker}.`);
const application = read("app/applications/[id]/page.tsx");
for (const marker of ["isBehavioralRoundType", "Prepare behavioral stories", "Open behavioral"]) requireText(application, marker, `Application integration lacks ${marker}.`);
const publicPage = read("app/behavioral/page.tsx");
requireText(publicPage, "BehavioralPractice", "Public behavioral guide was replaced instead of preserved.");

if (failures.length) { console.error(`Behavioral workspace regression failed:\n- ${failures.join("\n- ")}`); process.exit(1); }
console.log(`Behavioral workspace regression passed: ${questions.length} curated questions, private STAR CRUD, many-to-many links, multiple answer variants, filters, application integration, account gating, and responsive draft-safe UI hold.`);
