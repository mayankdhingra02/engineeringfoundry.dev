import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseInterviewPlaybookDiagnosticInputForm } from "../lib/interview-playbook/diagnostic-input-form.ts";
import { INTERVIEW_PREPARATION_AREAS } from "../lib/interview-playbook/evidence.ts";
import { buildInterviewDiagnosticSnapshot } from "../lib/interview-playbook/diagnostic.ts";
import { buildAdaptiveInterviewPlan } from "../lib/interview-playbook/planning.ts";
import { buildInterviewPlaybookPlanningProjection } from "../lib/interview-playbook/planner-integration.ts";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const migration = read("supabase/migrations/202608190001_create_interview_playbook_diagnostic_inputs.sql");
const pgtapTest = read("supabase/tests/database/interview_playbook_diagnostic_inputs.test.sql");
const diagnosticInputsSource = read("lib/interview-playbook/diagnostic-inputs.ts");
const diagnosticInputFormSource = read("lib/interview-playbook/diagnostic-input-form.ts");
const actionsSource = read("app/interview-playbook/actions.ts");
const componentSource = read("components/interview-playbook/diagnostic-input-form.tsx");
const pageSource = read("app/interview-playbook/page.tsx");
const exportSource = read("lib/account/export.ts");
const styles = read("app/globals.css");
const databaseTypes = read("lib/supabase/database.types.ts");

const cases = [];
const check = (name, ok) => cases.push([name, Boolean(ok)]);
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function formDataOf(entries) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) formData.set(key, value);
  return formData;
}

// =====================================================================
// 1. DB/migration source contract
// =====================================================================
for (const table of [
  "interview_playbook_diagnostic_settings",
  "interview_playbook_confidence",
  "interview_playbook_priorities",
  "interview_playbook_constraints",
]) {
  check(`migration creates table ${table}`, migration.includes(`create table public.${table}`));
  check(`${table} owner FK cascades from public.profiles`, new RegExp(`create table public\\.${table}[\\s\\S]{0,400}references public\\.profiles\\(id\\) on delete cascade`).test(migration));
}
check("settings table checks available_hours_per_week between 0 and 168", migration.includes("available_hours_per_week between 0 and 168"));
check("settings table checks behavioral coverage enum", migration.includes("behavioral_stories_coverage in ('unknown', 'not-started', 'partial', 'covered')"));
check("settings table checks project deep dive coverage enum", migration.includes("project_deep_dive_coverage in ('unknown', 'not-started', 'partial', 'covered')"));
check("confidence table forbids storing 'unknown'", /confidence in \('low', 'medium', 'high'\)/.test(migration) && !/confidence in \([^)]*'unknown'/.test(migration));
check("priorities table checks position between 1 and 9", migration.includes('"position" between 1 and 9'));
check("constraints table checks category enum", migration.includes("category in ('work', 'school', 'health', 'family', 'other')"));
check("constraints table forbids blank/oversized descriptions", migration.includes("btrim(description) <> ''") && migration.includes("char_length(description) <= 500"));
check("constraints table checks position between 1 and 10", migration.includes('"position" between 1 and 10'));
check("constraints table has no severity/impact/hours-lost/medical/disability/productivity column", !/\b(severity_score|impact_score|hours_lost|medical_condition|disability_status|productivity_impact)\b/i.test(migration));

