/**
 * Pure, deterministic evidence model for the Interview Playbook diagnostic.
 *
 * This file owns exactly two things: the canonical set of nine preparation
 * areas, and a deterministic rule for turning a candidate's raw evidence
 * items into one descriptive evidence state per area. It computes no score,
 * no weight, no readiness verdict, and no probability — see
 * `InterviewEvidenceState` below for what the output actually means.
 *
 * The preparation areas here are evidence dimensions, not interview stages,
 * formats, or composite rounds — this module is intentionally independent of
 * `round-execution.ts` and never imports it.
 *
 * Pure and dependency-light: no React, Next.js, Supabase, auth, database,
 * queries, overview/timing/round-resolver/dossier imports, network, storage,
 * current time, or randomness.
 */

export const INTERVIEW_PREPARATION_AREAS = [
  "algorithmic-coding",
  "practical-coding",
  "debugging",
  "code-review",
  "low-level-design",
  "system-design",
  "ml-system-design",
  "behavioral",
  "project-deep-dive",
] as const;

export type InterviewPreparationArea = (typeof INTERVIEW_PREPARATION_AREAS)[number];

/**
 * Epistemic strength of an evidence item's source. These are never
 * numerically weighted in this module — they are preserved so a future
 * planner can reason about provenance explicitly instead of it silently
 * collapsing into a single number.
 */
export const INTERVIEW_EVIDENCE_PROVENANCES = [
  "direct-observation",
  "human-evaluator-judgment",
  "ai-assisted-observation",
  "self-report",
  "unknown",
] as const;

export type InterviewEvidenceProvenance = (typeof INTERVIEW_EVIDENCE_PROVENANCES)[number];

export const INTERVIEW_EVIDENCE_KINDS = ["practice", "mock", "real-interview", "work-sample", "other"] as const;

export type InterviewEvidenceKind = (typeof INTERVIEW_EVIDENCE_KINDS)[number];

/** A qualitative observation, not a score. */
export const INTERVIEW_EVIDENCE_SIGNALS = ["positive", "mixed", "negative", "unknown"] as const;

export type InterviewEvidenceSignal = (typeof INTERVIEW_EVIDENCE_SIGNALS)[number];

export type InterviewEvidenceItem = Readonly<{
  id: string;
  area: InterviewPreparationArea;
  provenance: InterviewEvidenceProvenance;
  kind: InterviewEvidenceKind;
  signal: InterviewEvidenceSignal;
  observedAt: string | null;
  summary: string | null;
  repeatedError: boolean;
}>;

/**
 * A descriptive summary of the evidence available for one area — never a
 * readiness verdict. `unknown` means the area has no usable evidence yet;
 * `self-reported-only` means the candidate has spoken but nothing has been
 * observed; `needs-repair`, `mixed-evidence`, and `supported-evidence`
 * describe what was actually observed, not whether the candidate is ready.
 */
export const INTERVIEW_EVIDENCE_STATES = [
  "unknown",
  "self-reported-only",
  "needs-repair",
  "mixed-evidence",
  "supported-evidence",
] as const;

export type InterviewEvidenceState = (typeof INTERVIEW_EVIDENCE_STATES)[number];

export type InterviewEvidenceProvenanceCounts = Readonly<Record<InterviewEvidenceProvenance, number>>;

export type InterviewEvidenceSummary = Readonly<{
  area: InterviewPreparationArea;
  state: InterviewEvidenceState;
  evidenceCount: number;
  observedEvidenceCount: number;
  selfReportedEvidenceCount: number;
  provenanceCounts: InterviewEvidenceProvenanceCounts;
  hasRepeatedError: boolean;
  latestEvidenceAt: string | null;
}>;

const OBSERVED_PROVENANCES: ReadonlySet<InterviewEvidenceProvenance> = new Set([
  "direct-observation",
  "human-evaluator-judgment",
  "ai-assisted-observation",
]);

/** Self-report and unknown provenance never count as observed evidence. */
function isObservedProvenance(provenance: InterviewEvidenceProvenance): boolean {
  return OBSERVED_PROVENANCES.has(provenance);
}

function emptyProvenanceCounts(): Record<InterviewEvidenceProvenance, number> {
  const counts = {} as Record<InterviewEvidenceProvenance, number>;
  for (const provenance of INTERVIEW_EVIDENCE_PROVENANCES) counts[provenance] = 0;
  return counts;
}

/**
 * Deterministic, weight-free evidence-state algorithm.
 *
 * Only non-`unknown`-signal items participate. Among those, only items with
 * observed provenance determine `needs-repair` / `mixed-evidence` /
 * `supported-evidence` — self-report can only ever produce
 * `self-reported-only`, and only when no observed signal exists at all. This
 * is what keeps a confident self-report from ever overpowering an observed
 * negative result, and an observed positive result from ever being erased by
 * a discouraged self-report.
 */
function resolveEvidenceState(matching: readonly InterviewEvidenceItem[]): InterviewEvidenceState {
  const observedSignals = new Set<InterviewEvidenceSignal>();
  let hasSelfReportedSignal = false;

  for (const item of matching) {
    if (item.signal === "unknown") continue;
    if (isObservedProvenance(item.provenance)) {
      observedSignals.add(item.signal);
    } else if (item.provenance === "self-report") {
      hasSelfReportedSignal = true;
    }
  }

  if (observedSignals.size === 0) {
    return hasSelfReportedSignal ? "self-reported-only" : "unknown";
  }
  if (observedSignals.has("mixed") || (observedSignals.has("positive") && observedSignals.has("negative"))) {
    return "mixed-evidence";
  }
  return observedSignals.has("negative") ? "needs-repair" : "supported-evidence";
}

/** `observedAt` only participates when it parses to a real instant. */
function parseObservedAt(observedAt: string | null): number | null {
  if (observedAt === null) return null;
  const parsed = Date.parse(observedAt);
  return Number.isNaN(parsed) ? null : parsed;
}

/** No recency threshold and no current-time comparison — just the latest parseable value present. */
function resolveLatestEvidenceAt(matching: readonly InterviewEvidenceItem[]): string | null {
  let latest: { value: string; ms: number } | null = null;
  for (const item of matching) {
    const ms = parseObservedAt(item.observedAt);
    if (ms === null) continue;
    if (latest === null || ms > latest.ms) {
      latest = { value: item.observedAt as string, ms };
    }
  }
  return latest?.value ?? null;
}

/**
 * Scopes `evidenceItems` to `area` and produces a purely descriptive
 * summary. Never mutates `evidenceItems`.
 */
export function summarizeInterviewEvidence(
  area: InterviewPreparationArea,
  evidenceItems: readonly InterviewEvidenceItem[],
): InterviewEvidenceSummary {
  const matching = evidenceItems.filter((item) => item.area === area);

  const provenanceCounts = emptyProvenanceCounts();
  let observedEvidenceCount = 0;
  let selfReportedEvidenceCount = 0;
  let hasRepeatedError = false;

  for (const item of matching) {
    provenanceCounts[item.provenance] += 1;
    if (item.repeatedError) hasRepeatedError = true;
    if (item.signal === "unknown") continue;
    if (isObservedProvenance(item.provenance)) observedEvidenceCount += 1;
    else if (item.provenance === "self-report") selfReportedEvidenceCount += 1;
  }

  return {
    area,
    state: resolveEvidenceState(matching),
    evidenceCount: matching.length,
    observedEvidenceCount,
    selfReportedEvidenceCount,
    provenanceCounts,
    hasRepeatedError,
    latestEvidenceAt: resolveLatestEvidenceAt(matching),
  };
}
