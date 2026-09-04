import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INTERVIEW_PLAYBOOK_DIAGNOSTIC_ABSENT_REVISION,
  INTERVIEW_PLAYBOOK_DIAGNOSTIC_CONFLICT_ERROR,
  INTERVIEW_PLAYBOOK_DIAGNOSTIC_EARLIER_SNAPSHOT_SAVED_MESSAGE,
  INTERVIEW_PLAYBOOK_DIAGNOSTIC_EXPECTED_REVISION_FIELD,
  INTERVIEW_PLAYBOOK_DIAGNOSTIC_PENDING_MESSAGE,
  INTERVIEW_PLAYBOOK_DIAGNOSTIC_SAVED_MESSAGE,
  isCanonicalInterviewPlaybookDiagnosticRevision,
  parseInterviewPlaybookDiagnosticInputForm,
  parseInterviewPlaybookDiagnosticSaveResult,
  parseInterviewPlaybookDiagnosticSnapshotResult,
  resolveInterviewPlaybookDiagnosticDisplayState,
} from "../lib/interview-playbook/diagnostic-input-form.ts";
import { INTERVIEW_PREPARATION_AREAS } from "../lib/interview-playbook/evidence.ts";
import { buildInterviewDiagnosticSnapshot } from "../lib/interview-playbook/diagnostic.ts";
import { buildAdaptiveInterviewPlan } from "../lib/interview-playbook/planning.ts";
import { buildInterviewPlaybookPlanningProjection } from "../lib/interview-playbook/planner-integration.ts";

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), "utf8");

const migration = read("supabase/migrations/202608190001_create_interview_playbook_diagnostic_inputs.sql");
const casMigration = read("supabase/migrations/202609040002_save_interview_playbook_diagnostic_inputs_if_revision.sql");
const pgtapTest = read("supabase/tests/database/interview_playbook_diagnostic_inputs.test.sql");
const diagnosticInputsSource = read("lib/interview-playbook/diagnostic-inputs.ts");
const diagnosticInputFormSource = read("lib/interview-playbook/diagnostic-input-form.ts");
const actionsSource = read("app/interview-playbook/actions.ts");
const componentSource = read("components/interview-playbook/diagnostic-input-form.tsx");
const pageSource = read("app/interview-playbook/page.tsx");
const exportSource = read("lib/account/export.ts");
const styles = read("app/globals.css");
const databaseTypes = read("lib/supabase/database.types.ts");
const persistenceQualifier = read("scripts/qualify-persistence-local.mjs");
const securityQualifier = read("scripts/qualify-security-local.mjs");

const cases = [];
const check = (name, ok) => cases.push([name, Boolean(ok)]);
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function formDataOf(entries = {}) {
  const formData = new FormData();
  formData.set(INTERVIEW_PLAYBOOK_DIAGNOSTIC_EXPECTED_REVISION_FIELD, INTERVIEW_PLAYBOOK_DIAGNOSTIC_ABSENT_REVISION);
  formData.set("availableHoursPerWeek", "");
  formData.set("behavioralStoriesCoverage", "unknown");
  formData.set("projectDeepDiveCoverage", "unknown");
  for (const area of INTERVIEW_PREPARATION_AREAS) {
    formData.set(`confidence:${area}`, "");
    formData.set(`priority:${area}`, "");
  }
  for (let index = 0; index < 10; index += 1) {
    formData.set(`constraint:${index}:category`, "");
    formData.set(`constraint:${index}:description`, "");
  }
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined) formData.delete(key);
    else formData.set(key, value);
  }
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