check("RPC is named save_interview_playbook_diagnostic_inputs", migration.includes("create or replace function public.save_interview_playbook_diagnostic_inputs("));
check("RPC is security definer", /save_interview_playbook_diagnostic_inputs\([\s\S]{0,2000}?security definer/.test(migration));
check("RPC sets search_path = public, pg_temp", migration.includes("set search_path = public, pg_temp"));
{
  const signatureMatch = migration.match(/create or replace function public\.save_interview_playbook_diagnostic_inputs\(([\s\S]*?)\)\s*\nreturns/);
  check("RPC signature never accepts a caller-supplied user id", Boolean(signatureMatch) && !/user_id/i.test(signatureMatch[1]));
}
check("RPC derives ownership from auth.uid()", migration.includes("current_user_id uuid := auth.uid()"));
check("RPC raises 42501 when unauthenticated", /current_user_id is null[\s\S]{0,80}errcode = '42501'/.test(migration));
check("RPC re-validates hours range server-side", migration.includes("available_hours_per_week_value < 0 or available_hours_per_week_value > 168"));
check("RPC caps confidence entries at 9", migration.includes("jsonb_array_length(confidence_entries) > 9"));
check("RPC caps priority areas at 9", /array_length\(priority_areas, 1\) > 9/.test(migration));
check("RPC caps constraint entries at 10", migration.includes("jsonb_array_length(constraint_entries) > 10"));
check("RPC rejects duplicate confidence areas", migration.includes("Duplicate confidence area"));
check("RPC rejects duplicate priority areas", migration.includes("Duplicate priority area"));
check("RPC derives priority position from input order via WITH ORDINALITY", /interview_playbook_priorities[\s\S]{0,300}from unnest\(priority_areas\) with ordinality as ordered\(area_value, ordinal\)/.test(migration));
check("RPC derives constraint position from input order via WITH ORDINALITY", /interview_playbook_constraints[\s\S]{0,300}from jsonb_array_elements\(constraint_entries\) with ordinality as ordered\(entry_row, ordinal\)/.test(migration));
check("priority position is cast from the ordinal, not row_number()", /interview_playbook_priorities[\s\S]{0,200}ordered\.ordinal::smallint/.test(migration));
check("constraint position is cast from the ordinal, not row_number()", /interview_playbook_constraints[\s\S]{0,200}ordered\.ordinal::smallint/.test(migration));
check("row_number() over () is no longer used for priority/constraint ordering", !migration.includes("row_number() over ()"));
check("RPC execute grant is restricted to authenticated", migration.includes("grant execute on function public.save_interview_playbook_diagnostic_inputs(numeric, jsonb, text[], jsonb, text, text) to authenticated"));

check("RLS is enabled on all four tables", ["interview_playbook_diagnostic_settings", "interview_playbook_confidence", "interview_playbook_priorities", "interview_playbook_constraints"].every((table) => migration.includes(`alter table public.${table} enable row level security`)));
check("exactly 4 SELECT policies exist (owner-scoped)", (migration.match(/for select to authenticated/g) ?? []).length === 4);
check("no direct INSERT/UPDATE/DELETE policy exists on these tables", !/for (insert|update|delete)/i.test(migration));
check("authenticated write privileges are revoked on all four tables", /revoke all on table[\s\S]*interview_playbook_diagnostic_settings[\s\S]*interview_playbook_confidence[\s\S]*interview_playbook_priorities[\s\S]*interview_playbook_constraints[\s\S]*from anon, authenticated/.test(migration));
check("only SELECT is granted back to authenticated (no direct writes)", (migration.match(/grant select on table public\.interview_playbook_/g) ?? []).length === 4 && !/grant (insert|update|delete) on table public\.interview_playbook_/.test(migration));
check("migration reloads PostgREST schema cache", migration.includes("notify pgrst, 'reload schema';"));
check("migration is wrapped in a single transaction", migration.trimStart().startsWith("begin;") && migration.trimEnd().endsWith("commit;"));

// pgTAP test file: plan() count must match the actual number of assertions.
{
  const planMatch = pgtapTest.match(/select plan\((\d+)\);/);
  const assertionCount = (pgtapTest.match(/^select (ok|is|throws_ok|lives_ok)\(/gm) ?? []).length;
  check("pgTAP plan() count matches the actual assertion count", Boolean(planMatch) && Number(planMatch[1]) === assertionCount);
}
check("pgTAP test proves cross-user isolation", pgtapTest.includes("bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb"));
check("pgTAP test proves cascade deletion from auth.users", /delete from auth\.users where id = 'aaaaaaaa/.test(pgtapTest));
check("pgTAP test proves atomic rollback on a rejected save", pgtapTest.includes("bad-value"));

// database.types.ts contract
for (const table of ["interview_playbook_diagnostic_settings", "interview_playbook_confidence", "interview_playbook_priorities", "interview_playbook_constraints"]) {
  check(`database.types.ts declares table ${table}`, databaseTypes.includes(`${table}: {`));
}
check("database.types.ts declares the RPC", databaseTypes.includes("save_interview_playbook_diagnostic_inputs: {"));

// =====================================================================
// 2. Pure form parsing (lib/interview-playbook/diagnostic-input-form.ts)
// =====================================================================
{
  const result = parseInterviewPlaybookDiagnosticInputForm(formDataOf({}));
  check("blank hours field parses to null", result.ok && result.value.availableHoursPerWeek === null);
  check("blank form has no confidence entries", result.ok && result.value.confidenceEntries.length === 0);
  check("blank form has no priority areas", result.ok && result.value.priorityAreas.length === 0);
  check("blank form has no constraint entries", result.ok && result.value.constraintEntries.length === 0);
  check("blank form coverage defaults to unknown", result.ok && result.value.behavioralStoriesCoverage === "unknown" && result.value.projectDeepDiveCoverage === "unknown");
}
{
  const result = parseInterviewPlaybookDiagnosticInputForm(formDataOf({ availableHoursPerWeek: "12.5" }));
  check("valid fractional hours parse correctly", result.ok && result.value.availableHoursPerWeek === 12.5);
}
check("hours '0' parses to 0 (not treated as blank)", parseInterviewPlaybookDiagnosticInputForm(formDataOf({ availableHoursPerWeek: "0" })).value.availableHoursPerWeek === 0);
check("hours '168' (boundary) is accepted", parseInterviewPlaybookDiagnosticInputForm(formDataOf({ availableHoursPerWeek: "168" })).ok);
check("hours '169' (over boundary) is rejected", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ availableHoursPerWeek: "169" })).ok);
check("hours '-1' is rejected", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ availableHoursPerWeek: "-1" })).ok);
check("non-numeric hours is rejected", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ availableHoursPerWeek: "not-a-number" })).ok);

