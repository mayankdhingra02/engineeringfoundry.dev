/**
 * Phase 9 canonical-catalog integrity.
 *
 * Persistence for DSA questions, System Design concepts/problems, and curated
 * Behavioral questions is validated against read-only database catalogs seeded
 * by migrations. Those seeds and the repository catalogs are separate sources
 * that can drift silently: the application would offer a question the database
 * then refuses to persist, and the user would see a save failure with no
 * build-time warning.
 *
 * This suite enforces exact set equality in both directions for each catalog.
 */
import { readFileSync } from "node:fs";
import { canonicalDsaQuestions } from "../lib/dsa/catalog.ts";
import { systemDesignTopicManifest } from "../data/system-design/manifest.ts";
import { systemDesignPracticeContents } from "../content/system-design/problems/data.ts";
import { activeBehavioralQuestions } from "../data/behavioral/index.ts";

const checks = [];
const check = (name, ok, detail = "") => checks.push({ name: detail ? `${name} — ${detail}` : name, ok: Boolean(ok) });
const read = (path) => readFileSync(`supabase/migrations/${path}`, "utf8");

/** Extract a seeded `unnest(array[...])` id list from a migration. */
function seededArray(source, anchor) {
  const start = source.indexOf(anchor);
  if (start === -1) return null;
  const open = source.indexOf("array[", start);
  const close = source.indexOf("])", open);
  if (open === -1 || close === -1) return null;
  return new Set([...source.slice(open + 6, close).matchAll(/'([^']+)'/g)].map((match) => match[1]));
}

/** Extract seeded ids from an `insert ... values ('id', ...)` block. */
function seededValues(source, anchor) {
  const start = source.indexOf(anchor);
  if (start === -1) return null;
  const end = source.indexOf(";", start);
  return new Set([...source.slice(start, end).matchAll(/\(\s*'([^']+)'/g)].map((match) => match[1]));
}

/** Assert two id sets are exactly equal and report the specific drift. */
function assertParity(label, application, database) {
  const applicationIds = [...new Set(application)].sort();
  const databaseIds = [...database].sort();
  const missingInDatabase = applicationIds.filter((id) => !database.has(id));
  const missingInApplication = databaseIds.filter((id) => !applicationIds.includes(id));

  check(`${label}: application ids are unique`, applicationIds.length === application.length, `${application.length} entries`);
  check(
    `${label}: every application id exists in the database catalog`,
    missingInDatabase.length === 0,
    missingInDatabase.length ? `database would reject: ${missingInDatabase.join(", ")}` : `${applicationIds.length} ids`,
  );
  check(
    `${label}: the database catalog contains no id the application cannot reach`,
    missingInApplication.length === 0,
    missingInApplication.length ? `orphaned: ${missingInApplication.join(", ")}` : `${databaseIds.length} ids`,
  );
  check(`${label}: catalog sizes agree`, applicationIds.length === databaseIds.length, `app ${applicationIds.length} / db ${databaseIds.length}`);
}

// --- Self-test -------------------------------------------------------------
// A parity guard that cannot fail is worthless, so prove the comparison
// detects drift in both directions before trusting it on real catalogs.
{
  const probe = [];
  const record = checks.push.bind(checks);
  checks.push = (entry) => probe.push(entry);
  assertParity("self-test", ["a", "b"], new Set(["a"]));
  assertParity("self-test", ["a"], new Set(["a", "b"]));
  checks.push = record;
  const detectsMissingInDatabase = probe.some((entry) => !entry.ok && entry.name.includes("database would reject: b"));
  const detectsOrphan = probe.some((entry) => !entry.ok && entry.name.includes("orphaned: b"));
  check("parity guard detects an id the database would reject", detectsMissingInDatabase);
  check("parity guard detects an orphaned database id", detectsOrphan);
}

// --- DSA -------------------------------------------------------------------
const dsaMigration = read("202608140007_create_dsa_question_progress.sql");
const dsaSeeded = seededArray(dsaMigration, "insert into public.dsa_question_catalog");
check("DSA catalog seed was located in its migration", dsaSeeded !== null);
if (dsaSeeded) assertParity("DSA questions", canonicalDsaQuestions.map((question) => question.id), dsaSeeded);

// --- System Design ---------------------------------------------------------
const sdMigration = read("202608140008_create_system_design_workspace.sql");
const sdProductionEngineeringMigration = read("202609040015_publish_system_design_production_engineering.sql");
const sdConceptsSeeded = seededArray(sdMigration, "select id, 'concept' from unnest");
const sdProductionEngineeringSeeded = seededArray(sdProductionEngineeringMigration, "insert into public.system_design_item_catalog");
const sdProblemsSeeded = seededArray(sdMigration, "select id, 'design_problem' from unnest");
check("System Design concept seed was located in its migration", sdConceptsSeeded !== null);
check("System Design production-engineering seed was located in its migration", sdProductionEngineeringSeeded !== null);
check("System Design problem seed was located in its migration", sdProblemsSeeded !== null);

// Only published concepts are persistable. Unpublished manifest entries are
// deliberately absent from the database so progress cannot be recorded against
// curriculum that is not live yet.
const publishedConcepts = systemDesignTopicManifest.filter((topic) => topic.published);
const unpublishedConcepts = systemDesignTopicManifest.filter((topic) => !topic.published);
if (sdConceptsSeeded) {
  const databaseConceptIds = new Set([...sdConceptsSeeded, ...(sdProductionEngineeringSeeded ?? [])]);
  assertParity("System Design concepts", publishedConcepts.map((topic) => topic.id), databaseConceptIds);
  const publishedLeak = unpublishedConcepts.filter((topic) => databaseConceptIds.has(topic.id));
  check(
    "System Design: unpublished concepts stay out of the persistable catalog",
    publishedLeak.length === 0,
    publishedLeak.length ? `leaked: ${publishedLeak.map((topic) => topic.id).join(", ")}` : `${unpublishedConcepts.length} held back`,
  );
}
if (sdProblemsSeeded) assertParity("System Design problems", systemDesignPracticeContents.map((problem) => problem.id), sdProblemsSeeded);

// --- Behavioral ------------------------------------------------------------
const behavioralMigration = read("202608140006_enforce_behavioral_relationships.sql");
const behavioralSeeded = seededValues(behavioralMigration, "insert into public.behavioral_curated_questions");
check("Behavioral curated seed was located in its migration", behavioralSeeded !== null);
if (behavioralSeeded) assertParity("Behavioral curated questions", activeBehavioralQuestions.map((question) => question.id), behavioralSeeded);

// --- Structural guarantees -------------------------------------------------
// Restrict-on-delete is what makes a catalog row safe to reference from user
// data; cascade would silently erase private progress with a curriculum edit.
check(
  "DSA progress references the catalog with on delete restrict",
  dsaMigration.includes("references public.dsa_question_catalog(id) on update cascade on delete restrict"),
);
check(
  "System Design progress references the catalog with on delete restrict",
  sdMigration.includes("references public.system_design_item_catalog(id, item_type) on update cascade on delete restrict"),
);
check(
  "Behavioral references the curated catalog with on delete restrict",
  (behavioralMigration.match(/references public\.behavioral_curated_questions\(id\) on update cascade on delete restrict/g) ?? []).length >= 3,
);
check("canonical catalogs are not writable by ordinary roles", dsaMigration.includes("revoke all on table public.dsa_question_catalog") && sdMigration.includes("revoke all on table public.system_design_item_catalog") && behavioralMigration.includes("revoke all on table public.behavioral_curated_questions"));

const failed = checks.filter((entry) => !entry.ok);
if (failed.length) {
  console.error(`Canonical catalog integrity failed:\n- ${failed.map((entry) => entry.name).join("\n- ")}`);
  process.exit(1);
}
console.log(
  `Canonical catalog integrity passed: ${checks.length}/${checks.length} checks — ` +
  `${canonicalDsaQuestions.length} DSA questions, ${publishedConcepts.length} published System Design concepts ` +
  `(${unpublishedConcepts.length} held back), ${systemDesignPracticeContents.length} design problems, ` +
  `${activeBehavioralQuestions.length} curated Behavioral questions.`,
);
