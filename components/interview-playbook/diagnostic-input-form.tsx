"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  saveInterviewPlaybookDiagnosticInputs,
  type InterviewPlaybookDiagnosticActionState,
} from "@/app/interview-playbook/actions";
import {
  INTERVIEW_PLAYBOOK_DIAGNOSTIC_EXPECTED_REVISION_FIELD,
  resolveInterviewPlaybookDiagnosticDisplayState,
} from "@/lib/interview-playbook/diagnostic-input-form.ts";
import {
  INTERVIEW_PREPARATION_AREAS,
  type InterviewPreparationArea,
} from "@/lib/interview-playbook/evidence.ts";
import type {
  InterviewDiagnosticConstraint,
  InterviewPreparationCoverageState,
  InterviewSelfReportedConfidence,
} from "@/lib/interview-playbook/diagnostic.ts";

const AREA_LABELS: Readonly<Record<InterviewPreparationArea, string>> = {
  "algorithmic-coding": "Algorithmic coding",
  "practical-coding": "Practical coding",
  debugging: "Debugging",
  "code-review": "Code review",
  "low-level-design": "Low-level design",
  "system-design": "System design",
  "ml-system-design": "ML system design",
  behavioral: "Behavioral",
  "project-deep-dive": "Project deep dive",
};

