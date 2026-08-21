import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { dsaQuestionProgressToInterviewEvidence } from "../lib/interview-playbook/dsa-evidence.ts";
import { buildInterviewDiagnosticSnapshot } from "../lib/interview-playbook/diagnostic.ts";
import { summarizeInterviewEvidence } from "../lib/interview-playbook/evidence.ts";
import { buildInterviewPlaybookPlanningProjection } from "../lib/interview-playbook/planner-integration.ts";
import { systemDesignProgressToInterviewEvidence } from "../lib/interview-playbook/system-design-evidence.ts";

const root = process.cwd();
const adapterSource = readFileSync(join(root, "lib/interview-playbook/system-design-evidence.ts"), "utf8");
const querySource = readFileSync(join(root, "lib/interview-playbook/system-design-evidence-query.ts"), "utf8");
const pageSource = readFileSync(join(root, "app/interview-playbook/page.tsx"), "utf8");
const cases = [];
const check = (name, ok) => cases.push([name, Boolean(ok)]);
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const diagnosticInput = (evidence = [], confidenceByArea = {}) => ({ availableHoursPerWeek: null, confidenceByArea, constraints: [], priorities: [], evidence, coverage: { behavioralStories: "unknown", projectDeepDive: "unknown" } });
const NOW = new Date("2026-08-20T12:00:00Z");
const round = (areas = ["system-design"]) => ({ id: "round-1", applicationId: "application-1", companyName: "Acme", roleTitle: "Engineer", roundName: "Design", roundType: "System Design", scheduledAt: "2026-08-27T12:00:00Z", timezone: "UTC", executionGuideSlugs: areas, needsSignalClarification: false, preparationHref: "/applications/application-1/rounds/round-1" });
const overview = { upcomingRounds: [round()], unscheduledRounds: [] };

// The System Design workspace is a manual private notebook. These rows are
// deliberately varied to prove only explicit design-problem self-assessments
// become self-report; curriculum activity, bookmarks, confidence, and notes
// have no path into the adapter input at all.
const rows = [
  { itemId: "url-shortener", itemType: "design_problem", status: "comfortable", updatedAt: "2026-08-18T10:00:00Z", notes: "private note", confidence: "high", bookmarked: true },
  { itemId: "rate-limiter", itemType: "design_problem", status: "review", updatedAt: "2026-08-19T10:00:00Z", notes: "private gap", confidence: "low", bookmarked: true },
  { itemId: "caching", itemType: "concept", status: "comfortable", updatedAt: "2026-08-19T11:00:00Z" },
  { itemId: "chat-system", itemType: "design_problem", status: "reviewed", updatedAt: "2026-08-19T12:00:00Z" },
  { itemId: "ml-inference-service", itemType: "design_problem", status: "comfortable", updatedAt: "2026-08-19T13:00:00Z" },
];
const evidence = systemDesignProgressToInterviewEvidence(rows);

check("no System Design data produces no evidence", systemDesignProgressToInterviewEvidence([]).length === 0);
check("manual progress is self-report and never direct observation", evidence.every((item) => item.provenance === "self-report"));
check("manual progress has only System Design area isolation", evidence.every((item) => item.area === "system-design"));
check("only explicit normal design-problem self-assessments are projected", equal(evidence.map((item) => item.id), [
  "system-design-item-progress:design_problem:rate-limiter:self-reported-review",
  "system-design-item-progress:design_problem:url-shortener:self-reported-comfortable",
]));
check("curriculum completion never becomes demonstrated mastery", !evidence.some((item) => item.id.includes("caching")) && !evidence.some((item) => item.id.includes("chat-system")));
check("ML-specific System Design material is not silently mapped to normal System Design", !evidence.some((item) => item.id.includes("ml-inference-service")));
check("confidence, bookmarks, and notes cannot alter adapter output", equal(evidence, systemDesignProgressToInterviewEvidence(rows.map(({ itemId, itemType, status, updatedAt }) => ({ itemId, itemType, status, updatedAt })) )));
check("private notes never appear in evidence summaries", evidence.every((item) => !item.summary?.includes("private")));
check("all System Design evidence has stable IDs and no repeated error claim", evidence.every((item) => item.repeatedError === false));
check("input order does not alter semantics", equal(evidence, systemDesignProgressToInterviewEvidence([...rows].reverse())));

const systemSummary = summarizeInterviewEvidence("system-design", evidence);
check("self-report never increments observed evidence", systemSummary.observedEvidenceCount === 0 && systemSummary.selfReportedEvidenceCount === 2);
check("mixed manual statuses remain self-reported-only rather than observed mixed evidence", systemSummary.state === "self-reported-only");
check("repeated errors are never inferred from multiple progress rows", systemSummary.hasRepeatedError === false);
const snapshot = buildInterviewDiagnosticSnapshot(diagnosticInput(evidence, { "system-design": "high" }));
for (const dimension of snapshot.dimensions) {
  if (dimension.area === "system-design") check("explicit Playbook confidence remains separate", dimension.selfReportedConfidence === "high" && dimension.evidenceState === "self-reported-only");
  else check(`System Design does not affect ${dimension.area}`, dimension.evidenceCount === 0 && dimension.evidenceState === "unknown");
}

const baseline = buildInterviewPlaybookPlanningProjection({ overview, now: NOW });
const empty = buildInterviewPlaybookPlanningProjection({ overview, now: NOW, evidence: [] });
const projected = buildInterviewPlaybookPlanningProjection({ overview, now: NOW, evidence });
check("no System Design evidence preserves the previous plan", equal(baseline, empty));
check("System Design self-report remains self-reported-only in product integration", projected?.sourceDescription.selfReportedEvidenceAreas.length === 1 && projected.sourceDescription.selfReportedEvidenceAreas[0] === "system-design" && projected.actions.some((action) => action.area === "system-design" && action.kind === "baseline-check"));
const dsa = dsaQuestionProgressToInterviewEvidence([{ questionId: "two-sum", status: "solved", solvedAt: "2026-08-18T10:00:00Z" }]);
const combined = buildInterviewPlaybookPlanningProjection({ overview: { upcomingRounds: [round(["algorithmic-coding", "system-design"])], unscheduledRounds: [] }, now: NOW, evidence: [...dsa, ...evidence] });
check("DSA and System Design compose deterministically without overwriting", equal(combined?.sourceDescription.selfReportedEvidenceAreas, ["algorithmic-coding", "system-design"]) && combined?.actions.some((action) => action.area === "algorithmic-coding") && combined?.actions.some((action) => action.area === "system-design"));

check("query is actor-derived and selects no private notes", querySource.includes("getAuthenticatedActor") && querySource.includes("eq(\"user_id\", actor.user.id)") && querySource.includes('select("item_id,item_type,status,updated_at")') && !querySource.includes('select("*")'));
check("adapter has no React, Supabase, auth, network, or current-time dependency", !/from\s+["'](?:react|@\/lib\/(?:auth|supabase))|fetch\(|new Date\(|Date\.now|Math\.random/i.test(adapterSource));
check("Playbook source copy calls self-report non-observed performance", pageSource.includes("Self-reported activity is not observed performance"));

const failures = cases.filter(([, ok]) => !ok);
for (const [name, ok] of cases) console.log(`${ok ? "✓" : "✗"} ${name}`);
assert.equal(failures.length, 0, `${failures.length} System Design evidence qualification(s) failed`);
console.log(`\n${cases.length} System Design evidence qualifications passed.`);