check("pgTAP plan freezes all 112 aggregate assertions", pgtapTest.includes("select plan(112);"));
check("pgTAP test proves cross-user isolation", pgtapTest.includes("bbbbbbbb-2222-4bbb-8bbb-bbbbbbbbbbbb"));
check("pgTAP test proves cascade deletion from auth.users", /delete from auth\.users where id = 'aaaaaaaa/.test(pgtapTest));
check("pgTAP test proves atomic rollback on a rejected save", pgtapTest.includes("bad-value"));

// database.types.ts contract
for (const table of ["interview_playbook_diagnostic_settings", "interview_playbook_confidence", "interview_playbook_priorities", "interview_playbook_constraints"]) {
  check(`database.types.ts declares table ${table}`, databaseTypes.includes(`${table}: {`));
}
check("database.types.ts declares the RPC", databaseTypes.includes("save_interview_playbook_diagnostic_inputs: {"));

const functionBody = (source, name) => source.match(new RegExp(`create or replace function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`))?.[0] ?? "";
const snapshotRpc = functionBody(casMigration, "get_interview_playbook_diagnostic_inputs_snapshot");
const casRpc = functionBody(casMigration, "save_interview_playbook_diagnostic_inputs_if_revision");
const legacyRpc = functionBody(casMigration, "save_interview_playbook_diagnostic_inputs");
check("the coherent snapshot RPC is one owner-derived SQL statement", snapshotRpc.includes("current_user_id uuid := auth.uid()") && snapshotRpc.includes("return query") && snapshotRpc.includes("left join public.interview_playbook_diagnostic_settings"));
check("the snapshot returns one explicit neutral absence row", snapshotRpc.includes("settings.user_id is not null") && snapshotRpc.includes("from (select current_user_id as user_id) as owner"));
check("snapshot confidence, priorities, and constraints have deterministic canonical order", snapshotRpc.includes("order by case confidence.area") && snapshotRpc.includes('order by priority."position"') && snapshotRpc.includes('order by diagnostic_constraint."position"'));
check("the coherent snapshot RPC denies anonymous and grants only authenticated", casMigration.includes("revoke all on function public.get_interview_playbook_diagnostic_inputs_snapshot()\n  from public, anon, authenticated") && casMigration.includes("grant execute on function public.get_interview_playbook_diagnostic_inputs_snapshot()\n  to authenticated"));
check("the CAS RPC derives owner and serializes per owner", casRpc.includes("current_user_id uuid := auth.uid()") && casRpc.includes("pg_advisory_xact_lock") && casRpc.includes("interview-playbook-diagnostic-owner:"));
check("the CAS RPC requires exactly one absence-or-revision state", casRpc.includes("target_expect_absent is null") && casRpc.includes("target_expect_absent and target_expected_updated_at is not null") && casRpc.includes("not target_expect_absent and target_expected_updated_at is null"));
check("the CAS mutates normalized children only after one revision winner", casRpc.indexOf("if saved_updated_at is null") < casRpc.indexOf("delete from public.interview_playbook_confidence") && casRpc.includes("settings.updated_at = target_expected_updated_at"));
check("the settings revision advances monotonically", casMigration.includes("old.updated_at + interval '1 microsecond'") && casMigration.includes("greatest("));
check("the CAS grant is authenticated-only", casMigration.includes("grant execute on function public.save_interview_playbook_diagnostic_inputs_if_revision(boolean,timestamptz,numeric,jsonb,text[],jsonb,text,text)\n  to authenticated"));
check("legacy snapshot saves fail before mutation with stable 0A000", legacyRpc.includes("Revision-checked Interview Playbook diagnostic saving is required") && legacyRpc.includes("errcode = '0A000'") && !/\b(insert|update|delete)\b/.test(legacyRpc));
check("database.types.ts declares coherent read and revision CAS RPCs", databaseTypes.includes("get_interview_playbook_diagnostic_inputs_snapshot: {") && databaseTypes.includes("save_interview_playbook_diagnostic_inputs_if_revision: {"));
check("pgTAP freezes the final 112-assertion DB contract", pgtapTest.includes("select plan(112);"));
for (const marker of [
  "Interview Playbook diagnostic snapshot distinguishes absence and saves one coherent aggregate",
  "concurrent stale Interview Playbook diagnostic saves commit exactly one coherent winner",
  "a snapshot read concurrent with a diagnostic save is entirely before or after the saved aggregate",
  "legacy Interview Playbook diagnostic save fails before mutating the aggregate",
]) check(`persistence qualification covers: ${marker}`, persistenceQualifier.includes(marker));
for (const marker of [
  "Interview Playbook diagnostic snapshot and CAS RPCs deny anonymous callers",
  "Interview Playbook diagnostic aggregate derives its owner and closes legacy and direct-write bypasses",
  "foreign and missing Interview Playbook diagnostic revision targets are indistinguishable",
]) check(`security qualification covers: ${marker}`, securityQualifier.includes(marker));

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
  check("constraint rows beyond the browser contract fail closed", !result.ok);
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

const canonicalRevision = "2026-09-04T12:34:56.123456Z";
check("canonical database revisions are accepted", isCanonicalInterviewPlaybookDiagnosticRevision(canonicalRevision));
for (const revision of ["absent", "2026-02-30T12:00:00Z", "0000-01-01T00:00:00Z", "2026-09-04 12:00:00Z", "2026-09-04T12:00:00+14:01", null]) {
  check(`noncanonical persisted revision is rejected: ${String(revision)}`, !isCanonicalInterviewPlaybookDiagnosticRevision(revision));
}
for (const value of [null, {}, [], "form-data"]) {
  check(`non-FormData action input fails closed: ${JSON.stringify(value)}`, !parseInterviewPlaybookDiagnosticInputForm(value).ok);
}
{
  const form = formDataOf({ [INTERVIEW_PLAYBOOK_DIAGNOSTIC_EXPECTED_REVISION_FIELD]: canonicalRevision });
  const result = parseInterviewPlaybookDiagnosticInputForm(form);
  check("a persisted revision maps to an exact existing-row CAS", result.ok && !result.value.expectAbsent && result.value.expectedUpdatedAt === canonicalRevision && result.value.revision === canonicalRevision);
}
{
  const result = parseInterviewPlaybookDiagnosticInputForm(formDataOf());
  check("the absent sentinel maps to an explicit absent-row CAS", result.ok && result.value.expectAbsent && result.value.expectedUpdatedAt === null && result.value.revision === INTERVIEW_PLAYBOOK_DIAGNOSTIC_ABSENT_REVISION);
}
for (const field of [
  INTERVIEW_PLAYBOOK_DIAGNOSTIC_EXPECTED_REVISION_FIELD,
  "availableHoursPerWeek",
  "behavioralStoriesCoverage",
  "projectDeepDiveCoverage",
  "confidence:system-design",
  "priority:system-design",
  "constraint:0:category",
  "constraint:0:description",
]) {
  const missing = formDataOf({ [field]: undefined });
  check(`missing singleton field fails closed: ${field}`, !parseInterviewPlaybookDiagnosticInputForm(missing).ok);
  const duplicate = formDataOf();
  duplicate.append(field, "");
  check(`duplicate singleton field fails closed: ${field}`, !parseInterviewPlaybookDiagnosticInputForm(duplicate).ok);
  const file = formDataOf();
  file.set(field, new File(["x"], "x.txt"));
  check(`File-valued singleton field fails closed: ${field}`, !parseInterviewPlaybookDiagnosticInputForm(file).ok);
}
check("unknown action fields fail closed", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ unexpected: "value" })).ok);
check("Next action metadata remains allowed", parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "$ACTION_ID_x": "metadata" })).ok);
for (const hours of [" 12", "01", "1.234", "NaN", "-1", "169"]) {
  check(`noncanonical hours fail closed: ${hours}`, !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ availableHoursPerWeek: hours })).ok);
}
check("coverage names are case-sensitive", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ behavioralStoriesCoverage: "Covered" })).ok);
check("confidence names are case-sensitive", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "confidence:system-design": "High" })).ok);
check("priority rank names are canonical", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "priority:system-design": "01" })).ok);
check("constraint descriptions reject controls", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "constraint:0:category": "work", "constraint:0:description": "line\nbreak" })).ok);
check("500 Unicode code points are accepted", parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "constraint:0:category": "other", "constraint:0:description": "😀".repeat(500) })).ok);
check("501 Unicode code points are rejected", !parseInterviewPlaybookDiagnosticInputForm(formDataOf({ "constraint:0:category": "other", "constraint:0:description": "😀".repeat(501) })).ok);