{
  const result = parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "confidence:system-design": "high" }));
  check("confidence 'Not set' is omitted; a set value is included", result.ok && result.value.confidenceEntries.length === 1 && result.value.confidenceEntries[0].area === "system-design" && result.value.confidenceEntries[0].confidence === "high");
}
check("an invalid confidence value is rejected", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "confidence:system-design": "extremely-confident" })).ok);

{
  const result = parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "priority:behavioral": "2", "priority:system-design": "1" }));
  check("priority ranks are sorted by rank, not by area declaration order", result.ok && deepEqual(result.value.priorityAreas, ["system-design", "behavioral"]));
}
check("duplicate priority ranks are rejected", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "priority:behavioral": "1", "priority:system-design": "1" })).ok);
check("an out-of-range priority rank is rejected", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "priority:system-design": "10" })).ok);
check("a non-integer priority rank is rejected", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "priority:system-design": "1.5" })).ok);

{
  const result = parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "constraint:0:description": "  ", "constraint:0:category": "work" }));
  check("a blank constraint description is silently ignored, not an error", result.ok && result.value.constraintEntries.length === 0);
}
check("a non-blank constraint description without a category is rejected", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "constraint:0:description": "Evening classes" })).ok);
{
  const result = parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "constraint:0:description": "Evening classes", "constraint:0:category": "school" }));
  check("a valid constraint row parses with trimmed description", result.ok && result.value.constraintEntries[0].category === "school" && result.value.constraintEntries[0].description === "Evening classes");
}
check("a 500-character constraint description is accepted", parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "constraint:0:description": "a".repeat(500), "constraint:0:category": "other" })).ok);
check("a 501-character constraint description is rejected", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "constraint:0:description": "a".repeat(501), "constraint:0:category": "other" })).ok);
{
  const result = parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "constraint:10:description": "Row past the cap", "constraint:10:category": "other" }));
  check("only the first 10 constraint rows (index 0-9) are ever read", result.ok && result.value.constraintEntries.length === 0);
}

check("coverage 'covered' passes through unchanged", parseInterviewPlaybookDiagnosticInputForm(formDataOf({ behavioralStoriesCoverage: "covered" })).value.behavioralStoriesCoverage === "covered");
check("an invalid coverage value is rejected", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ projectDeepDiveCoverage: "totally-ready" })).ok);

{
  const full = formDataOf({
    availableHoursPerWeek: "10",
    "confidence:system-design": "low",
    "priority:system-design": "1",
    "constraint:0:category": "work",
    "constraint:0:description": "On call this week",
    behavioralStoriesCoverage: "partial",
    projectDeepDiveCoverage: "covered",
  });
  const result = parseInterviewPlaybookDiagnosticInputForm(full);
  check("a full realistic submission parses to a single coherent payload", result.ok
    && result.value.availableHoursPerWeek === 10
    && result.value.confidenceEntries.length === 1
    && result.value.priorityAreas.length === 1
    && result.value.constraintEntries.length === 1
    && result.value.behavioralStoriesCoverage === "partial"
    && result.value.projectDeepDiveCoverage === "covered");
}

