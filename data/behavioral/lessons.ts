export type BehavioralLessonLevel = "Foundation" | "Intermediate" | "Advanced";

export type BehavioralLessonPhase = "Evidence" | "Construction" | "Judgment" | "Calibration";

export interface BehavioralLearningSource {
  id: string;
  label: string;
  publisher: string;
  url: string;
  supports: string;
}

export interface BehavioralLesson {
  number: number;
  slug: string;
  title: string;
  navigationTitle: string;
  objective: string;
  phase: BehavioralLessonPhase;
  level: BehavioralLessonLevel;
  estimatedMinutes: number;
  takeaway: string;
  concepts: Array<{ title: string; body: string; checks: string[] }>;
  example: { title: string; context: string; weak: string; stronger: string; annotations: string[] };
  exercise: { prompt: string; steps: string[]; answerCheck: string };
  sourceIds: string[];
  nextAction: { label: string; href: string };
}

export const behavioralLearningSources: BehavioralLearningSource[] = [
  {
    id: "SRC-BEH-OPM-STRUCTURED",
    label: "Structured Interviews",
    publisher: "U.S. Office of Personnel Management",
    url: "https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/",
    supports: "Job-related competencies, consistent questions, and common evaluation standards.",
  },
  {
    id: "SRC-BEH-OPM-GUIDE",
    label: "Structured Interview Guide",
    publisher: "U.S. Office of Personnel Management",
    url: "https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/guide/",
    supports: "Behavioral examples, proficiency boundaries, follow-up probes, and evidence-based rating anchors.",
  },
  {
    id: "SRC-BEH-GOVUK-SUCCESS",
    label: "Success Profiles",
    publisher: "UK Cabinet Office",
    url: "https://www.gov.uk/government/publications/success-profiles",
    supports: "Role-relative behaviors, experience, technical evidence, and level-specific expectations.",
  },
  {
    id: "SRC-BEH-EEOC-SELECTION",
    label: "Uniform Guidelines Q&A",
    publisher: "U.S. Equal Employment Opportunity Commission",
    url: "https://www.eeoc.gov/laws/guidance/questions-and-answers-clarify-and-provide-common-interpretation-uniform-guidelines",
    supports: "The boundary that interview selection procedures should remain job-related and validated rather than personality folklore.",
  },
  {
    id: "SRC-BEH-AMAZON-INTERVIEW",
    label: "Interview loop preparation",
    publisher: "Amazon Jobs",
    url: "https://www.amazon.jobs/content/en-gb/how-we-hire/interview-loop",
    supports: "A first-party example of behavioral questions and STAR as one company-specific preparation convention.",
  },
];

export const behavioralLessonPhases: Array<{ id: BehavioralLessonPhase; label: string; description: string }> = [
  { id: "Evidence", label: "01 · Evidence", description: "Build truthful source material before shaping an answer." },
  { id: "Construction", label: "02 · Construction", description: "Turn facts into concise, adaptable explanations." },
  { id: "Judgment", label: "03 · Judgment", description: "Make decisions, conflict, failure, and ambiguity inspectable." },
  { id: "Calibration", label: "04 · Calibration", description: "Prepare depth, follow-ups, level context, and safe review." },
];