const neutralSnapshotRow = {
  has_saved_inputs: false,
  available_hours_per_week: null,
  confidence_entries: [],
  priority_areas: [],
  constraint_entries: [],
  behavioral_stories_coverage: "unknown",
  project_deep_dive_coverage: "unknown",
  updated_at: null,
};
const savedSnapshotRow = {
  has_saved_inputs: true,
  available_hours_per_week: 12.5,
  confidence_entries: [{ area: "system-design", confidence: "high" }],
  priority_areas: ["system-design", "behavioral"],
  constraint_entries: [{ id: "123e4567-e89b-42d3-a456-426614174000", category: "work", description: "On call" }],
  behavioral_stories_coverage: "partial",
  project_deep_dive_coverage: "covered",
  updated_at: canonicalRevision,
};
{
  const parsed = parseInterviewPlaybookDiagnosticSnapshotResult([neutralSnapshotRow]);
  check("the exact neutral aggregate is a genuine empty snapshot", parsed.status === "ready" && !parsed.value.hasSavedInputs && parsed.value.revision === INTERVIEW_PLAYBOOK_DIAGNOSTIC_ABSENT_REVISION);
}
{
  const parsed = parseInterviewPlaybookDiagnosticSnapshotResult([savedSnapshotRow]);
  check("the exact saved aggregate preserves ordered children and revision", parsed.status === "ready" && parsed.value.hasSavedInputs && deepEqual(parsed.value.priorities, ["system-design", "behavioral"]) && parsed.value.revision === canonicalRevision);
}
check("persisted numeric(5,2) hours accept the exact 167.99 boundary", parseInterviewPlaybookDiagnosticSnapshotResult([{ ...savedSnapshotRow, available_hours_per_week: 167.99 }]).status === "ready");
for (const value of [null, {}, [], [neutralSnapshotRow, neutralSnapshotRow], [{ ...neutralSnapshotRow, extra: true }], [{ ...neutralSnapshotRow, has_saved_inputs: false, available_hours_per_week: 1 }], [{ ...savedSnapshotRow, updated_at: null }], [{ ...savedSnapshotRow, available_hours_per_week: 1.234 }], [{ ...savedSnapshotRow, priority_areas: ["behavioral", "behavioral"] }], [{ ...savedSnapshotRow, behavioral_stories_coverage: "Covered" }], [{ ...savedSnapshotRow, confidence_entries: [{ area: "unknown", confidence: "high" }] }], [{ ...savedSnapshotRow, confidence_entries: [{ area: "behavioral", confidence: "high" }, { area: "system-design", confidence: "low" }] }], [{ ...savedSnapshotRow, confidence_entries: [{ area: "system-design", confidence: "high" }, { area: "system-design", confidence: "low" }] }], [{ ...savedSnapshotRow, constraint_entries: [savedSnapshotRow.constraint_entries[0], savedSnapshotRow.constraint_entries[0]] }], [{ ...savedSnapshotRow, constraint_entries: [{ ...savedSnapshotRow.constraint_entries[0], extra: true }] }], [{ ...savedSnapshotRow, constraint_entries: [{ ...savedSnapshotRow.constraint_entries[0], description: "bad\nvalue" }] }]]) {
  check(`malformed aggregate snapshot fails closed: ${JSON.stringify(value)}`, parseInterviewPlaybookDiagnosticSnapshotResult(value).status === "invalid");
}
check("zero save rows are an exact conflict", parseInterviewPlaybookDiagnosticSaveResult([]).status === "conflict");
check("one correlated canonical revision is saved", deepEqual(parseInterviewPlaybookDiagnosticSaveResult([{ updated_at: canonicalRevision }]), { status: "saved", updatedAt: canonicalRevision }));
for (const value of [null, {}, [{ updated_at: canonicalRevision }, { updated_at: canonicalRevision }], [{ updated_at: "bad" }], [{ updated_at: canonicalRevision, extra: true }]]) {
  check(`malformed save result fails closed: ${JSON.stringify(value)}`, parseInterviewPlaybookDiagnosticSaveResult(value).status === "invalid");
}
const successState = { status: "success", message: INTERVIEW_PLAYBOOK_DIAGNOSTIC_SAVED_MESSAGE };
check("pending display truth wins over stale results", deepEqual(resolveInterviewPlaybookDiagnosticDisplayState(successState, true, true), { status: "pending", message: INTERVIEW_PLAYBOOK_DIAGNOSTIC_PENDING_MESSAGE }));
check("ordinary confirmed success stays truthful", deepEqual(resolveInterviewPlaybookDiagnosticDisplayState(successState, false, false), successState));
check("edits after submit turn confirmed success into save-again truth", deepEqual(resolveInterviewPlaybookDiagnosticDisplayState(successState, false, true), { status: "success", message: INTERVIEW_PLAYBOOK_DIAGNOSTIC_EARLIER_SNAPSHOT_SAVED_MESSAGE }));
const conflictState = { status: "error", message: INTERVIEW_PLAYBOOK_DIAGNOSTIC_CONFLICT_ERROR };
check("errors pass through when no request is pending", deepEqual(resolveInterviewPlaybookDiagnosticDisplayState(conflictState, false, true), conflictState));