// =====================================================================
// 3. Persistence/query architecture (lib/interview-playbook/diagnostic-inputs.ts)
// =====================================================================
check("diagnostic-inputs.ts declares itself server-only", diagnosticInputsSource.trimStart().startsWith('import "server-only";'));
check("diagnostic-inputs.ts loads all four tables in one bounded Promise.all", /Promise\.all\(\[[\s\S]{0,900}interview_playbook_diagnostic_settings[\s\S]{0,900}interview_playbook_confidence[\s\S]{0,900}interview_playbook_priorities[\s\S]{0,900}interview_playbook_constraints[\s\S]{0,900}\]\)/.test(diagnosticInputsSource));
check("every load query is scoped to the authenticated actor's id", (diagnosticInputsSource.match(/\.eq\("user_id", actor\.user\.id\)/g) ?? []).length === 4);
check("priorities are loaded ordered by position", /interview_playbook_priorities[\s\S]{0,200}\.order\("position"/.test(diagnosticInputsSource));
check("constraints are loaded ordered by position", /interview_playbook_constraints[\s\S]{0,200}\.order\("position"/.test(diagnosticInputsSource));
check("diagnostic-inputs.ts never writes directly to these tables (no .insert/.update/.delete)", !/\.insert\(|\.update\(|\.delete\(/.test(diagnosticInputsSource));
check("diagnostic-inputs.ts writes exclusively through the RPC", (diagnosticInputsSource.match(/\.rpc\("save_interview_playbook_diagnostic_inputs"/g) ?? []).length === 1);
check("the loader always sets evidence: [] (no performance evidence in this phase)", diagnosticInputsSource.includes("evidence: []"));
check("hasSavedInputs is false when no settings row exists (legitimate no-saved-input branch)", /if \(!settings\) return neutralDiagnosticInputs\(\);/.test(diagnosticInputsSource));
check("diagnostic-inputs.ts imports the established PrivateDataUnavailableError convention", diagnosticInputsSource.includes('import { PrivateDataUnavailableError } from "@/lib/persistence/errors";'));
check("a query failure throws PrivateDataUnavailableError, not the neutral fallback", /if \(settingsResult\.error \|\| confidenceResult\.error \|\| prioritiesResult\.error \|\| constraintsResult\.error\) \{\s*throw new PrivateDataUnavailableError\(/.test(diagnosticInputsSource));
check("the PrivateDataUnavailableError label is a plain string literal (no db error text, user id, or table name leaked)", /throw new PrivateDataUnavailableError\("[^"$]+"\);/.test(diagnosticInputsSource) && !diagnosticInputsSource.includes("throw new PrivateDataUnavailableError(`"));
check("the query-failure branch and the no-settings branch are distinct, sequential code paths", diagnosticInputsSource.indexOf("throw new PrivateDataUnavailableError") < diagnosticInputsSource.indexOf("if (!settings) return neutralDiagnosticInputs();"));
check("neutral is returned only for signed-out and no-settings-row (exactly 2 return sites; the query-failure branch is not one of them)", (diagnosticInputsSource.match(/return neutralDiagnosticInputs\(\);/g) ?? []).length === 2);

// =====================================================================
// 4. Server action safety (app/interview-playbook/actions.ts)
// =====================================================================
check("actions.ts is a server action module", actionsSource.trimStart().startsWith('"use server";'));
check("actions.ts resolves the actor from the session, never from formData", actionsSource.includes("getAuthenticatedActor()") && !/formData\.get\("user(Id|_id)?"\)/.test(actionsSource));
check("actions.ts revalidates the Interview Playbook page after saving", actionsSource.includes('revalidatePath("/interview-playbook")'));
check("actions.ts never logs form content (no console.* calls)", !/console\.\w+\(/.test(actionsSource));
check("actions.ts saves through the actor-scoped helper, not a raw RPC call", actionsSource.includes("saveInterviewPlaybookDiagnosticInputsForActor(actor, parsed.value)") && !actionsSource.includes(".rpc("));

// =====================================================================
// 5. Planner integration behavioral proofs
// =====================================================================
function neutralCoverage() {
  return { behavioralStories: "unknown", projectDeepDive: "unknown" };
}

function diagnosticInputOf(overrides) {
  return {
    availableHoursPerWeek: null,
    confidenceByArea: {},
    constraints: [],
    priorities: [],
    evidence: [],
    coverage: neutralCoverage(),
    ...overrides,
  };
}

function target(overrides) {
  return { id: "t1", daysUntil: 20, areas: ["system-design"], needsSignalClarification: false, ...overrides };
}

function actionsFor(plan, area) {
  return plan.actions.filter((action) => action.area === area);
}

{
  const snapshot = buildInterviewDiagnosticSnapshot(diagnosticInputOf({ confidenceByArea: { "system-design": "low" } }));
  const dimension = snapshot.dimensions.find((d) => d.area === "system-design");
  check("with no evidence, evidenceState is 'unknown' regardless of self-reported confidence", dimension.evidenceState === "unknown");
  const plan = buildAdaptiveInterviewPlan({ diagnostic: snapshot, targets: [target({ daysUntil: 20 })] });
  const kinds = actionsFor(plan, "system-design").map((a) => a.kind);
  check("low confidence + generous (30-day) horizon -> learn, worked-example, practice", deepEqual(kinds, ["learn", "worked-example", "practice"]));
}
{
  const snapshot = buildInterviewDiagnosticSnapshot(diagnosticInputOf({ confidenceByArea: { "system-design": "high" } }));
  const plan = buildAdaptiveInterviewPlan({ diagnostic: snapshot, targets: [target({ daysUntil: 20 })] });
  const kinds = actionsFor(plan, "system-design").map((a) => a.kind);
  check("high confidence -> baseline-check, never review or learn (no observed evidence exists)", deepEqual(kinds, ["baseline-check"]));
}
{
  // Urgent (3-day) horizon: a priority area outside the target's areas is deferred, not widened into scope.
  const snapshot = buildInterviewDiagnosticSnapshot(diagnosticInputOf({ priorities: ["behavioral"] }));
  const plan = buildAdaptiveInterviewPlan({ diagnostic: snapshot, targets: [target({ daysUntil: 2, areas: ["system-design"] })] });
  check("urgent horizon defers an outside-target priority instead of expanding scope", plan.deferred.some((d) => d.area === "behavioral" && d.reason === "explicit-priority-outside-urgent-target"));
  check("the deferred priority area produces no action under an urgent horizon", actionsFor(plan, "behavioral").length === 0);
}
{
  // Generous (30-day) horizon: the same priority area widens scope instead of being deferred.
  const snapshot = buildInterviewDiagnosticSnapshot(diagnosticInputOf({ priorities: ["behavioral"] }));
  const plan = buildAdaptiveInterviewPlan({ diagnostic: snapshot, targets: [target({ daysUntil: 20, areas: ["system-design"] })] });
  check("a 30-day horizon widens scope to include an explicit priority area", actionsFor(plan, "behavioral").length > 0);
  check("the widened priority area is not deferred under a 30-day horizon", !plan.deferred.some((d) => d.area === "behavioral"));
}
{
  const snapshot = buildInterviewDiagnosticSnapshot(diagnosticInputOf({ availableHoursPerWeek: 0 }));
  const plan = buildAdaptiveInterviewPlan({ diagnostic: snapshot, targets: [target({ daysUntil: 20 })] });
  check("0 available hours suppresses every non-final-phase preparation action", plan.actions.every((action) => action.stage === "final-phase"));
  check("0 available hours defers every scope area for zero-capacity", plan.deferred.some((d) => d.area === "system-design" && d.reason === "zero-capacity"));
}
{
  const withoutConstraints = buildInterviewDiagnosticSnapshot(diagnosticInputOf({ confidenceByArea: { "system-design": "low" } }));
  const withConstraints = buildInterviewDiagnosticSnapshot(diagnosticInputOf({
    confidenceByArea: { "system-design": "low" },
    constraints: [{ id: "c1", category: "work", description: "On call this week" }],
  }));
  const planA = buildAdaptiveInterviewPlan({ diagnostic: withoutConstraints, targets: [target({ daysUntil: 20 })] });
  const planB = buildAdaptiveInterviewPlan({ diagnostic: withConstraints, targets: [target({ daysUntil: 20 })] });
  check("constraints never change which actions are generated", deepEqual(planA.actions, planB.actions));
  check("constraints never change deferrals", deepEqual(planA.deferred, planB.deferred));
  check("constraints are still carried through as presentation-only context", planB.constraints.length === 1 && planB.constraints[0].category === "work");
}
for (const coverageValue of ["not-started", "partial"]) {
  const snapshot = buildInterviewDiagnosticSnapshot(diagnosticInputOf({ coverage: { behavioralStories: coverageValue, projectDeepDive: "unknown" } }));
  const dimension = snapshot.dimensions.find((d) => d.area === "behavioral");
  const plan = buildAdaptiveInterviewPlan({ diagnostic: snapshot, targets: [target({ daysUntil: 20, areas: ["behavioral"] })] });
  const kinds = actionsFor(plan, "behavioral").map((a) => a.kind);
  check(`Behavioral coverage '${coverageValue}' -> complete-coverage then baseline-check`, deepEqual(kinds, ["complete-coverage", "baseline-check"]));
  check(`Behavioral coverage '${coverageValue}' never becomes supported evidence`, dimension.evidenceState === "unknown");
}
{
  const snapshot = buildInterviewDiagnosticSnapshot(diagnosticInputOf({ coverage: { behavioralStories: "covered", projectDeepDive: "unknown" } }));
  const plan = buildAdaptiveInterviewPlan({ diagnostic: snapshot, targets: [target({ daysUntil: 20, areas: ["behavioral"] })] });
  const kinds = actionsFor(plan, "behavioral").map((a) => a.kind);
  check("Behavioral coverage 'covered' -> baseline-check only, coverage completion is not evidence", deepEqual(kinds, ["baseline-check"]));
}
{
  const snapshot = buildInterviewDiagnosticSnapshot(diagnosticInputOf({ coverage: { behavioralStories: "unknown", projectDeepDive: "partial" } }));
  const plan = buildAdaptiveInterviewPlan({ diagnostic: snapshot, targets: [target({ daysUntil: 20, areas: ["project-deep-dive"] })] });
  const kinds = actionsFor(plan, "project-deep-dive").map((a) => a.kind);
  check("Project Deep Dive coverage is wired independently of Behavioral coverage", deepEqual(kinds, ["complete-coverage", "baseline-check"]));
}

// --- Exact scenario A: Project Deep Dive 'covered' does NOT mean supported ---
{
  const snapshot = buildInterviewDiagnosticSnapshot(diagnosticInputOf({ coverage: { behavioralStories: "unknown", projectDeepDive: "covered" } }));
  const dimension = snapshot.dimensions.find((d) => d.area === "project-deep-dive");
  check("exact scenario A: Project Deep Dive 'covered' still yields evidenceState 'unknown'", dimension.evidenceState === "unknown");
  const plan = buildAdaptiveInterviewPlan({ diagnostic: snapshot, targets: [target({ daysUntil: 20, areas: ["project-deep-dive"] })] });
  const kinds = actionsFor(plan, "project-deep-dive").map((a) => a.kind);
  check("exact scenario A: actions are exactly ['baseline-check'] (no complete-coverage/review/targeted-repair)", deepEqual(kinds, ["baseline-check"]));
}

// --- Exact scenario B: ML System Design priority widening / deferral ---------
{
  // 30-day band: ML System Design (a priority outside the target's areas) widens into scope.
  const snapshot = buildInterviewDiagnosticSnapshot(diagnosticInputOf({ priorities: ["system-design", "ml-system-design"] }));
  const plan = buildAdaptiveInterviewPlan({ diagnostic: snapshot, targets: [target({ daysUntil: 20, areas: ["system-design"] })] });
  check("exact scenario B (30-day): System Design appears in the plan", actionsFor(plan, "system-design").length > 0);
  check("exact scenario B (30-day): ML System Design enters planning scope", actionsFor(plan, "ml-system-design").length > 0);
  check("exact scenario B (30-day): ML System Design receives establish-evidence behavior (baseline-check)", deepEqual(actionsFor(plan, "ml-system-design").map((a) => a.kind), ["baseline-check"]));
  check("exact scenario B (30-day): ML System Design is NOT deferred as explicit-priority-outside-urgent-target", !plan.deferred.some((d) => d.area === "ml-system-design" && d.reason === "explicit-priority-outside-urgent-target"));
}
{
  // 3-day band: the same priorities now defer ML System Design instead of widening scope.
  const snapshot = buildInterviewDiagnosticSnapshot(diagnosticInputOf({ priorities: ["system-design", "ml-system-design"] }));
  const plan = buildAdaptiveInterviewPlan({ diagnostic: snapshot, targets: [target({ daysUntil: 3, areas: ["system-design"] })] });
  check("exact scenario B (3-day): System Design remains planned", actionsFor(plan, "system-design").length > 0);
  check("exact scenario B (3-day): ML System Design produces no preparation action", actionsFor(plan, "ml-system-design").length === 0);
  const mlDeferrals = plan.deferred.filter((d) => d.area === "ml-system-design" && d.reason === "explicit-priority-outside-urgent-target");
  check("exact scenario B (3-day): ML System Design is deferred exactly once with explicit-priority-outside-urgent-target", mlDeferrals.length === 1);
}

// projection source-description expansion
{
  const overview = { upcomingRounds: [{ id: "r1", applicationId: "a1", companyName: "Acme", roleTitle: "SWE", roundName: "Round 1", roundType: "System Design", scheduledAt: "2026-09-10T00:00:00Z", timezone: "UTC", state: "upcoming", needsSignalClarification: false, executionGuideSlugs: ["system-design"], preparationHref: "/x", preparation: { completed: 0, total: 0 } }], unscheduledRounds: [] };
  const now = new Date("2026-08-19T12:00:00Z");
  const withoutInputs = buildInterviewPlaybookPlanningProjection({ overview, now });
  const withInputsOmitted = buildInterviewPlaybookPlanningProjection({ overview, now, diagnosticInput: undefined });
  const withInputs = buildInterviewPlaybookPlanningProjection({ overview, now, diagnosticInput: diagnosticInputOf({ confidenceByArea: { "system-design": "high" } }) });
  check("source description records absent diagnostic inputs", withoutInputs.sourceDescription.hasSavedDiagnosticInputs === false);
  check("omitting diagnosticInput is byte-identical to not passing the field at all", deepEqual(withoutInputs, withInputsOmitted));
  check("source description records saved diagnostic inputs", withInputs.sourceDescription.hasSavedDiagnosticInputs === true);
}

// determinism
{
  const input = diagnosticInputOf({ confidenceByArea: { "system-design": "low" }, priorities: ["system-design"] });
  const before = JSON.stringify(input);
  const snapshot1 = buildInterviewDiagnosticSnapshot(input);
  const snapshot2 = buildInterviewDiagnosticSnapshot(input);
  check("same diagnostic input -> deeply equal snapshots", deepEqual(snapshot1, snapshot2));
  check("buildInterviewDiagnosticSnapshot does not mutate its input", JSON.stringify(input) === before);
}

// =====================================================================
// 6. UI source assertions (components/interview-playbook/diagnostic-input-form.tsx)
// =====================================================================
check("the form is collapsed by default (a <details> with no open attribute)", /<details[^>]*>/.test(componentSource) && !/<details[^>]*\bopen\b/.test(componentSource));
check("the disclosure is titled 'Personalize adaptive planning'", componentSource.includes("Personalize adaptive planning"));
check("copy states these inputs never become performance evidence", componentSource.includes("These inputs guide planning. They do not become performance evidence."));
check("copy states constraints never change evidence or score", componentSource.includes("Constraints are planning context only. They do not change evidence or score you."));
check("copy states coverage is material, not performance", componentSource.includes("Coverage describes preparation material, not interview performance."));
check("the form has no severity/diagnosis/disability/medical/productivity input", !/severity|diagnosis|disability|medical|productivity/i.test(componentSource));
check("confidence copy no longer overclaims that evidence state always comes from observed practice", !componentSource.includes("which always comes from observed practice"));
check("confidence copy states self-reported confidence guides planning but is not performance evidence", componentSource.includes("Self-reported confidence guides planning but does not become performance evidence."));
check("the form never claims ready/not-ready/pass/fail/candidate-strength verdicts", !/\b(ready|not ready|pass|fail|strong candidate|weak candidate)\b/i.test(componentSource));
check("the constraint category select has an accessible name", componentSource.includes("aria-label={`Constraint ${index + 1} category`}"));
check("the form iterates all 9 canonical areas structurally (never hardcoded per-area)", componentSource.includes("INTERVIEW_PREPARATION_AREAS.map((area) =>"));
check("each iterated area gets a confidence field", componentSource.includes("name={`confidence:${area}`}"));
check("each iterated area gets a priority field", componentSource.includes("name={`priority:${area}`}"));
check("INTERVIEW_PREPARATION_AREAS has exactly the 9 canonical areas", INTERVIEW_PREPARATION_AREAS.length === 9);
check("the form has a Behavioral stories coverage select", componentSource.includes('name="behavioralStoriesCoverage"'));
check("the form has a Project Deep Dive coverage select", componentSource.includes('name="projectDeepDiveCoverage"'));
check("the form allows up to 10 constraint rows (index 0-9)", componentSource.includes("MAX_CONSTRAINT_ROWS = 10"));
check("the form submits to the diagnostic-inputs server action", componentSource.includes("action={saveInterviewPlaybookDiagnosticInputs}"));
check("the component introduces no inline <style> tag", !componentSource.includes("<style"));
{
  const usedClassNames = [...componentSource.matchAll(/className="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/));
  const uniqueClassNames = [...new Set(usedClassNames)];
  check("every class the form uses already exists in globals.css (no new CSS)", uniqueClassNames.length > 0 && uniqueClassNames.every((className) => styles.includes(`.${className}`)));
}

// =====================================================================
// 7. Page wiring
// =====================================================================
check("the page loads overview and diagnostic inputs together", /Promise\.all\(\[[\s\S]{0,180}getInterviewPlaybookOverview\(now\)[\s\S]{0,180}getInterviewPlaybookDiagnosticInputs\(\)[\s\S]{0,180}\]\)/.test(pageSource));
check("the page renders the diagnostic input form", pageSource.includes("<InterviewPlaybookDiagnosticInputForm"));
check("the page still contains the original round-context-only limitation copy", pageSource.includes("does not infer performance evidence, confidence, or available study time"));
check("the page preserves the checklist-completion-is-not-readiness copy", pageSource.includes("Checklist completion is planning progress, not interview readiness or a probability of passing."));
check("diagnosticInput is only forwarded when the user has actually saved inputs", pageSource.includes("diagnosticInputs.hasSavedInputs ? diagnosticInputs.diagnosticInput : undefined"));

// =====================================================================
// 8. Account export
// =====================================================================
check("EXPORT_VERSION is current at 1.2", exportSource.includes('const EXPORT_VERSION = "1.2"'));
check("export gains a top-level interview_playbook section", exportSource.includes("interview_playbook: {"));
for (const subsection of ["diagnostic_settings", "confidence", "priorities", "constraints"]) {
  check(`interview_playbook export includes ${subsection}`, new RegExp(`interview_playbook: \\{[\\s\\S]{0,400}${subsection}`).test(exportSource));
}
check("confidence/priorities/constraints export queries are owner-scoped", (exportSource.match(/interview_playbook_(confidence|priorities|constraints)"\)\.select\([^)]*\)\.eq\("user_id", userId\)/g) ?? []).length === 3);
check("confidence/priorities/constraints export queries are paginated", (exportSource.match(/collectAccountExportRows\("interview_playbook_(confidence|priorities|constraints)"/g) ?? []).length === 3);
check("priorities export is ordered by position", /interview_playbook_priorities[\s\S]{0,200}\.order\("position"\)/.test(exportSource));
check("constraints export is ordered by position", /interview_playbook_constraints[\s\S]{0,200}\.order\("position"\)/.test(exportSource));

// =====================================================================
// 9. No false scoring / no fake pass shortcuts
// =====================================================================
const scopedSources = {
  "migration.sql": migration,
  "diagnostic-inputs.ts": diagnosticInputsSource,
  "diagnostic-input-form.ts": diagnosticInputFormSource,
  "actions.ts": actionsSource,
  "diagnostic-input-form.tsx": componentSource,
  "page.tsx": pageSource,
  "export.ts": exportSource,
};
for (const [name, source] of Object.entries(scopedSources)) {
  for (const forbidden of ["readinessScore", "overallReadiness", "passProbability", "readiness_score", "pass_probability", "weightedScore"]) {
    check(`${name} never computes ${forbidden}`, !source.includes(forbidden));
  }
  check(`${name} contains no '|| true' fake-pass shortcut`, !source.includes("|| true"));
}

for (const [name, ok] of cases) assert.ok(ok, name);
console.log(`Interview Playbook diagnostic inputs qualification passed (${cases.length} cases).`);
