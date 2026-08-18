import { readFileSync } from "node:fs";
import { canonicalDsaQuestionById, canonicalDsaQuestions } from "../lib/dsa/catalog.ts";
import { dsaInterviewQuestionDatabase } from "../data/dsa/question-database.ts";
import { roadmapProblems } from "../data/dsa/roadmap-problem-registry.ts";
import { chooseContinueQuestion, getNeedsReview, getRoadmapProgress, getTopicProgress, progressByQuestionId } from "../lib/dsa/progress.ts";

const checks = [];
const check = (name, value) => checks.push({ name, ok: Boolean(value) });
const read = (path) => readFileSync(path, "utf8");
const row = (question_id, status, confidence = null, offset = 0) => ({ user_id: "fixture", question_id, status, confidence, bookmarked: false, notes: null, first_attempted_at: status === "not_started" ? null : `2026-08-${String(10 + offset).padStart(2, "0")}T12:00:00Z`, last_practiced_at: status === "not_started" ? null : `2026-08-${String(10 + offset).padStart(2, "0")}T12:00:00Z`, solved_at: ["solved", "review"].includes(status) ? `2026-08-${String(10 + offset).padStart(2, "0")}T12:00:00Z` : null, created_at: "2026-08-10T12:00:00Z", updated_at: "2026-08-10T12:00:00Z" });

const ids = canonicalDsaQuestions.map((question) => question.id);
const browserIds = dsaInterviewQuestionDatabase.map((question) => question.id);
const roadmapIds = roadmapProblems.map((question) => question.id);
check("canonical IDs are globally unique", new Set(ids).size === ids.length);
check("Two Sum uses the stable canonical slug", canonicalDsaQuestionById.has("two-sum") && !canonicalDsaQuestionById.has("demo-two-sum"));
check("Longest Substring uses one cross-surface ID", browserIds.includes("longest-substring-without-repeating-characters") && roadmapIds.includes("longest-substring-without-repeating-characters"));
check("every browser question belongs to the catalog", browserIds.every((id) => canonicalDsaQuestionById.has(id)));
check("every roadmap question belongs to the catalog", roadmapIds.every((id) => canonicalDsaQuestionById.has(id)));
check("catalog identity does not depend on array position", canonicalDsaQuestions[0].id !== "0" && canonicalDsaQuestions.at(-1).id !== String(canonicalDsaQuestions.length - 1));

const progress = progressByQuestionId([
  row("two-sum", "attempted", "medium", 1),
  row("longest-substring-without-repeating-characters", "solved", "low", 2),
  row("course-schedule", "review", "high", 3),
]);
check("progress rows are keyed by canonical question ID", progress["two-sum"]?.status === "attempted");
check("Continue prioritizes explicit review", chooseContinueQuestion("sde2", progress)?.id === "course-schedule");
check("Continue prioritizes attempted when review is absent", chooseContinueQuestion("sde2", progressByQuestionId([row("two-sum", "attempted", "medium", 1), row("longest-substring-without-repeating-characters", "solved", "low", 2)]))?.id === "two-sum");
check("roadmap progress treats solved as complete", getRoadmapProgress("sde2", progress).completed >= 1);
check("roadmap progress treats review as complete", getRoadmapProgress("sde2", progress).completed >= 2);
check("Needs review includes attempted", getNeedsReview(progress).some((entry) => entry.question.id === "two-sum"));
check("Needs review includes low-confidence solved", getNeedsReview(progress).some((entry) => entry.question.id === "longest-substring-without-repeating-characters"));
check("Needs review includes explicit review", getNeedsReview(progress).some((entry) => entry.question.id === "course-schedule"));
check("topic summaries derive from question activity", getTopicProgress(progress).some((topic) => topic.practiced > 0));

const migration = read("supabase/migrations/202608140007_create_dsa_question_progress.sql");
const seedBlock = migration.match(/select unnest\(array\[([\s\S]*?)\]\);/)?.[1] ?? "";
const seeded = new Set([...seedBlock.matchAll(/'([^']+)'/g)].map((match) => match[1]));
check("database catalog seed matches the application catalog", ids.every((id) => seeded.has(id)) && seeded.size === ids.length);
check("database rejects unknown canonical IDs", migration.includes("Unknown canonical DSA question") && migration.includes("dsa_question_progress_question_id_fkey") === false && migration.includes("references public.dsa_question_catalog"));
check("database status vocabulary is exact", migration.includes("'not_started','attempted','solved','review'"));
check("private notes have a bounded constraint", migration.includes("char_length(notes) <= 5000"));
check("views do not update last practiced", migration.includes("last_practiced_at = case") && migration.includes("status is distinct from excluded.status"));
check("RLS and server-authoritative RPC are present", migration.includes("enable row level security") && migration.includes("security definer") && migration.includes("auth.uid()"));

const routes = read("app/dsa/[...segments]/page.tsx");
const browser = read("features/dsa/questions/question-browser.tsx");
const practice = read("features/dsa/progress/practice-workspace.tsx");
check("public questions and private My Practice share the existing route", routes.includes("libraryOnly={segments[0] === \"questions\"}") && routes.includes("PracticeWorkspace"));
check("application context survives library filters and review navigation", browser.includes('params.set("application", retainedApplication)') && practice.includes('params.set("application", application.id)') && practice.includes('params.set("company", application.company_slug)'));
check("question detail preserves application and company context", read("features/dsa/progress/question-detail.tsx").includes('params.set("application", applicationId)') && read("features/dsa/progress/question-detail.tsx").includes('params.set("company", companySlug)'));
check("dashboard and application cues open DSA practice", read("app/dashboard/page.tsx").includes("dashboard-dsa-cue") && read("app/applications/[id]/page.tsx").includes("tracker-dsa-cta"));
check("My Practice exposes deterministic Continue, recent, review, topics, and roadmap switching", ["Continue", "Recent practice", "Needs review", "Topic progress", "Preferred roadmap"].every((marker) => practice.includes(marker)));
check("dashboard completion and review counts use canonical derivations", read("lib/dsa/queries.ts").includes("getRoadmapProgress(state.preferredRoadmap") && read("lib/dsa/queries.ts").includes("getNeedsReview(state.progress).length"));
check("dashboard coding context preserves the company slug", read("app/dashboard/page.tsx").includes('params.set("company", application.company_slug)'));
check("company question routes receive private progress when signed in", routes.includes("progress={state.progress} signedIn={state.signedIn}"));
check("roadmap status uses status and confidence without legacy comfortable state", !read("data/dsa/roadmap-planning.ts").includes('"comfortable"') && read("data/dsa/roadmap-planning.ts").includes("confidenceByProblemId"));
check("quick mutations expose pending and accessible error feedback", read("features/dsa/progress/quick-progress-actions.tsx").includes("Saving…") && read("features/dsa/progress/quick-progress-actions.tsx").includes('role="alert"') && read("features/dsa/progress/roadmap-preference-controls.tsx").includes("Saving preferred roadmap…"));

const failed = checks.filter((entry) => !entry.ok);
if (checks.length !== 31) throw new Error(`Expected 31 regression checks, found ${checks.length}.`);
if (failed.length) {
  console.error(`DSA progress regression failed:\n- ${failed.map((entry) => entry.name).join("\n- ")}`);
  process.exit(1);
}
console.log(`DSA progress regression passed: ${checks.length}/${checks.length} canonical identity, derivation, privacy, routing, and context checks.`);