// =====================================================================
// 3. Persistence/query architecture (lib/interview-playbook/diagnostic-inputs.ts)
// =====================================================================
check("diagnostic-inputs.ts declares itself server-only", diagnosticInputsSource.trimStart().startsWith('import "server-only";'));
check("diagnostic-inputs.ts loads the aggregate through one coherent snapshot RPC", (diagnosticInputsSource.match(/\.rpc\(\s*"get_interview_playbook_diagnostic_inputs_snapshot"/g) ?? []).length === 1);
check("diagnostic-inputs.ts has no four-table Promise.all torn-read path", !diagnosticInputsSource.includes("Promise.all(") && !/\.from\("interview_playbook_(diagnostic_settings|confidence|priorities|constraints)"\)/.test(diagnosticInputsSource));
check("diagnostic-inputs.ts never writes directly to these tables (no .insert/.update/.delete)", !/\.insert\(|\.update\(|\.delete\(/.test(diagnosticInputsSource));
check("diagnostic-inputs.ts writes exclusively through the revision CAS RPC", (diagnosticInputsSource.match(/\.rpc\(\s*"save_interview_playbook_diagnostic_inputs_if_revision"/g) ?? []).length === 1 && !diagnosticInputsSource.includes('.rpc("save_interview_playbook_diagnostic_inputs",'));
check("the loader always sets evidence: [] (no performance evidence in this phase)", diagnosticInputsSource.includes("evidence: []"));
check("diagnostic-inputs.ts imports the established PrivateDataUnavailableError convention", diagnosticInputsSource.includes('import { PrivateDataUnavailableError } from "@/lib/persistence/errors";'));
check("an aggregate query failure throws PrivateDataUnavailableError, not neutral", /if \(error\) \{\s*throw new PrivateDataUnavailableError\(/.test(diagnosticInputsSource));
check("a malformed aggregate also throws PrivateDataUnavailableError", /snapshot\.status === "invalid"[\s\S]{0,120}throw new PrivateDataUnavailableError/.test(diagnosticInputsSource));
check("the PrivateDataUnavailableError label is a plain string literal (no db error text, user id, or table name leaked)", /throw new PrivateDataUnavailableError\("[^"$]+"\);/.test(diagnosticInputsSource) && !diagnosticInputsSource.includes("throw new PrivateDataUnavailableError(`"));
check("actor absence remains the sole local neutral shortcut; aggregate absence is parsed", (diagnosticInputsSource.match(/return neutralDiagnosticInputs\(\);/g) ?? []).length === 1 && diagnosticInputsSource.includes("parseInterviewPlaybookDiagnosticSnapshotResult(data)"));
check("the CAS sends the explicit absence/revision pair and all aggregate children", ["target_expect_absent", "target_expected_updated_at", "confidence_entries", "priority_areas", "constraint_entries"].every((marker) => diagnosticInputsSource.includes(marker)));
check("CAS result parsing distinguishes saved, conflict, and malformed/error", diagnosticInputsSource.includes("parseInterviewPlaybookDiagnosticSaveResult(data)") && diagnosticInputsSource.includes('outcome.status === "invalid"'));

// =====================================================================
// 4. Server action safety (app/interview-playbook/actions.ts)
// =====================================================================
check("actions.ts is a server action module", actionsSource.trimStart().startsWith('"use server";'));
check("actions.ts resolves the actor from the session, never from formData", actionsSource.includes("getAuthenticatedActor()") && !/formData\.get\("user(Id|_id)?"\)/.test(actionsSource));
check("actions.ts revalidates the Interview Playbook page after saving", actionsSource.includes('revalidatePath("/interview-playbook")'));
check("actions.ts never logs form content (no console.* calls)", !/console\.\w+\(/.test(actionsSource));
check("actions.ts saves through the actor-scoped helper, not a raw RPC call", actionsSource.includes("saveInterviewPlaybookDiagnosticInputsForActor(") && !actionsSource.includes(".rpc("));
{
  const action = actionsSource.slice(actionsSource.indexOf("export async function saveInterviewPlaybookDiagnosticInputs"));
  const parser = action.indexOf("parseInterviewPlaybookDiagnosticInputForm(formData)");
  const invalid = action.indexOf("if (!parsed.ok)");
  const availability = action.indexOf("isAccountPlatformAvailable()");
  const actor = action.indexOf("getAuthenticatedActor()");
  const save = action.indexOf("saveInterviewPlaybookDiagnosticInputsForActor(", parser + 1);
  check("the strict parser and invalid return precede availability, actor, and persistence", parser >= 0 && parser < invalid && invalid < availability && availability < actor && actor < save);
  check("zero rows become a stable conflict without persistence claims", action.includes('result.status === "conflict"') && action.includes("INTERVIEW_PLAYBOOK_DIAGNOSTIC_CONFLICT_ERROR, true"));
  check("only saved results revalidate and advance the revision", action.indexOf('result.status === "error"') < action.indexOf('revalidatePath("/interview-playbook")') && action.includes("revision: result.updatedAt"));
}

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
check("copy states constraints never change evidence or score", /Constraints are planning context only\.\s+They do not change evidence or\s+score you\./.test(componentSource));
check("copy states coverage is material, not performance", componentSource.includes("Coverage describes preparation material, not interview performance."));
check("the form has no severity/diagnosis/disability/medical/productivity input", !/severity|diagnosis|disability|medical|productivity/i.test(componentSource));
check("confidence copy no longer overclaims that evidence state always comes from observed practice", !componentSource.includes("which always comes from observed practice"));
check("confidence copy states self-reported confidence guides planning but is not performance evidence", /Self-reported confidence guides planning but does not become\s+performance evidence\./.test(componentSource));
check("the form never claims ready/not-ready/pass/fail/candidate-strength verdicts", !/\b(ready|not ready|pass|fail|strong candidate|weak candidate)\b/i.test(componentSource));
check("the constraint category select has an accessible name", componentSource.includes("aria-label={`Constraint ${index + 1} category`}"));
check("the form iterates all 9 canonical areas structurally (never hardcoded per-area)", componentSource.includes("INTERVIEW_PREPARATION_AREAS.map((area) =>"));
check("each iterated area gets a confidence field", componentSource.includes("name={`confidence:${area}`}"));
check("each iterated area gets a priority field", componentSource.includes("name={`priority:${area}`}"));
check("INTERVIEW_PREPARATION_AREAS has exactly the 9 canonical areas", INTERVIEW_PREPARATION_AREAS.length === 9);
check("the form has a Behavioral stories coverage select", componentSource.includes('name="behavioralStoriesCoverage"'));
check("the form has a Project Deep Dive coverage select", componentSource.includes('name="projectDeepDiveCoverage"'));
check("the form allows up to 10 constraint rows (index 0-9)", componentSource.includes("MAX_CONSTRAINT_ROWS = 10"));
check("the form retains a progressive host-action fallback", componentSource.includes("action={action}") && componentSource.includes("onSubmit={submit}"));
{
  const submitStart = componentSource.indexOf("const submit = (");
  const submitEnd = componentSource.indexOf("const displayState", submitStart);
  const submit = componentSource.slice(submitStart, submitEnd);
  const prevent = submit.indexOf("event.preventDefault()");
  const guard = submit.indexOf("if (submissionPending.current) return");
  const claim = submit.indexOf("submissionPending.current = true");
  const snapshot = submit.indexOf("new FormData(event.currentTarget)");
  const signature = submit.indexOf("submittedDraftSignature.current = diagnosticDraftSignature(formData)");
  const reset = submit.indexOf("setChangedSinceSubmit(false)");
  const transition = submit.indexOf("startTransition(() => action(formData))");
  check("manual submit preserves drafts and synchronously rejects duplicates before dispatch", submitStart >= 0 && prevent < guard && guard < claim && claim < snapshot && snapshot < signature && signature < reset && reset < transition);
}
check("post-submit edits are compared with the exact submitted desired-value signature", componentSource.includes("diagnosticDraftSignature(new FormData(form))") && componentSource.includes("submittedDraftSignature.current") && componentSource.includes("onChange={(event) => updateChangedSinceSubmit(event.currentTarget)}"));
check("the loaded or returned revision is submitted on every save", componentSource.includes(`name={INTERVIEW_PLAYBOOK_DIAGNOSTIC_EXPECTED_REVISION_FIELD}`) && componentSource.includes("value={state.revision ?? revision}"));
check("pending semantics use form busy and guarded aria-disabled without native disabled", componentSource.includes("aria-busy={pending}") && componentSource.includes("aria-disabled={pending}") && !/(?:^|[\s<])disabled=\{pending\}/m.test(componentSource));
check("one persistent polite atomic live region announces pending, conflict, success, and save-again truth", (componentSource.match(/className=\{`form-status/g) ?? []).length === 1 && componentSource.includes('role="status"') && componentSource.includes('aria-live="polite"') && componentSource.includes('aria-atomic="true"') && componentSource.includes("resolveInterviewPlaybookDiagnosticDisplayState("));
check("conflicts expose only a safe canonical latest-page link", componentSource.includes("!pending && state.conflict") && componentSource.includes('href="/interview-playbook"') && componentSource.includes('target="_blank"') && componentSource.includes('rel="noopener noreferrer"') && componentSource.includes("Review latest in a new tab"));
check("stable constraint index keys prevent regenerated database UUIDs from remounting drafts", componentSource.includes('key={`constraint-${index}`}'));
check("pending styling is scoped and hover-neutralized", styles.includes('.interview-playbook-diagnostic-form .button[aria-disabled="true"]') && styles.includes('.interview-playbook-diagnostic-form .button[aria-disabled="true"]:hover'));
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
check("the page passes the coherent aggregate revision into the form", pageSource.includes("revision={diagnosticInputs.revision}"));

// =====================================================================
// 8. Account export
// =====================================================================
check("EXPORT_VERSION is current at 1.5", exportSource.includes('const EXPORT_VERSION = "1.5"'));
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