const CONFIDENCE_OPTIONS: ReadonlyArray<{
  value: InterviewSelfReportedConfidence | "";
  label: string;
}> = [
  { value: "", label: "Not set" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const COVERAGE_OPTIONS: ReadonlyArray<{
  value: InterviewPreparationCoverageState;
  label: string;
}> = [
  { value: "unknown", label: "Not set" },
  { value: "not-started", label: "Not started" },
  { value: "partial", label: "Partial" },
  { value: "covered", label: "Covered" },
];

const CONSTRAINT_CATEGORY_OPTIONS: ReadonlyArray<{
  value: InterviewDiagnosticConstraint["category"];
  label: string;
}> = [
  { value: "work", label: "Work" },
  { value: "school", label: "School" },
  { value: "health", label: "Health" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
];

const MAX_CONSTRAINT_ROWS = 10;
const PRIORITY_RANKS = INTERVIEW_PREPARATION_AREAS.map(
  (_, index) => index + 1,
);

export type InterviewPlaybookDiagnosticInputFormProps = Readonly<{
  hasSavedInputs: boolean;
  availableHoursPerWeek: number | null;
  confidenceByArea: Partial<
    Record<InterviewPreparationArea, InterviewSelfReportedConfidence>
  >;
  priorities: readonly InterviewPreparationArea[];
  constraints: readonly InterviewDiagnosticConstraint[];
  coverage: Readonly<{
    behavioralStories: InterviewPreparationCoverageState;
    projectDeepDive: InterviewPreparationCoverageState;
  }>;
  revision: string;
}>;

function diagnosticDraftSignature(formData: FormData) {
  return JSON.stringify([
    formData.get("availableHoursPerWeek"),
    ...INTERVIEW_PREPARATION_AREAS.flatMap((area) => [
      formData.get(`confidence:${area}`),
      formData.get(`priority:${area}`),
    ]),
    formData.get("behavioralStoriesCoverage"),
    formData.get("projectDeepDiveCoverage"),
    ...Array.from({ length: MAX_CONSTRAINT_ROWS }, (_, index) => [
      formData.get(`constraint:${index}:category`),
      formData.get(`constraint:${index}:description`),
    ]).flat(),
  ]);
}

/**
 * Collapsed by default so a first-time visitor sees round-context planning
 * before being asked to fill anything in. Every value here is planning
 * context the candidate supplies about themselves — never a score or an
 * observed performance signal.
 */
export function InterviewPlaybookDiagnosticInputForm({
  hasSavedInputs,
  availableHoursPerWeek,
  confidenceByArea,
  priorities,
  constraints,
  coverage,
  revision,
}: InterviewPlaybookDiagnosticInputFormProps) {
  const [state, action, pending] = useActionState(
    saveInterviewPlaybookDiagnosticInputs,
    {
      status: "idle",
      message: "",
      revision,
    } satisfies InterviewPlaybookDiagnosticActionState,
  );
  const [changedSinceSubmit, setChangedSinceSubmit] = useState(false);
  const submissionPending = useRef(false);
  const submittedDraftSignature = useRef<string | null>(null);

  useEffect(() => {
    if (!pending) submissionPending.current = false;
  }, [pending]);
  useEffect(
    () => () => {
      submissionPending.current = false;
      submittedDraftSignature.current = null;
    },
    [],
  );

  const updateChangedSinceSubmit = (form: HTMLFormElement | null) => {
    if (!form || submittedDraftSignature.current === null) return;
    setChangedSinceSubmit(
      diagnosticDraftSignature(new FormData(form)) !==
        submittedDraftSignature.current,
    );
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submissionPending.current) return;
    submissionPending.current = true;
    const formData = new FormData(event.currentTarget);
    submittedDraftSignature.current = diagnosticDraftSignature(formData);
    setChangedSinceSubmit(false);
    startTransition(() => action(formData));
  };

  const displayState = resolveInterviewPlaybookDiagnosticDisplayState(
    state,
    pending,
    changedSinceSubmit,
  );
  const rankByArea = new Map<InterviewPreparationArea, number>();
  priorities.forEach((area, index) => rankByArea.set(area, index + 1));
  const constraintRows = Array.from(
    { length: MAX_CONSTRAINT_ROWS },
    (_, index) => constraints[index] ?? null,
  );

  return (
    <details className="prep-module">
      <summary>
        <Compass size={21} aria-hidden="true" />
        <div>
          <h2>Personalize adaptive planning</h2>
          <p>
            {hasSavedInputs
              ? "Update the hours, confidence, priorities, and coverage behind your plan."
              : "Add your own hours, confidence, priorities, and coverage to your plan."}
          </p>
        </div>
      </summary>

      <p className="prep-privacy">
        These inputs guide planning. They do not become performance evidence.
      </p>

      <form
        className="form-shell interview-playbook-diagnostic-form"
        action={action}
        onSubmit={submit}
        onChange={(event) => updateChangedSinceSubmit(event.currentTarget)}
        aria-busy={pending}
      >
        <input
          type="hidden"
          name={INTERVIEW_PLAYBOOK_DIAGNOSTIC_EXPECTED_REVISION_FIELD}
          value={state.revision ?? revision}
        />
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="availableHoursPerWeek">
              Available hours per week
            </label>
            <input
              id="availableHoursPerWeek"
              name="availableHoursPerWeek"
              type="number"
              min={0}
              max={168}
              step="0.5"
              inputMode="decimal"
              defaultValue={availableHoursPerWeek ?? ""}
              placeholder="e.g. 8"
            />
          </div>
        </div>

        <h3>Confidence and priority by area</h3>
        <p className="prep-privacy">
          Self-reported confidence guides planning but does not become
          performance evidence.
        </p>
        <div className="form-grid">
          {INTERVIEW_PREPARATION_AREAS.map((area) => {
            const confidenceFieldId = `confidence-${area}`;
            const priorityFieldId = `priority-${area}`;
            const currentRank = rankByArea.get(area);
            return (
              <div className="form-group" key={area}>
                <label htmlFor={confidenceFieldId}>{AREA_LABELS[area]}</label>
                <select
                  id={confidenceFieldId}
                  name={`confidence:${area}`}
                  defaultValue={confidenceByArea[area] ?? ""}
                >
                  {CONFIDENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      Confidence: {option.label}
                    </option>
                  ))}
                </select>
                <select
                  id={priorityFieldId}
                  name={`priority:${area}`}
                  defaultValue={currentRank ?? ""}
                  aria-label={`${AREA_LABELS[area]} priority rank`}
                >
                  <option value="">Priority: Not set</option>
                  {PRIORITY_RANKS.map((rank) => (
                    <option key={rank} value={rank}>
                      Priority: {rank}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <h3>Preparation material coverage</h3>
        <p className="prep-privacy">
          Coverage describes preparation material, not interview performance.
        </p>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="behavioralStoriesCoverage">
              Behavioral stories coverage
            </label>
            <select
              id="behavioralStoriesCoverage"
              name="behavioralStoriesCoverage"
              defaultValue={coverage.behavioralStories}
            >
              {COVERAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="projectDeepDiveCoverage">
              Project deep dive coverage
            </label>
            <select
              id="projectDeepDiveCoverage"
              name="projectDeepDiveCoverage"
              defaultValue={coverage.projectDeepDive}
            >
              {COVERAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <h3>
          Planning constraints <span>(optional)</span>
        </h3>
        <p className="prep-privacy">
          Constraints are planning context only. They do not change evidence or
          score you.
        </p>
        <div className="form-grid">
          {constraintRows.map((constraint, index) => (
            <div
              className="form-group"
              key={`constraint-${index}`}
            >
              <label htmlFor={`constraint-${index}-description`}>
                Constraint {index + 1}
              </label>
              <select
                id={`constraint-${index}-category`}
                name={`constraint:${index}:category`}
                defaultValue={constraint?.category ?? "other"}
                aria-label={`Constraint ${index + 1} category`}
              >
                {CONSTRAINT_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                id={`constraint-${index}-description`}
                name={`constraint:${index}:description`}
                type="text"
                maxLength={500}
                defaultValue={constraint?.description ?? ""}
                placeholder="Leave blank to skip this row"
              />
            </div>
          ))}
        </div>

        <p
          className={`form-status ${displayState.status}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {displayState.message}
          {!pending && state.conflict && (
            <>
              <br />
              <Link
                href="/interview-playbook"
                target="_blank"
                rel="noopener noreferrer"
              >
                Review latest in a new tab
              </Link>
            </>
          )}
        </p>
        <button className="button" type="submit" aria-disabled={pending}>
          {pending ? "Saving…" : "Save diagnostic inputs"}
        </button>
      </form>
    </details>
  );
}
