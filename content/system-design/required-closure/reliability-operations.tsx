import { RequiredClosureLesson, type RequiredClosureLessonSpec } from "./shared";

const lessons: Record<string, RequiredClosureLessonSpec> = {
  "schema-data-migration": {
    id: "schema-data-migration",
    decision: "Change a live data contract in stages: expand compatibility, move and verify data, switch readers, then contract only after old writers are gone.",
    note: "A migration is a distributed protocol between deployed application versions and stored data, not just a DDL statement.",
    mechanism: ["Add backward-compatible schema or a target store.", "Make new writes compatible with both representations and observe failures.", "Backfill historical rows in bounded, restartable batches while capturing concurrent changes.", "Compare counts, checksums, invariants, and lag before switching reads.", "Stop old writers, keep a rollback window, then remove the old representation."],
    diagram: { title: "Expand, migrate, and contract", description: "Old and new application versions overlap while a backfill and change capture populate a verified target before cutover.", chart: `flowchart LR
  A[Expand schema] --> B[Compatible writes]
  B --> C[Bounded backfill]
  B --> D[Capture live changes]
  C --> E[Verify parity]
  D --> E
  E --> F[Switch reads]
  F --> G[Contract later]` },
    example: { title: "Split a display name", body: "Add given_name and family_name while retaining display_name. New code writes both forms, a checkpointed worker backfills old rows, and shadow reads compare reconstructed names before the new columns become authoritative.", consequence: "Every deploy remains reversible until measured parity and old-client retirement make contraction safe." },
    tradeoffs: [{ option: "Expand/contract", chooseWhen: "Application versions overlap and downtime is unacceptable.", cost: "Temporary dual representation and longer operational ownership." }, { option: "Maintenance cutover", chooseWhen: "The dataset is small and an explicit outage is acceptable.", cost: "Simple implementation but direct availability impact." }, { option: "New store plus CDC", chooseWhen: "The storage engine or access model changes.", cost: "Lag, reconciliation, and dual-system failure modes." }],
    failure: { failure: "Backfill writes stale values after a live update.", impact: "The target passes row-count checks but contains older business state.", detection: "Version mismatches, invariant comparison, CDC lag, and sampled source-target checksums.", mitigation: "Use version-aware upserts or capture a change-log position, make batches idempotent, and verify after catch-up.", tradeoff: "Extra metadata and write coordination buy an auditable cutover." },
    exercise: ["Name every simultaneously deployed reader and writer.", "Choose a restartable cursor and per-row idempotency rule.", "Define parity metrics and a cutover threshold.", "Write rollback steps for each phase, not only the final deploy."],
    probes: ["How do you prevent a backfill from overwriting a newer write?", "When can the old column or store actually be removed?", "What happens when change capture falls behind?"],
    practice: ["payment-system", "ecommerce", "feature-store"],
    remember: "Expand first, migrate under live writes, prove parity, switch deliberately, and contract last.",
  },
  "incident-recovery-postmortems": {
    id: "incident-recovery-postmortems",
    decision: "Optimize first for bounded user impact and coordinated recovery; investigate deeply after the service is stable and turn learning into owned prevention work.",
    mechanism: ["Detect an objective symptom and declare the incident early.", "Assign incident command, operations, and communication roles.", "Mitigate with the safest reversible action that reduces impact.", "Recover service and data, then validate user-visible health.", "Document timeline, contributing conditions, detection gaps, and action items without blame."],
    diagram: { title: "Incident lifecycle", description: "Detection leads to coordinated mitigation and verified recovery, followed by a learning loop that improves preparation.", chart: `flowchart LR
  A[Detect and declare] --> B[Coordinate]
  B --> C[Mitigate impact]
  C --> D[Recover and verify]
  D --> E[Communicate closure]
  E --> F[Postmortem actions]
  F --> A` },
    example: { title: "Corrupt configuration rollout", body: "Error rate rises after a config push. The incident commander freezes changes, operations rolls back the config, communications posts impact updates, and the team verifies error rate and queued work before closing.", consequence: "The postmortem adds schema validation, a canary, rollback ownership, and a dated action owner instead of merely naming the bad config." },
    tradeoffs: [{ option: "Rollback", chooseWhen: "A recent reversible change is the likely trigger.", cost: "May reintroduce the defect the change was meant to fix." }, { option: "Fail over", chooseWhen: "A healthy independent region or replica exists.", cost: "Replication lag and capacity uncertainty." }, { option: "Degrade", chooseWhen: "A noncritical dependency drives the incident.", cost: "Reduced product behavior and recovery reconciliation." }],
    failure: { failure: "Responders pursue root cause while impact keeps growing.", impact: "Recovery slows, communication fragments, and risky simultaneous changes compound the outage.", detection: "No incident commander, no current mitigation hypothesis, or time since last stakeholder update exceeds policy.", mitigation: "Separate command from operations, prefer one reversible mitigation at a time, maintain a timeline, and declare explicit verification criteria.", tradeoff: "Structure adds process during small incidents but prevents chaos during large ones." },
    exercise: ["Define the user-impact signal and declaration threshold.", "Assign command, operations, and communications roles.", "Choose a reversible first mitigation and rollback trigger.", "Write three measurable postmortem actions with owners and due dates."],
    probes: ["How do you distinguish mitigation from permanent remediation?", "What proves data recovery is complete?", "How do you keep a postmortem blameless but actionable?"],
    practice: ["payment-system", "notification-service", "distributed-cache"],
    remember: "Declare, coordinate, mitigate, recover, verify, communicate, and then convert evidence into owned prevention.",
  },
};

export function ReliabilityOperationsLessonContent({ lessonId }: { lessonId: string }) {
  const spec = lessons[lessonId];
  return spec ? <RequiredClosureLesson spec={spec} /> : null;
}
