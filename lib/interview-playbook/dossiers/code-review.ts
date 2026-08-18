/**
 * Code Review round-execution dossier.
 *
 * Content only — see `./schema.ts` for the shared type contract and
 * `./index.ts` for the registry that assembles every authored dossier.
 */
import type { RoundExecutionDossier } from "./schema.ts";

export const codeReviewDossier: RoundExecutionDossier = {
  slug: "code-review",
  status: "published",
  lastReviewed: "2026-08-18",
  title: "Code review: prioritize correctness, risk, and useful feedback.",
  purpose:
    "Understand the intended change, identify material correctness and risk issues, evaluate test and maintainability gaps, and communicate prioritized feedback without reducing review to personal style.",

  intendedEvaluation: [
    "Understand the requested behavior, surrounding constraints, and purpose of the change before judging individual lines.",
    "Identify correctness defects and requirement mismatches.",
    "Recognize material reliability, security, data, compatibility, and failure-path risks.",
    "Evaluate whether tests exercise the claimed behavior and important boundaries.",
    "Reason about maintainability, interfaces, coupling, readability, and local conventions proportionately.",
    "Distinguish blockers, important suggestions, questions, and minor preferences.",
    "Communicate findings collaboratively and summarize the highest-risk issues first.",
  ],

  companyVariation: [
    "Whether the candidate reviews a pull request, diff, standalone file, design-plus-code artifact, or narrated change.",
    "Whether the expected output is written comments, verbal discussion, a prioritized summary, or suggested edits.",
    "How much repository, product, and requirement context is provided.",
    "Whether the round emphasizes correctness, maintainability, security, testing, collaboration, or a combination.",
    "Whether code can be executed or tests can be inspected.",
    "Whether the interviewer expects depth on one issue or breadth across the whole change.",
  ],

  beforeRound: [
    "Confirm the artifact format, review environment, expected output, available context, and whether execution or test inspection is permitted.",
    "Refresh the codebase’s language and local conventions only enough to understand the artifact; do not substitute a style guide for behavioral reasoning.",
    "Practice separating correctness, risk, tests, maintainability, readability, and style into different priority levels.",
    "Use a practical-engineering mock or peer review exercise rather than relying only on blank-editor coding practice.",
  ],

  flow: [
    {
      id: "orient",
      title: "Orient to intent and context",
      objective:
        "Understand what the change is intended to accomplish before reviewing implementation details.",
      actions: [
        "Read the request, description, or stated behavior completely.",
        "Identify the important constraints, interfaces, and affected users or systems.",
        "Ask for missing context only when it can materially change the review.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "understand-change",
      title: "Understand the change as a whole",
      objective:
        "Build a coherent model of the implementation before commenting line by line.",
      actions: [
        "Identify the entry point, major data or control flow, and changed boundaries.",
        "Compare the implementation with adjacent tests and local conventions.",
        "Distinguish intentional behavior changes from incidental edits.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "correctness",
      title: "Review correctness and requirements",
      objective:
        "Find behavior that fails the stated contract or produces incorrect results.",
      actions: [
        "Trace representative and material boundary behavior through the change.",
        "Check assumptions, conditions, state transitions, error behavior, and return contracts.",
        "Prioritize confirmed functional defects over cosmetic preferences.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "risk",
      title: "Review material risk",
      objective:
        "Identify serious reliability, security, data, compatibility, and operational consequences.",
      actions: [
        "Inspect input trust boundaries, data handling, failure behavior, and backward compatibility where relevant.",
        "Explain the concrete consequence rather than naming a vague category.",
        "Keep risk discussion proportionate to the artifact and available evidence.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "tests-maintainability",
      title: "Review tests and maintainability",
      objective:
        "Assess whether the change can be trusted and sustained beyond the immediate example.",
      actions: [
        "Check whether tests exercise the claimed behavior and important failure or boundary cases.",
        "Evaluate interfaces, duplication, coupling, naming, and readability in the context of the local codebase.",
        "Separate changes needed for correctness from optional improvements.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "communicate",
      title: "Communicate findings proportionately",
      objective:
        "Make each finding understandable, actionable, and appropriately prioritized.",
      actions: [
        "State the observed issue and why it matters.",
        "Use a question when intent is unclear and a direct blocker when behavior is demonstrably unsafe or incorrect.",
        "Offer an alternative only when it improves a concrete dimension such as correctness, simplicity, maintainability, compatibility, or risk.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "summarize",
      title: "Prioritize and close",
      objective:
        "Leave a concise review that distinguishes material blockers from lower-priority improvements.",
      actions: [
        "Summarize the highest-risk correctness and safety issues first.",
        "Separate required changes, important suggestions, questions, and minor preferences.",
        "State which areas were reviewed and which context or execution evidence was unavailable.",
        "Avoid overwhelming the close with a list of unprioritized nits.",
      ],
      classification: "widely-applicable",
    },
  ],

  timeFrameworks: [
    {
      label: "Typical 45-minute code-review round",
      assumption:
        "This is an adaptable range for a bounded diff or small artifact. The amount of context and expected review depth may change the allocation.",
      phases: [
        {
          label: "Orient to intent",
          range: "About 4–7 minutes",
          objective:
            "Understand the requested behavior, constraints, and changed boundaries.",
          adjustment:
            "Compress this when the change description and tests make intent explicit.",
        },
        {
          label: "Correctness and material risk",
          range: "About 15–22 minutes",
          objective:
            "Trace behavior and identify the highest-impact defects or consequences.",
          adjustment:
            "Spend depth on evidence-supported risks rather than scanning every line equally.",
        },
        {
          label: "Tests and maintainability",
          range: "About 8–12 minutes",
          objective:
            "Evaluate validation coverage, interfaces, coupling, and maintainability.",
          adjustment:
            "Avoid letting style preferences displace missing behavior or test coverage.",
        },
        {
          label: "Prioritize and close",
          range: "Use the remaining 7–12 minutes",
          objective:
            "Communicate findings in priority order and identify missing context.",
          adjustment:
            "When time is short, summarize blockers and major risks before optional suggestions.",
        },
      ],
      classification: "context-dependent",
    },
    {
      label: "Typical 60-minute code-review round",
      assumption:
        "This range assumes a larger change, more repository context, or deeper discussion. It is not a universal review format.",
      phases: [
        {
          label: "Orient to intent",
          range: "About 5–10 minutes",
          objective:
            "Understand the behavior, architecture boundary, and expected review output.",
          adjustment:
            "Use the description, tests, and adjacent interfaces before requesting broad additional context.",
        },
        {
          label: "Correctness and material risk",
          range: "About 20–30 minutes",
          objective:
            "Trace important behavior and investigate high-impact findings.",
          adjustment:
            "Prioritize a few defensible issues over a large speculative list.",
        },
        {
          label: "Tests and maintainability",
          range: "About 10–16 minutes",
          objective:
            "Assess evidence, regression coverage, interfaces, and long-term clarity.",
          adjustment:
            "Keep maintainability feedback connected to concrete future cost or risk.",
        },
        {
          label: "Prioritize and close",
          range: "Use the remaining 10–16 minutes",
          objective:
            "Separate blockers, suggestions, questions, and minor preferences.",
          adjustment:
            "Leave enough time to explain the consequence and proposed next step for each major finding.",
        },
      ],
      classification: "context-dependent",
    },
  ],

  communication: [
    {
      title: "Connect findings to consequences",
      productive:
        "Explain the behavior, failure, risk, or maintenance cost created by the issue.",
      avoid:
        "Declaring code bad, messy, or wrong without a concrete reason.",
    },
    {
      title: "Separate blockers from suggestions",
      productive:
        "Make priority visible so the author knows what must change and what is optional.",
      avoid:
        "Presenting every naming preference and correctness defect with equal urgency.",
    },
    {
      title: "Use questions for unclear intent",
      productive:
        "Ask whether a behavior is deliberate when the requirement or context is incomplete.",
      avoid:
        "Accusing the author of an error when the intended contract is still unknown.",
    },
    {
      title: "Offer alternatives proportionately",
      productive:
        "Suggest a different approach only when it improves a concrete dimension supported by the artifact.",
      avoid:
        "Rewriting the change into the reviewer’s preferred style without showing material benefit.",
    },
  ],

  recovery: [
    {
      situation: "You discover context that invalidates an earlier finding.",
      response:
        "Withdraw or revise the comment explicitly and explain which new evidence changed the assessment.",
      avoid:
        "Defending the original finding after its premise is no longer valid.",
    },
    {
      situation: "The interviewer disagrees with the priority of an issue.",
      response:
        "State the consequence and evidence, ask which requirement changes the priority, and update the review accordingly.",
      avoid:
        "Treating review preference as personal authority.",
    },
    {
      situation: "You suspect a problem but cannot prove it from the artifact.",
      response:
        "Frame it as a focused question or request for a test rather than a confirmed blocker.",
      avoid:
        "Presenting speculation as a definite defect.",
    },
    {
      situation: "You identify too many potential findings.",
      response:
        "Group them by correctness, material risk, tests, maintainability, and minor style, then keep the highest-value items.",
      avoid:
        "Delivering an unprioritized list that obscures the important issues.",
    },
    {
      situation: "Time is running short.",
      response:
        "Summarize the highest-risk confirmed findings, the missing validation, and any context that prevented a complete review.",
      avoid:
        "Spending the final minutes on cosmetic comments while material issues remain unexplained.",
    },
  ],

  validation: [
    "Trace the claimed behavior through the changed code rather than reviewing isolated lines only.",
    "Compare implementation behavior with the stated requirement and adjacent interface contracts.",
    "Check whether tests exercise the central behavior and material boundary or failure cases.",
    "Verify that each blocker is supported by the artifact or clearly stated context.",
    "Separate confirmed defects from questions and optional maintainability suggestions.",
    "Review the final summary to ensure the most consequential findings appear first.",
  ],

  closing: [
    "Summarize required correctness or material-risk changes first.",
    "List important test or maintainability suggestions separately.",
    "Identify questions that require author or product clarification.",
    "State the review boundary and any areas that could not be executed or verified.",
  ],

  questionsToAsk: [
    "How does the team distinguish blocking review feedback from optional suggestions?",
    "Which types of defects or maintenance risks most often escape review?",
    "How are design disagreements resolved when several approaches are valid?",
  ],

  signals: {
    strong: [
      "Understands the intended behavior before judging implementation details.",
      "Prioritizes correctness and material risk above cosmetic preferences.",
      "Connects findings to concrete consequences.",
      "Identifies meaningful test gaps and boundary behavior.",
      "Uses questions and alternatives proportionately.",
      "Closes with a clear priority order and review boundary.",
    ],
    concern: [
      "Reviews line by line without understanding the change’s purpose.",
      "Focuses on naming and style while missing functional defects.",
      "Labels speculative concerns as confirmed blockers.",
      "Rewrites code into a personal style without concrete benefit.",
      "Uses hostile or dismissive language.",
      "Produces many low-value findings with no prioritization.",
    ],
  },

  failureModes: [
    {
      failure: "Style-first review",
      correction:
        "Evaluate requirements, correctness, material risk, and tests before readability and minor style.",
    },
    {
      failure: "Context-free judgment",
      correction:
        "Understand the intended behavior and surrounding contract before reviewing isolated implementation choices.",
    },
    {
      failure: "Everything is a blocker",
      correction:
        "Separate required corrections, important suggestions, questions, and minor preferences.",
    },
    {
      failure: "Rewrite it my way",
      correction:
        "Justify alternatives using correctness, simplicity, maintainability, compatibility, performance, or risk.",
    },
    {
      failure: "Speculation as fact",
      correction:
        "Use a question or request for evidence when the artifact does not prove the concern.",
    },
    {
      failure: "Test blindness",
      correction:
        "Check whether tests exercise the claimed behavior and material boundaries.",
    },
    {
      failure: "Unprioritized summary",
      correction:
        "Lead with the highest-impact confirmed issues and place lower-value improvements afterward.",
    },
  ],

  seniority: [
    {
      level: "SDE I / entry level",
      emphasis:
        "Understand the change, identify clear correctness issues, reason about basic tests, and communicate respectfully.",
      strongSignals: [
        "Traces the main behavior correctly.",
        "Finds material functional defects.",
        "Recognizes missing representative tests.",
        "Explains findings clearly.",
      ],
      avoid: [
        "Treating code review as a syntax or naming quiz.",
        "Commenting confidently on behavior that was not understood.",
      ],
    },
    {
      level: "SDE II / mid level",
      emphasis:
        "Autonomous context building, prioritization, interface reasoning, maintainability, and proportionate risk feedback become more visible.",
      strongSignals: [
        "Connects implementation to surrounding interfaces.",
        "Prioritizes findings by consequence.",
        "Identifies regression and compatibility risks.",
        "Offers actionable, proportionate alternatives.",
      ],
      avoid: [
        "Reviewing only the local diff when adjacent behavior is clearly affected.",
        "Using maintainability language without identifying concrete future cost.",
      ],
    },
    {
      level: "Senior+",
      emphasis:
        "Senior review adds broader system consequences, risk judgment, change strategy, and collaborative decision quality where the artifact exposes them.",
      strongSignals: [
        "Recognizes material cross-boundary or operational consequences.",
        "Distinguishes urgent risk from acceptable trade-offs.",
        "Improves decision quality without forcing personal preference.",
        "Balances long-term maintainability with delivery context.",
      ],
      avoid: [
        "Turning a bounded review into a complete architecture replacement.",
        "Using seniority to make ungrounded blocker claims.",
        "Ignoring local correctness because broader design is more interesting.",
      ],
    },
  ],

  environment: {
    remote: [
      "Confirm the diff, repository, test, annotation, and screen-sharing tools before the round.",
      "Keep the relevant requirement and code region visible when explaining a finding.",
      "State immediately when rendering, access, or execution limitations prevent validation.",
    ],
    onsite: [
      "Confirm whether the review uses printed code, a projected diff, a shared editor, or verbal discussion.",
      "Keep findings grouped by priority so the shared surface does not become an unstructured list.",
      "Ask before marking or removing information the interviewer may still be referencing.",
    ],
    accessibility: [
      "Request formal accommodations through the recruiter or designated company contact before the interview when possible.",
      "Ask for the diff, requirement, or output to be enlarged, written, repeated, or split into smaller sections when useful.",
      "A deliberate reading pace or written prioritization method is not evidence of weaker review ability.",
      "The Playbook does not infer capability from reading speed, speaking speed, eye contact, accent, or a particular feedback style.",
    ],
  },

  companyModifierRules: [
    "Official recruiter and company-provided instructions override this general guide.",
    "Candidate reports may describe historical review formats but must not be presented as current company policy.",
    "Use the verified Company Guide for known artifact, language, collaboration, security, or level-specific modifiers.",
    "Do not infer a universal comment format, blocking threshold, review order, execution environment, or scoring rubric.",
  ],

  interactions: [
    {
      id: "style-correctness",
      title: "Style preference versus correctness",
      scenario:
        "The reviewer notices an unusual name and a branch that returns the wrong result for an empty input.",
      weak:
        "The candidate spends several minutes renaming variables before mentioning the incorrect behavior.",
      strong:
        "The candidate leads with the incorrect empty-input behavior, then notes the naming suggestion as optional readability feedback.",
      annotation:
        "Material correctness should not be obscured by cosmetic preferences.",
      classification: "illustrative",
    },
    {
      id: "question",
      title: "Question versus accusation",
      scenario:
        "A retry appears to omit a condition, but the intended product behavior is not documented.",
      weak:
        "The candidate says the author implemented retries incorrectly.",
      strong:
        "The candidate says: “Should this retry only transient failures? The current branch also retries permanent validation errors, which may repeat work without succeeding.”",
      annotation:
        "The stronger version surfaces the potential consequence while acknowledging missing intent.",
      classification: "illustrative",
    },
    {
      id: "priority",
      title: "Blocker versus suggestion",
      scenario:
        "The change contains a data-loss path and a small duplication that could be refactored.",
      weak:
        "The candidate presents both comments with the same urgency.",
      strong:
        "The candidate marks the data-loss path as blocking and the duplication as a later maintainability suggestion.",
      annotation:
        "Prioritization is part of the review evidence, not merely a formatting choice.",
      classification: "illustrative",
    },
    {
      id: "disagreement",
      title: "Handling disagreement",
      scenario:
        "The interviewer says the proposed abstraction is unnecessary for the current scope.",
      weak:
        "The candidate argues that their structure is cleaner and continues to insist on it.",
      strong:
        "The candidate says: “For this bounded change, the existing structure may be sufficient. I would keep my comment only if we expect the second variation described in the requirement.”",
      annotation:
        "The stronger response ties the recommendation to a concrete future need and adapts when that need is absent.",
      classification: "illustrative",
    },
    {
      id: "short-on-time",
      title: "Closing when review time is short",
      scenario:
        "Several minor comments remain, but two material issues have been confirmed.",
      weak:
        "The candidate rapidly lists every remaining naming and formatting concern.",
      strong:
        "The candidate says: “The two required changes are the incorrect authorization boundary and the missing failure-case test. I also have lower-priority readability suggestions that should not block the change.”",
      annotation:
        "A prioritized partial review provides more value than an exhaustive unstructured list.",
      classification: "illustrative",
    },
  ],

  integrity: [
    "This dossier describes general code-review execution behavior, not a company scoring rubric.",
    "It does not reproduce proprietary review artifacts or claim knowledge of hidden standards.",
    "It does not authorize external assistance during a live interview.",
    "Language, testing, security, design, and collaboration instruction remain in their owning learning and practice resources.",
  ],
};