export const behavioralLessons: BehavioralLesson[] = [
  {
    number: 1,
    slug: "what-behavioral-interviews-evaluate",
    title: "What behavioral interviews evaluate",
    navigationTitle: "What gets evaluated",
    objective: "Separate job-relevant evidence from personality, confidence, or culture-fit mythology.",
    phase: "Evidence",
    level: "Foundation",
    estimatedMinutes: 12,
    takeaway: "Prepare observable decisions and actions that relate to the role; do not rehearse a personality performance.",
    concepts: [
      { title: "Evidence is role-relative", body: "A structured behavioral prompt asks for information about a job-relevant competency. The same event can support different competencies only when the answer exposes the relevant decision, action, and result.", checks: ["Name the competency in plain language.", "Identify the action an interviewer could verify from your account.", "Keep employer-specific criteria separate from universal claims."] },
      { title: "Inference has a boundary", body: "A response can show what happened in one context. It cannot prove personality, honesty, future performance, or cultural fit. Engineering Foundry therefore reviews answer evidence and consistency rather than predicting hiring outcomes.", checks: ["Describe behavior, not identity.", "Do not score accent, eye contact, emotion, or confidence.", "Treat every rubric result as preparation feedback, not a hiring verdict."] },
    ],
    example: { title: "Observable behavior versus a trait label", context: "A candidate coordinated a risky migration across two teams.", weak: "I am a natural leader and everyone trusted me.", stronger: "I wrote the rollback criteria, asked each team to name an owner, and paused the rollout when one dependency had no recovery test.", annotations: ["The stronger version names actions.", "It avoids claiming an internal trait.", "A follow-up can inspect the decision and result."] },
    exercise: { prompt: "Rewrite “I am great under pressure” using one event you can discuss safely.", steps: ["Name the pressure or constraint.", "Name one decision you personally made.", "Name the observable result or unresolved outcome."], answerCheck: "A useful answer contains a bounded event and inspectable action. It does not need to prove that you are always calm or successful." },
    sourceIds: ["SRC-BEH-OPM-STRUCTURED", "SRC-BEH-EEOC-SELECTION"],
    nextAction: { label: "Audit one saved story", href: "/behavioral/stories" },
  },
  {
    number: 2,
    slug: "evidence-not-opinions",
    title: "Evidence, not opinions or hypotheticals",
    navigationTitle: "Evidence, not opinions",
    objective: "Turn generic claims into a factual event with ownership, constraints, and evidence limits.",
    phase: "Evidence",
    level: "Foundation",
    estimatedMinutes: 14,
    takeaway: "Past evidence is useful when fact, interpretation, team action, and personal action remain distinguishable.",
    concepts: [
      { title: "Four evidence layers", body: "Start with facts that remain stable, then add your interpretation, the team response, and your personal contribution. Mixing these layers creates accidental overclaiming and makes follow-ups brittle.", checks: ["Which details are direct facts?", "Which statement is your interpretation?", "What did the team do, and what did you do?"] },
      { title: "Qualitative outcomes count", body: "A credible result may be an incident contained, a decision made, a risk exposed, a customer complaint resolved, or a process changed. Use numbers only when you know their source and limits.", checks: ["Name the evidence source.", "State what remained unresolved.", "Add a causality caveat when others contributed."] },
    ],
    example: { title: "Replace a slogan with an evidence thread", context: "A release repeatedly failed during handoff.", weak: "I always take ownership and improved deployment efficiency by 80%.", stronger: "After two handoff failures, I traced the missing approval step, added it to the release checklist, and paired with the service owner for the next release. That release completed without the same failure; I cannot isolate the checklist from the pairing effect.", annotations: ["The event and sequence are explicit.", "The metric was removed because its source was unknown.", "The causal limit is preserved."] },
    exercise: { prompt: "Choose one résumé claim and decompose it into fact, interpretation, team action, personal action, and evidence.", steps: ["Underline every number and name its source.", "Replace “we” with the actual actors where it matters.", "Write one sentence about what you cannot attribute to yourself."], answerCheck: "The final evidence thread should survive a request for dates, actors, measurement, and adverse facts without changing its core reality." },
    sourceIds: ["SRC-BEH-OPM-STRUCTURED", "SRC-BEH-OPM-GUIDE"],
    nextAction: { label: "Create a canonical story", href: "/behavioral/stories/new" },
  },
  {
    number: 3,
    slug: "response-frameworks-without-scripts",
    title: "Response frameworks without rigid scripts",
    navigationTitle: "Frameworks without scripts",
    objective: "Use STAR, CAR, SAR, SOAR, or a natural evidence arc as structure—not as the evaluation rubric.",
    phase: "Evidence",
    level: "Foundation",
    estimatedMinutes: 13,
    takeaway: "Choose the lightest structure that keeps context short, makes your action central, and leaves room for dialogue.",
    concepts: [
      { title: "Frameworks solve ordering", body: "STAR is useful because it separates setting, responsibility, action, and result. CAR compresses context; SOAR foregrounds obstacles. None guarantees relevance, judgment, integrity, or follow-up depth.", checks: ["Can the listener locate your responsibility?", "Does the action contain a consequential choice?", "Do you stop after the result instead of delivering a speech?"] },
      { title: "Natural evidence arc", body: "Orient the interviewer, establish stakes and responsibility, explain pivotal reasoning and action, state the outcome with limits, reflect when relevant, then stop. The labels can disappear in delivery.", checks: ["One or two setup sentences are usually enough.", "Reasoning belongs beside the action it changed.", "Reflection should name changed behavior, not a slogan."] },
    ],
    example: { title: "The same facts in two shapes", context: "A customer-impacting queue backed up during a launch.", weak: "Situation: there was an outage. Task: fix it. Action: I fixed it. Result: it worked.", stronger: "During launch traffic, our queue age crossed the support threshold. I owned mitigation, chose to shed optional work rather than scale an untested consumer, and restored the customer path while another engineer prepared the capacity change. We later added queue-age alerts and a tested degradation mode.", annotations: ["The stronger answer still follows STAR.", "The decision and trade-off are visible.", "The durable mechanism supports learning."] },
    exercise: { prompt: "Tell one event first with explicit STAR labels, then again as a natural 90-second evidence arc.", steps: ["Keep the facts identical.", "Remove labels without removing responsibility or result.", "Mark the sentence where a follow-up should begin."], answerCheck: "Both versions should describe the same event, role, decision, and outcome. Only the presentation structure may change." },
    sourceIds: ["SRC-BEH-AMAZON-INTERVIEW", "SRC-BEH-OPM-GUIDE"],
    nextAction: { label: "Practice an original prompt", href: "/behavioral#practice" },
  },
  {
    number: 4,
    slug: "build-a-canonical-story",
    title: "Build a canonical story record",
    navigationTitle: "Canonical story record",
    objective: "Capture stable facts once so every answer variant and follow-up has the same source of truth.",
    phase: "Evidence",
    level: "Foundation",
    estimatedMinutes: 18,
    takeaway: "The story owns facts; answer variants own emphasis and delivery.",
    concepts: [
      { title: "Minimum durable record", body: "Record the event, time period, role, stakes, responsibility, constraints, alternatives, personal and team actions, result, evidence, caveat, reflection, and confidentiality status. Missing detail can remain unknown.", checks: ["Dates and role are stable.", "Personal action is separate from team action.", "Sensitive names and customer details are generalized before practice."] },
      { title: "Variants cannot backfill facts", body: "A concise or question-specific answer may omit detail, but it must not introduce a metric, decision, role, technology, or outcome that the canonical story does not support.", checks: ["New claim? Update or confirm the story first.", "Material adverse facts remain present.", "Every metric retains its source and unit."] },
    ],
    example: { title: "One source, multiple presentations", context: "A story record contains a migration decision, a rollback, and a later test harness.", weak: "The concise version claims a flawless launch while the deep-dive version admits a rollback.", stronger: "Both versions state that the first rollout was reversed. The concise version says why and what changed; the deep dive adds the technical trigger and test design.", annotations: ["Omission must not invert reality.", "Depth can change without changing facts.", "The adverse fact improves follow-up resilience."] },
    exercise: { prompt: "Draft a canonical record for one event before writing an answer.", steps: ["List immutable facts and known unknowns.", "Separate personal action, team action, and outcome.", "Write the confidentiality-safe version of every proper noun or sensitive number."], answerCheck: "Another truthful presentation of the event should be derivable without inventing a fact or exposing information you cannot share." },
    sourceIds: ["SRC-BEH-OPM-GUIDE"],
    nextAction: { label: "Open the private story form", href: "/behavioral/stories/new" },
  },
  {
    number: 5,
    slug: "choose-stories-and-build-coverage",
    title: "Choose stories and build coverage",
    navigationTitle: "Story coverage",
    objective: "Inspect evidence breadth and reuse risk without imposing an arbitrary story count or readiness percentage.",
    phase: "Construction",
    level: "Foundation",
    estimatedMinutes: 15,
    takeaway: "Coverage is a map of available evidence, not a score of the candidate.",
    concepts: [
      { title: "Cover situations, not keywords", body: "Map stories across delivery, failure, conflict, ambiguity, influence, customer impact, technical judgment, mentoring, and ethics. One strong story can support several questions, but it should not become the answer to everything.", checks: ["Include success and failure.", "Include individual execution and influence through others.", "Include technical and interpersonal evidence."] },
      { title: "Use descriptive states", body: "Call an area uncovered when no story maps to it, thin when only one story carries it, and covered when independent evidence exists. These labels say nothing about hire probability.", checks: ["Name the next evidence gap.", "Flag a story reused across many questions.", "Prefer a second event over changing the first event's facts."] },
    ],
    example: { title: "A concentrated story bank", context: "Five delivery questions and four influence questions all point to one launch story.", weak: "Nine mappings means the candidate is highly prepared.", stronger: "Delivery evidence exists, but reuse is concentrated. Conflict and failure have no independent event, so the next action is to prepare one truthful example from either area.", annotations: ["Counts remain inspectable.", "No readiness percentage is inferred.", "The recommendation identifies a missing evidence family."] },
    exercise: { prompt: "Map three real stories across at least six question families.", steps: ["Mark uncovered and thin families.", "Circle any story used six or more times.", "Choose one next story based on missing evidence, not an arbitrary quota."], answerCheck: "A useful map yields a specific next evidence action and makes reuse concentration visible without rating your personality or potential." },
    sourceIds: ["SRC-BEH-OPM-STRUCTURED", "SRC-BEH-GOVUK-SUCCESS"],
    nextAction: { label: "Inspect private coverage", href: "/behavioral/workspace" },
  },
  {
    number: 6,
    slug: "personal-ownership-in-team-work",
    title: "Personal ownership within team work",
    navigationTitle: "Personal ownership",
    objective: "Explain personal decisions and work while giving collaborators accurate credit.",
    phase: "Construction",
    level: "Foundation",
    estimatedMinutes: 14,
    takeaway: "Replace ambiguous “we” with the actual actor only where ownership or judgment matters.",
    concepts: [
      { title: "Credit and accountability coexist", body: "Strong ownership does not mean claiming the team's output. Name the group goal, then identify what you personally decided, implemented, communicated, escalated, or learned.", checks: ["Who owned the goal?", "What decision authority did you have?", "Which result required other people's work?"] },
      { title: "Use verbs that can be probed", body: "“Helped” and “worked on” hide the useful detail. Prefer precise verbs—analyzed, proposed, implemented, reviewed, facilitated, or escalated—only when they are true.", checks: ["Can you describe the artifact or conversation?", "Can a teammate's role remain visible?", "Can you explain a decision you did not own?"] },
    ],
    example: { title: "From team-only to attributable", context: "Three engineers reduced repeated on-call pages.", weak: "We fixed alerting and made reliability much better.", stronger: "The team agreed to replace the noisy alert. I analyzed six weeks of pages, proposed a symptom-based threshold, and implemented the dashboard; the service owner changed the retry policy. Pages for that symptom stopped during the next review window.", annotations: ["Personal and team actions are separate.", "The evidence window is bounded.", "No sole-causation claim is made."] },
    exercise: { prompt: "Highlight every “we” in one draft and decide whether the sentence needs the team actor, your actor, or both.", steps: ["Preserve shared credit.", "Make one consequential personal decision explicit.", "Add the boundary of your authority."], answerCheck: "The listener should know what you owned without concluding that you worked alone or controlled decisions you did not control." },
    sourceIds: ["SRC-BEH-OPM-GUIDE"],
    nextAction: { label: "Review a saved answer", href: "/behavioral/questions" },
  },
  {
    number: 7,
    slug: "technical-depth-for-the-audience",
    title: "Technical depth for a non-identical audience",
    navigationTitle: "Technical depth",
    objective: "Explain enough mechanism to establish judgment while keeping the behavioral decision central.",
    phase: "Construction",
    level: "Intermediate",
    estimatedMinutes: 15,
    takeaway: "Depth is adaptive: explain the mechanism, constraint, and failure mode that changed your decision.",
    concepts: [
      { title: "Use a relevance filter", body: "Include architecture only when it explains stakes, alternatives, risk, or your action. A component inventory that never changes the decision is noise.", checks: ["What broke or could break?", "Which constraint eliminated an option?", "Which detail would you remove for a recruiter?"] },
      { title: "Prepare two layers", body: "Start with a plain-language system boundary, then keep one deeper mechanism ready for a technical follow-up. Ask whether the interviewer wants more depth rather than assuming.", checks: ["One-sentence system model.", "One failure mechanism.", "One deeper trade-off with technical consequences."] },
    ],
    example: { title: "A cache migration for a mixed audience", context: "The candidate changed cache ownership during a reliability project.", weak: "We used Redis Cluster, consistent hashing, Lua, Kubernetes, and a complex sidecar topology.", stronger: "Two services could overwrite each other's cache state, so retries amplified stale reads. I proposed one ownership boundary and a dual-read migration; when error rate rose, the rollback path let us revert without losing writes. I can explain the key-routing detail if useful.", annotations: ["Mechanism supports the decision.", "Jargon is translated into consequence.", "The answer invites rather than forces deeper detail."] },
    exercise: { prompt: "Explain one technical decision at recruiter, peer engineer, and architecture-review depth.", steps: ["Keep the event and outcome identical.", "Add detail only when it explains judgment.", "Write the question you will use to offer deeper context."], answerCheck: "All three versions should preserve the same facts; only mechanism depth and assumed vocabulary change." },
    sourceIds: ["SRC-BEH-GOVUK-SUCCESS", "SRC-BEH-OPM-GUIDE"],
    nextAction: { label: "Practice a technical-judgment prompt", href: "/behavioral?category=Technical%20Challenge" },
  },
  {
    number: 8,
    slug: "impact-without-invented-metrics",
    title: "Impact without invented metrics",
    navigationTitle: "Honest impact",
    objective: "Use quantitative, qualitative, operational, risk, customer, and learning evidence without overstating causation.",
    phase: "Construction",
    level: "Intermediate",
    estimatedMinutes: 16,
    takeaway: "Specific evidence is broader than metrics, and every number needs a source and limit.",
    concepts: [
      { title: "Use an evidence ladder", body: "Prefer a verified metric when available. Otherwise name an operational observation, customer report, artifact, decision, avoided risk, or later behavior. Do not manufacture precision to make a story sound senior.", checks: ["Where did the evidence come from?", "What measurement window applies?", "What outcome remained unknown?"] },
      { title: "Separate contribution from causation", body: "State what your action plausibly influenced and what else changed. A truthful caveat often strengthens credibility because it shows measurement judgment.", checks: ["What other contributors existed?", "Was the comparison controlled?", "Can you claim direction without claiming exact magnitude?"] },
    ],
    example: { title: "Reliability without revenue attribution", context: "A candidate fixed a recurring deployment failure but cannot access revenue data.", weak: "My fix saved the company millions and improved reliability by 95%.", stronger: "I removed the race that caused three documented rollbacks and added a pre-deploy concurrency test. The next eight deployments did not reproduce that failure. I do not have evidence linking the change to revenue.", annotations: ["The evidence is inspectable.", "The window and failure class are bounded.", "The unavailable business metric is not invented."] },
    exercise: { prompt: "Rewrite one story outcome using the strongest evidence you actually have.", steps: ["Name the source and window for every number.", "Add one non-numeric evidence type.", "Write a causality caveat in plain language."], answerCheck: "The result should remain meaningful if every unsupported percentage or dollar estimate is removed." },
    sourceIds: ["SRC-BEH-OPM-GUIDE"],
    nextAction: { label: "Check answer facts", href: "/behavioral/questions" },
  },
  {
    number: 9,
    slug: "decisions-alternatives-and-tradeoffs",
    title: "Decision-making, alternatives, and trade-offs",
    navigationTitle: "Decisions and trade-offs",
    objective: "Reconstruct what was known at the time and why a choice was reasonable under its constraints.",
    phase: "Judgment",
    level: "Intermediate",
    estimatedMinutes: 17,
    takeaway: "Judgment is visible when the answer names alternatives, criteria, uncertainty, and the evidence that changed the plan.",
    concepts: [
      { title: "Avoid hindsight certainty", body: "A good answer does not pretend the final outcome was obvious. State the options available, missing information, decision criteria, and risk controls at the moment of choice.", checks: ["What did you know then?", "Which alternative was credible?", "What reversible step reduced uncertainty?"] },
      { title: "Updating is evidence", body: "Changing direction after new data can demonstrate judgment. Explain the trigger and how you protected the team from thrash.", checks: ["What observation changed the decision?", "Who needed to be re-aligned?", "What did you preserve from the original plan?"] },
    ],
    example: { title: "Sync versus async under burst risk", context: "A team had to ingest partner updates before a fixed launch.", weak: "I chose Kafka because it scales better.", stronger: "Synchronous processing was simpler, but partner bursts could hold request threads past our latency budget. I chose a queued path with idempotency keys, kept the initial consumer single-region, and defined a backlog threshold that would pause onboarding. A load test later changed the batch size, not the ownership model.", annotations: ["A real alternative is acknowledged.", "Criteria and risk control are explicit.", "Later evidence changes a bounded part of the plan."] },
    exercise: { prompt: "Build a decision table for one consequential choice.", steps: ["List two credible alternatives.", "Name the criteria and information available then.", "Identify the trigger that would have changed your decision."], answerCheck: "The chosen option should look reasonable under the original constraints even if the eventual result was imperfect." },
    sourceIds: ["SRC-BEH-OPM-GUIDE", "SRC-BEH-GOVUK-SUCCESS"],
    nextAction: { label: "Practice decision making", href: "/behavioral?category=Decision%20Making" },
  },
  {
    number: 10,
    slug: "conflict-disagreement-and-influence",
    title: "Conflict, disagreement, and influence",
    navigationTitle: "Conflict and influence",
    objective: "Show listening, evidence, changed minds, escalation judgment, and resolution without requiring victory.",
    phase: "Judgment",
    level: "Intermediate",
    estimatedMinutes: 16,
    takeaway: "A useful conflict story explains two valid concerns and the mechanism that moved the work forward.",
    concepts: [
      { title: "Conflict is not combat", body: "Describe the substantive disagreement, each party's concern, and the shared constraint. Avoid villain narratives and claims about motive you cannot know.", checks: ["What did the other person need?", "What evidence did you seek?", "What changed in your own view?"] },
      { title: "Influence has a mechanism", body: "Influence may be a prototype, written proposal, customer evidence, facilitated decision, coalition, escalation, or concession. “I convinced them” hides the transferable behavior.", checks: ["What medium changed the conversation?", "Who held decision authority?", "What compromise preserved both concerns?"] },
    ],
    example: { title: "A hybrid resolution", context: "Platform and product teams disagreed on a shared API migration.", weak: "The product lead was unreasonable, but I convinced them to follow my architecture.", stronger: "Product needed the launch date; platform needed to avoid two permanent APIs. I proposed a versioned adapter with a removal date, asked product to own one compatibility test, and documented the cost. We kept the date and removed the adapter after the second client migrated.", annotations: ["Both concerns remain valid.", "Influence is visible as a concrete proposal.", "The resolution includes a durable boundary."] },
    exercise: { prompt: "Retell one disagreement from the other party's constraint before describing your proposal.", steps: ["Remove motive labels.", "Name what changed your mind, if anything.", "Explain who decided and what remained disputed."], answerCheck: "The story should demonstrate productive movement even if your preferred option did not win." },
    sourceIds: ["SRC-BEH-OPM-GUIDE"],
    nextAction: { label: "Practice conflict prompts", href: "/behavioral?category=Conflict" },
  },
  {
    number: 11,
    slug: "failure-incidents-and-learning",
    title: "Failure, mistakes, incidents, and learning",
    navigationTitle: "Failure and learning",
    objective: "Own a real error, explain consequences and recovery, and show a durable change without blame or self-destruction.",
    phase: "Judgment",
    level: "Intermediate",
    estimatedMinutes: 18,
    takeaway: "The strongest failure answer makes responsibility, impact, recovery, and changed system or behavior inspectable.",
    concepts: [
      { title: "Choose a real adverse event", body: "A disguised success avoids the question. Select an event with an actual miss, mistaken assumption, preventable incident, or unsuccessful outcome that you can discuss safely.", checks: ["What did you get wrong?", "Who or what was affected?", "What part was not yours to own?"] },
      { title: "Learning needs a mechanism", body: "“I learned to communicate” is incomplete. Name the test, review, alert, checklist, design constraint, or recurring behavior that changed afterward.", checks: ["What did you do immediately?", "What prevented recurrence?", "Where did the fix still fall short?"] },
    ],
    example: { title: "Mixed-version serialization failure", context: "A rollout broke compatibility between old and new workers.", weak: "The team made a mistake, but I worked all night and became more detail-oriented.", stronger: "I approved a schema change without testing mixed worker versions. When old workers rejected the payload, I stopped the rollout, restored the prior writer, and told support which jobs needed replay. I later added compatibility fixtures and required a mixed-version stage for schema changes.", annotations: ["The personal error is explicit.", "Recovery includes users and operations.", "The lesson became a repeatable mechanism."] },
    exercise: { prompt: "Write a failure timeline with decision, signal, consequence, mitigation, and prevention.", steps: ["Use “I” for your mistake and action.", "Name the affected party without exposing confidential detail.", "Separate immediate recovery from durable prevention."], answerCheck: "A listener should understand both the failure and why your later behavior or system is meaningfully different." },
    sourceIds: ["SRC-BEH-OPM-GUIDE"],
    nextAction: { label: "Practice failure prompts", href: "/behavioral?category=Failure" },
  },
  {
    number: 12,
    slug: "ambiguity-priorities-and-deadlines",
    title: "Ambiguity, priorities, and deadlines",
    navigationTitle: "Ambiguity and priorities",
    objective: "Expose how you frame unknowns, choose what not to do, manage risk, and update stakeholders.",
    phase: "Judgment",
    level: "Intermediate",
    estimatedMinutes: 17,
    takeaway: "Prioritization evidence includes the rejected work, the risk accepted, and the signal that would change the plan.",
    concepts: [
      { title: "Turn ambiguity into decisions", body: "Name the unknowns, owners, and smallest useful test. Do not claim you removed uncertainty; show how you bounded it enough to act.", checks: ["Which unknown could reverse the plan?", "What could be learned cheaply?", "What decision could wait?"] },
      { title: "A deadline creates exclusions", body: "A credible deadline story states what was cut, deferred, or degraded, who accepted the risk, and how the decision was communicated.", checks: ["What did you explicitly not do?", "Which quality floor stayed non-negotiable?", "How did stakeholders learn about the trade-off?"] },
    ],
    example: { title: "Launch versus reliability commitment", context: "A small team faced a fixed customer pilot and unresolved retry behavior.", weak: "I worked harder and delivered everything on time.", stronger: "I separated pilot-critical flows from two reporting features, kept the idempotency fix as the quality floor, and proposed deferring reports by one week. Product accepted the scope change after I showed the duplicate-charge risk and a manual reporting fallback.", annotations: ["The rejected work is named.", "A risk-based quality floor is explicit.", "Decision authority and communication remain visible."] },
    exercise: { prompt: "Reconstruct one deadline decision as a priority stack.", steps: ["List must-do, defer, and reject items.", "Name the risk and owner for each deferred item.", "Write the update you gave to a stakeholder."], answerCheck: "The answer should show judgment under constraint, not only effort or heroics." },
    sourceIds: ["SRC-BEH-GOVUK-SUCCESS", "SRC-BEH-OPM-GUIDE"],
    nextAction: { label: "Practice prioritization", href: "/behavioral?category=Prioritization" },
  },
  {
    number: 13,
    slug: "leadership-mentoring-and-standards",
    title: "Leadership, mentoring, feedback, and raising standards",
    navigationTitle: "Leadership without title",
    objective: "Show leverage through others and durable mechanisms at a scope appropriate to your role.",
    phase: "Calibration",
    level: "Advanced",
    estimatedMinutes: 17,
    takeaway: "Leadership evidence is a change in direction, capability, or mechanism—not a management title.",
    concepts: [
      { title: "Name the leverage", body: "Leadership may be framing a problem, creating alignment, mentoring a teammate, improving a review standard, or building a tool that changes repeated work. Keep the beneficiary and mechanism concrete.", checks: ["Who could act differently afterward?", "What persisted without you?", "How did you share credit and authority?"] },
      { title: "Mentoring is not rescue", body: "Describe the learner's goal, the feedback or scaffolding you provided, and the autonomy they gained. Avoid presenting another person's growth as your achievement alone.", checks: ["What did they choose?", "What did you stop doing for them?", "What evidence suggests the support helped?"] },
    ],
    example: { title: "Leadership without a title", context: "An engineer noticed inconsistent incident reviews on a six-person team.", weak: "I became the team leader and made everyone write better postmortems.", stronger: "I compared three reviews, proposed a lightweight decision-and-detection template, and facilitated the first two sessions. Another engineer then owned the template and adapted it; later reviews consistently named an owner and verification step.", annotations: ["Formal authority is not invented.", "Adoption is shared with another owner.", "The durable mechanism is observable."] },
    exercise: { prompt: "Choose one example of leverage that did not depend on formal authority.", steps: ["Name the repeated problem.", "Explain how another person or team gained capability.", "State what continued without your direct involvement."], answerCheck: "The answer should demonstrate influence or durable improvement while crediting the people who adopted or extended it." },
    sourceIds: ["SRC-BEH-GOVUK-SUCCESS", "SRC-BEH-OPM-GUIDE"],
    nextAction: { label: "Practice influence prompts", href: "/behavioral?category=Influence" },
  },
  {
    number: 14,
    slug: "career-narrative-and-conversational-questions",
    title: "Career narrative and common conversational questions",
    navigationTitle: "Career narrative",
    objective: "Prepare truthful, bounded answers for transitions, motivation, strengths, development areas, gaps, and role fit.",
    phase: "Calibration",
    level: "Foundation",
    estimatedMinutes: 16,
    takeaway: "Conversational answers need a coherent present-to-future bridge, not a fabricated past-behavior story.",
    concepts: [
      { title: "Use a present–past–future bridge", body: "Start with the work you do now, select two or three past transitions that explain your direction, and connect that evidence to the actual role. A résumé chronology is not a narrative.", checks: ["What thread connects the transitions?", "Which detail is relevant to this role?", "What are you seeking next without criticizing a prior employer?"] },
      { title: "Treat sensitive transitions plainly", body: "A gap, layoff, short tenure, or development area can be described briefly and factually. Do not invent a growth arc or disclose private information you do not want to discuss.", checks: ["State only what is needed.", "Name current evidence of direction or improvement.", "Stop before defensive over-explanation."] },
    ],
    example: { title: "A 90-second role bridge", context: "A backend engineer is moving toward platform reliability.", weak: "I have always been passionate about your amazing company and want a new challenge.", stronger: "I currently own APIs used by two product teams. The work I keep returning to is failure isolation and making safe operations easier for other engineers; after leading a retry redesign, I took on our deployment guardrails. This role's platform reliability scope is the next place I can deepen that work, which is why I want to understand how the team measures service ownership.", annotations: ["Motivation is tied to evidence.", "No universal company claim is made.", "The final question opens a two-way conversation."] },
    exercise: { prompt: "Record a 90-second present–past–future narrative for one real role.", steps: ["Use two evidence-backed transitions at most.", "Remove generic praise and unverified company claims.", "End with one role-specific question."], answerCheck: "The listener should understand your direction and role fit without hearing a memorized autobiography." },
    sourceIds: ["SRC-BEH-GOVUK-SUCCESS"],
    nextAction: { label: "Open the Interview Playbook", href: "/interview-playbook" },
  },
  {
    number: 15,
    slug: "followups-deep-dives-and-consistency",
    title: "Follow-ups, project deep dives, and consistency",
    navigationTitle: "Follow-ups and consistency",
    objective: "Handle ownership, alternatives, metrics, counterfactuals, technical depth, and inconsistencies without changing facts.",
    phase: "Calibration",
    level: "Advanced",
    estimatedMinutes: 18,
    takeaway: "Follow-up readiness comes from a complete source story and honest unknowns, not a larger script.",
    concepts: [
      { title: "Probe the highest-value gap", body: "After an initial answer, ask what remains least supported: relevance, ownership, decision rationale, evidence, risk, learning, scope, or confidentiality. Do not repeat a result question that was already answered.", checks: ["Which claim is least inspectable?", "What counterfactual tests the decision?", "Which technical detail changes the judgment?"] },
      { title: "Unknown and confidential are valid", body: "Say when you do not know, cannot attribute, or cannot share a detail. Offer a safe abstraction or the decision principle instead of filling the gap with invented precision.", checks: ["Can you name the boundary directly?", "Can you generalize without distorting?", "Does the answer remain useful after redaction?"] },
    ],
    example: { title: "Adaptive probe tree", context: "An answer explains the result but leaves ownership and alternatives vague.", weak: "Ask again: What was the result? Then ask a generic list of ten follow-ups.", stronger: "First ask: Which part did you personally decide? If authority was shared, ask who made the final call. Then ask which alternative was closest and what evidence would have changed the choice.", annotations: ["The answered result is not repeated.", "Each next probe depends on the prior answer.", "The tree stops after the evidence gap is resolved."] },
    exercise: { prompt: "Give an initial answer, then generate only three probes from its actual evidence gaps.", steps: ["Mark what is already clear.", "Choose the highest-value missing dimension.", "After each reply, decide whether to deepen or move to the next gap."], answerCheck: "The probes should depend on the answer and preserve canonical facts. A fixed question list is not adaptive practice." },
    sourceIds: ["SRC-BEH-OPM-GUIDE"],
    nextAction: { label: "Choose a question to rehearse", href: "/behavioral/questions" },
  },
  {
    number: 16,
    slug: "seniority-company-modifiers-and-self-review",
    title: "Seniority, role, company modifiers, and self-review",
    navigationTitle: "Calibrate and self-review",
    objective: "Calibrate scope and depth without inflating verbosity, and apply company context only with provenance.",
    phase: "Calibration",
    level: "Advanced",
    estimatedMinutes: 20,
    takeaway: "Level changes the evidence boundary—scope, ambiguity, consequence, influence, and leverage—not the truth of the story.",
    concepts: [
      { title: "Calibrate relative scope", body: "Entry evidence can show credible ownership and learning. Mid-level evidence adds independent judgment and durable team/service improvement. Senior and Staff+ evidence may show wider ambiguity and leverage, but company size and title are not proxies for scope.", checks: ["What consequence did you own?", "Who or what changed beyond your task?", "Is broader scope real, or only added language?"] },
      { title: "Company context modifies prompts", body: "A current official value or interview guide can change likely emphasis, but it cannot change story facts or establish hidden scoring rules. Preserve source, date, role, region, and uncertainty.", checks: ["Is the source first-party or clearly labeled otherwise?", "Does applicability match this role and region?", "Would the story remain truthful without the company vocabulary?"] },
      { title: "Review dimensions independently", body: "Check relevance, specificity, ownership, judgment, technical understanding, outcome, learning, communication, follow-up depth, scope, and integrity. Record evidence per dimension; do not collapse the result into a readiness score.", checks: ["Which dimension has observable support?", "Which needs another probe?", "What one to three next actions follow?"] },
    ],
    example: { title: "The same incident at two levels", context: "An engineer prevented a repeat incident with a compatibility test.", weak: "For Senior, make the answer longer and say the work was strategic.", stronger: "At SDE II scope, emphasize independent diagnosis, rollback, and the service-level test. For Senior scope, use the same facts only if the candidate also aligned multiple owners, changed a cross-team standard, or managed broader risk. If that did not happen, do not claim it.", annotations: ["Facts stay identical.", "Level evidence is conditional and inspectable.", "Small-company scope can still be substantial when consequences and leverage are real."] },
    exercise: { prompt: "Review one story against two adjacent level contexts and one sourced company modifier.", steps: ["Mark evidence that truly supports each level.", "Remove any company language that changes facts.", "Choose one to three next actions without producing a score."], answerCheck: "The review should explain supported scope and missing evidence. It must not predict hiring, personality, or cultural fit." },
    sourceIds: ["SRC-BEH-GOVUK-SUCCESS", "SRC-BEH-OPM-GUIDE", "SRC-BEH-AMAZON-INTERVIEW", "SRC-BEH-EEOC-SELECTION"],
    nextAction: { label: "Return evidence to the Playbook", href: "/interview-playbook" },
  },
];

export function getBehavioralLesson(slug: string) {
  return behavioralLessons.find((lesson) => lesson.slug === slug);
}

export function behavioralLessonHref(slug: string) {
  return `/behavioral/learn/${slug}`;
}
