/**
 * Canonical round-execution dossier schema and content.
 *
 * A dossier is the deeper reference behind a v1 execution guide's compact
 * quick reference. This file defines the reusable schema once and is
 * expected to gain one dossier object per guide over successive slices —
 * currently `algorithmic-coding`, `practical-coding`, and `debugging`. An
 * unauthored guide simply has no entry; `getRoundExecutionDossier` returns
 * `null` rather than a fabricated placeholder.
 *
 * Pure and dependency-light: no React, Next.js, Supabase, auth, database,
 * current time, or randomness.
 */
import type { RoundExecutionGuideSlug } from "./round-execution.ts";

/** Editorial classification of a content unit — never an evidence probability. */
export type RoundExecutionContentClassification = "widely-applicable" | "context-dependent" | "illustrative";

export type RoundExecutionDossierFlowStep = Readonly<{
  id: string;
  title: string;
  objective: string;
  actions: readonly string[];
  classification: "widely-applicable" | "context-dependent";
}>;

export type RoundExecutionTimePhase = Readonly<{
  label: string;
  range: string;
  objective: string;
  adjustment: string;
}>;

export type RoundExecutionTimeFramework = Readonly<{
  label: string;
  assumption: string;
  phases: readonly RoundExecutionTimePhase[];
  classification: "context-dependent";
}>;

export type RoundExecutionCommunicationPattern = Readonly<{
  title: string;
  productive: string;
  avoid: string;
}>;

export type RoundExecutionRecoveryScenario = Readonly<{
  situation: string;
  response: string;
  avoid: string;
}>;

export type RoundExecutionFailureMode = Readonly<{
  failure: string;
  correction: string;
}>;

export type RoundExecutionSeniorityCalibration = Readonly<{
  level: "SDE I / entry level" | "SDE II / mid level" | "Senior+";
  emphasis: string;
  strongSignals: readonly string[];
  avoid: readonly string[];
}>;

export type RoundExecutionInteractionExample = Readonly<{
  id: string;
  title: string;
  scenario: string;
  weak: string;
  strong: string;
  annotation: string;
  classification: "illustrative";
}>;

export type RoundExecutionDossier = Readonly<{
  slug: RoundExecutionGuideSlug;
  status: "published" | "draft";
  lastReviewed: string;
  title: string;
  purpose: string;
  intendedEvaluation: readonly string[];
  companyVariation: readonly string[];
  beforeRound: readonly string[];
  flow: readonly RoundExecutionDossierFlowStep[];
  timeFrameworks: readonly RoundExecutionTimeFramework[];
  communication: readonly RoundExecutionCommunicationPattern[];
  recovery: readonly RoundExecutionRecoveryScenario[];
  validation: readonly string[];
  closing: readonly string[];
  questionsToAsk: readonly string[];
  signals: Readonly<{
    strong: readonly string[];
    concern: readonly string[];
  }>;
  failureModes: readonly RoundExecutionFailureMode[];
  seniority: readonly RoundExecutionSeniorityCalibration[];
  environment: Readonly<{
    remote: readonly string[];
    onsite: readonly string[];
    accessibility: readonly string[];
  }>;
  companyModifierRules: readonly string[];
  interactions: readonly RoundExecutionInteractionExample[];
  integrity: readonly string[];
}>;

const algorithmicCodingDossier: RoundExecutionDossier = {
  slug: "algorithmic-coding",
  status: "published",
  lastReviewed: "2026-08-18",
  title: "Algorithmic coding: from prompt to validated solution",
  purpose:
    "Make problem understanding, algorithmic reasoning, implementation correctness, testing, and collaboration observable without turning the interview into a memorized performance.",

  intendedEvaluation: [
    "Translate a prompt into a precise input, output, and behavioral contract.",
    "Recognize material constraints and select an approach appropriate to them.",
    "Explain a correct baseline before or alongside a more efficient approach when that progression is useful.",
    "Choose data structures and invariants deliberately rather than by pattern-name recall alone.",
    "Produce readable, internally consistent code and identify mistakes while working.",
    "Validate behavior with representative examples, material edge cases, and complexity analysis.",
    "Respond constructively to hints, follow-up constraints, and interviewer redirection.",
  ],

  companyVariation: [
    "Whether the round contains one problem, several shorter problems, or one problem with follow-up modifications.",
    "Whether code runs in an executable editor, a shared document, a whiteboard, or an interviewer-controlled environment.",
    "Whether the interviewer expects an explicit baseline before optimization.",
    "How much collaboration, prompting, or silent working time the interviewer prefers.",
    "Whether language choice is open, restricted, or tied to the role.",
    "Whether the interview emphasizes implementation completeness, reasoning depth, testing, follow-ups, or a combination.",
  ],

  beforeRound: [
    "Confirm the permitted language, editor, code-execution behavior, and resource policy from the invitation or recruiter-provided instructions.",
    "Know whether the environment provides compilation, sample tests, autocomplete, or no execution support.",
    "Prepare the approved development environment and a backup contact path for technical failure.",
    "Use the DSA and Mock Interview sections for technical practice; do not replace practice with memorizing an opening script.",
  ],

  flow: [
    {
      id: "orient",
      title: "Orient to the task",
      objective: "Establish what must be produced before discussing an implementation.",
      actions: [
        "Restate the objective in your own words.",
        "Identify the expected input, output, and important behavioral requirement.",
        "Confirm any material mismatch between the spoken prompt and the visible prompt.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "clarify",
      title: "Clarify material ambiguity",
      objective: "Resolve only questions that can change the approach, correctness conditions, or interface.",
      actions: [
        "Ask about constraints that affect time or space choices.",
        "Clarify duplicate, ordering, mutation, empty-input, or invalid-input behavior only when the prompt leaves it material.",
        "Stop clarifying once the contract is sufficient to choose an approach.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "example-baseline",
      title: "Work an example and establish a baseline",
      objective: "Expose the structure of the problem and show a correct starting point.",
      actions: [
        "Use one small representative example to verify understanding.",
        "State a straightforward correct approach when it helps establish the trade-off.",
        "Do not spend most of the round implementing a baseline the interviewer has already agreed can remain conceptual.",
      ],
      classification: "context-dependent",
    },
    {
      id: "approach",
      title: "Choose and explain the approach",
      objective: "Make the core invariant, data structure choice, and expected complexity understandable before implementation.",
      actions: [
        "Name the information that must be tracked as the algorithm progresses.",
        "Explain why the chosen representation supports the required operations.",
        "State expected time and space complexity and the assumptions behind them.",
        "Invite correction once when a major interpretation remains uncertain.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "implement",
      title: "Implement while communicating",
      objective: "Produce coherent code while keeping consequential reasoning observable.",
      actions: [
        "Confirm the function signature or entry point before writing the body.",
        "Code in meaningful chunks and explain decisions, invariants, and transitions rather than individual keystrokes.",
        "Use clear names and preserve consistency between the explanation and implementation.",
        "Pause briefly when needed, then re-engage with a hypothesis or next check.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "validate",
      title: "Validate the implementation",
      objective: "Demonstrate that the code satisfies the agreed contract rather than merely looking plausible.",
      actions: [
        "Trace at least one representative input through the actual code.",
        "Test the smallest meaningful input and material boundary behavior.",
        "Check the condition most likely to violate the stated invariant.",
        "Revisit complexity using the operations the implementation actually performs.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "follow-up-close",
      title: "Handle follow-ups and close",
      objective: "Adapt deliberately and leave an honest, precise final state.",
      actions: [
        "Restate the changed requirement before modifying the approach.",
        "Explain which assumption, data structure, or complexity bound changes.",
        "State what is complete, what remains, and any unresolved defect.",
        "Close with the final approach, validation performed, and complexity.",
      ],
      classification: "widely-applicable",
    },
  ],

  timeFrameworks: [
    {
      label: "Typical 45-minute round",
      assumption:
        "This is an adaptable range after introductions, not a universal allocation. The interviewer may provide more structure, combine several tasks, or redirect the round.",
      phases: [
        {
          label: "Orient and clarify",
          range: "About 3–6 minutes",
          objective: "Establish the contract and remove solution-changing ambiguity.",
          adjustment: "Compress this when the prompt and constraints are already explicit; expand only when ambiguity materially changes correctness.",
        },
        {
          label: "Example, baseline, and approach",
          range: "About 6–10 minutes",
          objective: "Verify understanding and agree on the intended implementation direction.",
          adjustment: "Move sooner when the interviewer accepts the approach; do not keep comparing alternatives after a clear direction is established.",
        },
        {
          label: "Implementation",
          range: "About 15–22 minutes",
          objective: "Complete the core path with readable, internally consistent code.",
          adjustment: "When the prompt is multi-part, agree on the smallest complete first part before expanding.",
        },
        {
          label: "Validation, follow-up, and close",
          range: "Use the remaining 6–12 minutes",
          objective: "Test the implementation, address follow-ups, and state the final result honestly.",
          adjustment: "Protect a validation window even when implementation took longer than expected.",
        },
      ],
      classification: "context-dependent",
    },
    {
      label: "Typical 60-minute round",
      assumption: "This range assumes one substantial problem or a problem with meaningful follow-ups. Interviewer direction remains authoritative.",
      phases: [
        {
          label: "Orient and clarify",
          range: "About 4–8 minutes",
          objective: "Confirm the contract, constraints, and expected artifact.",
          adjustment: "Use less time when the prompt is explicit and more only when requirements are genuinely underspecified.",
        },
        {
          label: "Example, baseline, and approach",
          range: "About 8–14 minutes",
          objective: "Develop and communicate a sound plan before coding.",
          adjustment: "Avoid turning this into a survey of every possible algorithm.",
        },
        {
          label: "Implementation",
          range: "About 20–30 minutes",
          objective: "Build the core solution and preserve enough time to test it.",
          adjustment: "Prioritize a correct central path over optional abstractions or speculative extensibility.",
        },
        {
          label: "Validation, follow-up, and close",
          range: "Use the remaining 10–18 minutes",
          objective: "Exercise the code, analyze complexity, and adapt to follow-up requirements.",
          adjustment: "If the interviewer introduces a follow-up early, explicitly renegotiate what will be completed.",
        },
      ],
      classification: "context-dependent",
    },
  ],

  communication: [
    {
      title: "Narrate decisions, not keystrokes",
      productive: "Explain why a representation, invariant, or branch is needed and what it guarantees.",
      avoid: "Describing every variable declaration, loop character, or line as it is typed.",
    },
    {
      title: "Use bounded silence",
      productive: "Say that you need a brief moment, think, and return with a concrete hypothesis, example, or next check.",
      avoid: "Extended silence with no indication of whether you are reasoning, blocked, or waiting.",
    },
    {
      title: "Receive hints transparently",
      productive: "Acknowledge the hint, explain what it changes in your understanding, and integrate it into the approach.",
      avoid: "Ignoring the hint, becoming defensive, or presenting the resulting idea as though the hint was never given.",
    },
    {
      title: "Ask for help when it changes the outcome",
      productive: "After a bounded attempt, state the exact point of uncertainty and ask a focused question.",
      avoid: "Asking the interviewer to choose the approach before you have attempted to reason about it.",
    },
  ],

  recovery: [
    {
      situation: "You blank after hearing the prompt.",
      response: "Return to the smallest example, restate the required output, and identify one obviously correct baseline operation.",
      avoid: "Apologizing repeatedly or waiting for the complete optimized solution to appear before speaking.",
    },
    {
      situation: "You discover a logic error while coding.",
      response: "Stop, name the violated condition or invariant, make the smallest coherent correction, and rerun the failing case.",
      avoid: "Patching several lines randomly or pretending the defect is only syntax.",
    },
    {
      situation: "You are uncertain about syntax or a library API.",
      response: "State the intended operation precisely, use simple syntax or clear pseudocode when permitted, and keep the algorithmic reasoning moving.",
      avoid: "Spending most of the remaining time recalling a convenience method that is not central to the solution.",
    },
    {
      situation: "The interviewer disagrees with an assumption.",
      response: "Restate the assumption, ask which requirement or counterexample invalidates it, and update the contract before changing code.",
      avoid: "Arguing from authority or changing the implementation without understanding the disagreement.",
    },
    {
      situation: "Time is running short.",
      response: "Finish the central path, mark unfinished work precisely, validate one representative case, and state the remaining risk and complexity.",
      avoid: "Rushing through untested code while claiming the solution is complete.",
    },
  ],

  validation: [
    "Trace a representative normal case through the code as written.",
    "Test the smallest valid input and any empty-input behavior included in the agreed contract.",
    "Check duplicates, repeated values, or ordering boundaries when they can change correctness.",
    "Check index, range, overflow, mutation, or termination boundaries relevant to the implementation.",
    "Verify that helper functions preserve the main invariant rather than assuming they do.",
    "State time and space complexity from the final implementation, not from an earlier plan.",
  ],

  closing: [
    "Summarize the final algorithm and the key invariant in one concise explanation.",
    "State which tests or traces were performed.",
    "Identify any incomplete branch, unresolved defect, or assumption honestly.",
    "Respond to follow-up modifications by restating the changed requirement before editing.",
  ],

  questionsToAsk: [
    "What kinds of technical decisions are engineers at this level expected to own on the team?",
    "How does the team review and test changes before they reach production?",
    "What would make an engineer effective during the first several months in this role?",
  ],

  signals: {
    strong: [
      "Clarifies ambiguity that can materially change the solution.",
      "Explains a correct baseline and the reason for improving it.",
      "Maintains a clear invariant between explanation and code.",
      "Tests proactively rather than waiting for the interviewer to request it.",
      "Uses hints productively and adapts without becoming defensive.",
      "Communicates consequential reasoning without excessive narration.",
    ],
    concern: [
      "Starts coding before establishing the contract.",
      "Names a memorized pattern without explaining why it applies.",
      "Remains silent for long periods without re-engaging.",
      "Narrates syntax while leaving the core reasoning implicit.",
      "Claims correctness after checking only the provided example.",
      "Responds defensively to hints, corrections, or changed requirements.",
    ],
  },

  failureModes: [
    { failure: "Excessive clarification", correction: "Ask only questions whose answers can change correctness, interface, or the selected approach." },
    { failure: "Premature optimization", correction: "Establish a correct baseline or invariant before committing to a more complex implementation." },
    { failure: "Solution dumping", correction: "Explain the tracked state, invariant, and operations instead of naming a technique and immediately coding it." },
    { failure: "Coding before confirming the interface", correction: "Confirm the function signature, return behavior, and mutation assumptions first." },
    { failure: "Sample-only validation", correction: "Add a minimal case, a material boundary case, and a case likely to violate the invariant." },
    { failure: "Complexity theater", correction: "Connect complexity claims to the actual loops, recursive calls, data-structure operations, and retained state." },
    { failure: "Unstructured recovery", correction: "Name the failing condition, form one bounded hypothesis, make one correction, and rerun the case." },
  ],

  seniority: [
    {
      level: "SDE I / entry level",
      emphasis: "Correctness, fundamental problem solving, understandable code, and basic testing carry the most weight.",
      strongSignals: [
        "Builds a correct approach from the problem statement.",
        "Uses common language constructs reliably.",
        "Recognizes and tests important edge cases.",
        "Accepts guidance and incorporates it accurately.",
      ],
      avoid: [
        "Introducing advanced abstractions that obscure the basic solution.",
        "Using pattern vocabulary without understanding the implementation.",
      ],
    },
    {
      level: "SDE II / mid level",
      emphasis: "The same correctness bar remains, with stronger ambiguity handling, implementation robustness, and follow-up adaptation.",
      strongSignals: [
        "Moves efficiently from contract to implementation.",
        "Explains trade-offs between viable approaches.",
        "Writes maintainable code with deliberate boundaries.",
        "Handles changed constraints without restarting from nothing.",
      ],
      avoid: [
        "Treating the problem as a memorized exercise with no judgment.",
        "Ignoring maintainability or testability once the core algorithm is known.",
      ],
    },
    {
      level: "Senior+",
      emphasis: "Senior execution combines coding correctness with crisp scope control, practical judgment, maintainability, and depth under follow-up.",
      strongSignals: [
        "Identifies the simplest solution appropriate to the stated constraints.",
        "Explains invariants and operational trade-offs precisely.",
        "Protects validation time and communicates residual risk honestly.",
        "Balances extensibility with the need to complete the interview task.",
      ],
      avoid: [
        "Overengineering a production framework around a bounded problem.",
        "Dismissing implementation detail because the role is senior.",
        "Assuming seniority requires an obscure technique rather than sound judgment.",
      ],
    },
  ],

  environment: {
    remote: [
      "Confirm the shared editor, audio, screen-sharing, and code-execution behavior before the round begins.",
      "Keep the active code region visible and announce briefly when navigating to another section.",
      "Prepare a backup contact path for editor, network, or audio failure.",
    ],
    onsite: [
      "Use board or paper space deliberately so the contract, example, and code remain readable.",
      "Keep variable names and state transitions legible enough for collaborative review.",
      "Ask before erasing information that the interviewer may still be using.",
    ],
    accessibility: [
      "Request formal accommodations through the recruiter or designated company contact before the interview when possible.",
      "During the round, ask for a prompt to be repeated, written, enlarged, or separated into parts when that would improve access.",
      "A brief processing pause or a request to confirm the current requirement is not a failure signal.",
      "The Playbook does not infer capability from speaking speed, eye contact, accent, or a particular communication style.",
    ],
  },

  companyModifierRules: [
    "Official recruiter and company-provided instructions override this general guide.",
    "Candidate-reported formats may provide context but must not be presented as current company policy.",
    "Use the verified Company Guide for known language, environment, round-shape, or level-specific modifiers.",
    "Do not infer a universal number of problems, hint policy, execution environment, or scoring rubric from the phrase coding interview.",
  ],

  interactions: [
    {
      id: "clarification",
      title: "Strong clarification versus excessive clarification",
      scenario: "The prompt describes transforming a collection but does not state whether the input may be changed.",
      weak: "The candidate asks a long sequence of speculative questions about every possible data type, invalid value, system limit, and production requirement before discussing an approach.",
      strong: "The candidate says: “I can solve this either by reusing the input or by keeping separate state. May I modify the input, and are duplicate values valid?”",
      annotation: "The strong version asks only questions that can change the representation or correctness conditions.",
      classification: "illustrative",
    },
    {
      id: "thinking-aloud",
      title: "Productive thinking aloud versus keystroke narration",
      scenario: "The candidate has chosen an approach and begins implementation.",
      weak: "The candidate says: “Now I am typing a loop. Now I am creating a variable. Now I am adding one.”",
      strong: "The candidate says: “I need one piece of state that represents what has already been seen. That lets each new element be checked once while preserving the invariant.”",
      annotation: "The strong version exposes the decision and invariant rather than narrating syntax.",
      classification: "illustrative",
    },
    {
      id: "hint",
      title: "Receiving a hint",
      scenario: "The interviewer suggests reconsidering what information must be retained.",
      weak: "The candidate ignores the hint, repeats the same approach, or adopts the answer without explaining what changed.",
      strong: "The candidate says: “That suggests I do not need the full history—only the state relevant to the next decision. I will revise the invariant and reduce the retained data.”",
      annotation: "The candidate acknowledges the hint and makes its effect on the approach observable.",
      classification: "illustrative",
    },
    {
      id: "error-recovery",
      title: "Recovering from a logic error",
      scenario: "A manual trace shows that the implementation skips the first valid result.",
      weak: "The candidate changes several conditions at once and says the issue was probably a typo.",
      strong: "The candidate says: “My update happens before I check the current state, so the invariant is already changed when this case is evaluated. I will reverse those operations and rerun this input.”",
      annotation: "The strong version identifies the violated invariant, makes one coherent correction, and retests.",
      classification: "illustrative",
    },
    {
      id: "short-on-time",
      title: "Closing when time is short",
      scenario: "The main algorithm is implemented, but validation and one boundary branch remain.",
      weak: "The candidate says the solution is done and begins discussing unrelated improvements.",
      strong: "The candidate says: “The central path is implemented. I still need to verify the empty-input branch and run the duplicate case. The current complexity is linear time with additional state proportional to the retained values.”",
      annotation: "A precise partial close is stronger than an unsupported claim of completeness.",
      classification: "illustrative",
    },
  ],

  integrity: [
    "This dossier describes general execution behavior, not a pass/fail rubric.",
    "It does not reproduce proprietary questions or claim knowledge of hidden evaluation criteria.",
    "It does not provide assistance during a live assessment.",
    "Technical learning and problem practice remain in the DSA and Mock Interview sections.",
  ],
};

const practicalCodingDossier: RoundExecutionDossier = {
  slug: "practical-coding",
  status: "published",
  lastReviewed: "2026-08-18",
  title: "Practical coding: make a safe change in context.",
  purpose:
    "Navigate an unfamiliar but bounded codebase, establish expected behavior, implement the smallest maintainable change, verify it with available evidence, and communicate remaining production risk.",

  intendedEvaluation: [
    "Establish the required behavior and the boundary of the requested change before editing.",
    "Navigate to relevant entry points, interfaces, tests, and adjacent implementation without attempting to understand the entire repository.",
    "Use the existing codebase’s conventions and abstractions unless a concrete requirement justifies changing them.",
    "Scope a proportionate implementation rather than turning a bounded task into an unrelated rewrite.",
    "Implement incrementally while preserving compatibility, readability, and internal consistency.",
    "Use tests, executable behavior, and targeted inspection to validate the change.",
    "Explain material trade-offs, untested areas, regression risk, and what would still be required before production use.",
  ],

  companyVariation: [
    "Whether the candidate receives a small repository, a single file, a framework project, or a partially implemented feature.",
    "Whether the environment supports running the application, tests, build commands, or only static inspection.",
    "Whether documentation, external references, dependencies, or other assistance are permitted.",
    "Whether the task emphasizes feature work, integration, refactoring, testing, data handling, or framework usage.",
    "How closely the interviewer collaborates, provides navigation hints, or expects independent exploration.",
    "Whether completion is judged primarily by working behavior, test quality, maintainability, explanation, or a combination.",
  ],

  beforeRound: [
    "Confirm the repository, language, framework, run command, test command, and permitted-resource policy from recruiter-provided or company-provided instructions.",
    "Open the environment early enough to resolve dependency, access, editor, or execution problems before the interview.",
    "Refresh only the language and framework operations needed to read, change, and test ordinary code; do not replace practical rehearsal with broad curriculum review.",
    "Use the Mock Interview Lab or another permitted practice environment for repository navigation and change-validation rehearsal.",
  ],

  flow: [
    {
      id: "orient",
      title: "Orient to the environment",
      objective:
        "Understand the task, available tools, repository shape, and expected artifact before editing.",
      actions: [
        "Read the complete prompt and identify the required behavioral outcome.",
        "Locate the run, build, and test instructions where available.",
        "Confirm whether the interviewer expects a code change, explanation, test, or combination.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "establish-behavior",
      title: "Establish current and expected behavior",
      objective:
        "Create a precise behavioral contract and, where possible, observe the existing result.",
      actions: [
        "Restate the expected behavior and important compatibility constraints.",
        "Run or inspect an existing test, example, or entry path when the environment permits.",
        "Separate confirmed current behavior from assumptions that still need verification.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "locate-surface",
      title: "Locate the smallest relevant surface",
      objective:
        "Find the files, interfaces, tests, and data flow needed for the change without exploring the entire codebase.",
      actions: [
        "Trace from the relevant entry point toward the behavior that must change.",
        "Inspect adjacent tests and conventions before introducing a new pattern.",
        "Stop browsing when enough context exists to describe a bounded implementation.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "plan-change",
      title: "Plan a proportionate change",
      objective:
        "State the intended modification, affected boundary, and validation approach before implementation.",
      actions: [
        "Describe the smallest coherent change that can satisfy the requirement.",
        "Identify compatibility, failure-path, data, and test implications that materially affect the plan.",
        "Call out deliberately deferred refactoring or polish rather than silently expanding scope.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "implement",
      title: "Implement incrementally",
      objective:
        "Build a readable change that follows the existing structure and can be validated in parts.",
      actions: [
        "Change one meaningful boundary at a time.",
        "Use existing abstractions and naming conventions unless they directly block the requirement.",
        "Keep explanation focused on decisions, state transitions, and risk rather than every file opened or line typed.",
        "Run a targeted check after each coherent increment when the environment supports it.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "validate",
      title: "Validate behavior and regression risk",
      objective:
        "Show that the requested behavior works and that important neighboring behavior was not unintentionally broken.",
      actions: [
        "Run the most relevant existing tests and add or describe a focused test when appropriate.",
        "Exercise the requested behavior directly using representative and material boundary cases.",
        "Inspect the final diff for unrelated changes, temporary output, and inconsistent conventions.",
        "Distinguish what was verified from what remains assumed or untested.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "close-risk",
      title: "Close with evidence and risk",
      objective:
        "Leave a precise account of what changed, why it works, and what remains before production use.",
      actions: [
        "Summarize the changed behavior and the implementation boundary.",
        "State the tests, runs, or inspections performed.",
        "Identify any incomplete path, untested integration, or material production risk.",
        "Explain the next concrete validation or hardening step when work remains.",
      ],
      classification: "widely-applicable",
    },
  ],

  timeFrameworks: [
    {
      label: "Typical 45-minute practical round",
      assumption:
        "This is an adaptable range for a bounded repository task after introductions. The actual environment, task size, and interviewer direction remain authoritative.",
      phases: [
        {
          label: "Orient and establish behavior",
          range: "About 4–8 minutes",
          objective:
            "Understand the required behavior, available commands, and current code boundary.",
          adjustment:
            "Compress this when the prompt, entry point, and tests are explicit; expand only when missing context can materially change the implementation.",
        },
        {
          label: "Locate the surface and plan",
          range: "About 6–10 minutes",
          objective:
            "Find the relevant files and agree on a proportionate change.",
          adjustment:
            "Stop repository exploration once the behavior, boundary, and validation path are clear.",
        },
        {
          label: "Implement incrementally",
          range: "About 16–22 minutes",
          objective:
            "Complete the smallest maintainable change that satisfies the central requirement.",
          adjustment:
            "Defer speculative refactoring and optional polish until the requested behavior works.",
        },
        {
          label: "Validate and close",
          range: "Use the remaining 7–13 minutes",
          objective:
            "Run targeted tests, inspect the change, and communicate remaining risk.",
          adjustment:
            "Protect a validation window even when orientation or implementation took longer than expected.",
        },
      ],
      classification: "context-dependent",
    },
    {
      label: "Typical 60-minute practical round",
      assumption:
        "This range assumes a larger bounded change or meaningful integration work. It is not a universal company format.",
      phases: [
        {
          label: "Orient and establish behavior",
          range: "About 5–10 minutes",
          objective:
            "Understand the artifact, expected result, environment, and current behavior.",
          adjustment:
            "Use available tests and documentation instead of browsing unrelated directories.",
        },
        {
          label: "Locate the surface and plan",
          range: "About 8–14 minutes",
          objective:
            "Trace the relevant path and define the smallest coherent implementation.",
          adjustment:
            "When several approaches are viable, choose one and state the trade-off rather than surveying every alternative.",
        },
        {
          label: "Implement incrementally",
          range: "About 22–30 minutes",
          objective:
            "Complete the central behavior while following existing boundaries and conventions.",
          adjustment:
            "Renegotiate scope explicitly if the interviewer adds a second requirement or exposes a larger dependency.",
        },
        {
          label: "Validate and close",
          range: "Use the remaining 10–18 minutes",
          objective:
            "Exercise the change, run relevant regression checks, and summarize production risk.",
          adjustment:
            "Prioritize evidence for the central behavior over optional abstractions or cosmetic cleanup.",
        },
      ],
      classification: "context-dependent",
    },
  ],

  communication: [
    {
      title: "Explain navigation intent",
      productive:
        "State the boundary you are trying to find, such as where input is validated or where the response is assembled.",
      avoid:
        "Narrating every directory, filename, search result, or cursor movement without explaining why it matters.",
    },
    {
      title: "Separate observed behavior from assumptions",
      productive:
        "Say what a test, log, interface, or execution result confirms and what remains inferred.",
      avoid:
        "Treating an unverified guess about the codebase as established behavior.",
    },
    {
      title: "Explain deviations from local conventions",
      productive:
        "Follow the existing structure by default and name the concrete reason when a new boundary or abstraction is necessary.",
      avoid:
        "Rewriting surrounding code because a different personal style is preferred.",
    },
    {
      title: "Make risk proportionate",
      productive:
        "Discuss compatibility, failure paths, tests, and rollout concerns in proportion to the requested change.",
      avoid:
        "Either ignoring material production risk or turning a small interview task into a speculative architecture review.",
    },
  ],

  recovery: [
    {
      situation: "You cannot find the relevant entry point.",
      response:
        "Return to the requested behavior, inspect the closest test, route, interface, or invocation, and trace one boundary at a time.",
      avoid:
        "Opening directories randomly or attempting to read the entire repository.",
    },
    {
      situation: "Existing tests fail before your change.",
      response:
        "Record the baseline failure, distinguish it from your task, and ask whether to proceed using the nearest reliable validation path.",
      avoid:
        "Claiming responsibility for the failure or silently changing unrelated code to make the suite green.",
    },
    {
      situation: "Your change introduces a regression.",
      response:
        "Revert or localize the most recent coherent increment, identify the violated contract, and rerun the failing case.",
      avoid:
        "Layering additional patches over a change whose effect is not understood.",
    },
    {
      situation: "You are uncertain about a framework or library operation.",
      response:
        "State the intended behavior, use permitted documentation when available, or choose a simpler existing repository pattern.",
      avoid:
        "Spending most of the round recalling a convenience API unrelated to the central engineering decision.",
    },
    {
      situation: "Time is running short.",
      response:
        "Complete the central path, run the highest-value test, and state precisely which integration, boundary, or cleanup work remains.",
      avoid:
        "Starting a broad refactor or claiming production readiness without validation.",
    },
  ],

  validation: [
    "Run the most relevant existing test or command for the changed behavior.",
    "Exercise the requested happy path directly when the environment permits.",
    "Check a material boundary, invalid-input, compatibility, or failure path.",
    "Inspect the final diff for unrelated edits, temporary output, secrets, and inconsistent conventions.",
    "Run a broader regression, build, type, or lint check when time and environment make it proportionate.",
    "State explicitly which integrations or production behaviors were not validated.",
  ],

  closing: [
    "Summarize the user-visible or system-visible behavior that changed.",
    "Identify the files or boundaries changed without reciting every edit.",
    "State the tests, commands, or observations used as evidence.",
    "Name any incomplete work, untested integration, or production risk and the next validation step.",
  ],

  questionsToAsk: [
    "How does the team normally validate and review changes before production?",
    "Which parts of this codebase tend to require the most context for a new engineer?",
    "What would make an engineer effective in the first several months on this team?",
  ],

  signals: {
    strong: [
      "Finds the relevant code path without random repository exploration.",
      "Establishes expected behavior before modifying implementation.",
      "Scopes a small coherent change and follows existing conventions.",
      "Uses available tests and execution feedback throughout the task.",
      "Explains maintainability and compatibility decisions proportionately.",
      "Closes with clear evidence, limitations, and remaining production risk.",
    ],
    concern: [
      "Edits code before understanding the expected behavior.",
      "Attempts a broad rewrite unrelated to the requested change.",
      "Ignores existing tests, interfaces, or repository conventions.",
      "Narrates file navigation while leaving engineering decisions implicit.",
      "Treats one successful run as complete validation.",
      "Claims production readiness while material integrations remain untested.",
    ],
  },

  failureModes: [
    {
      failure: "Repository tourism",
      correction:
        "Trace from the requested behavior and stop exploring once the relevant boundary and validation path are known.",
    },
    {
      failure: "Rewrite-first behavior",
      correction:
        "Implement the smallest maintainable change that satisfies the requirement before considering broader refactoring.",
    },
    {
      failure: "Framework speculation",
      correction:
        "Use an existing local pattern or permitted documentation rather than inventing unsupported framework behavior.",
    },
    {
      failure: "Test-last execution",
      correction:
        "Use available tests or executable behavior during implementation, not only after the final edit.",
    },
    {
      failure: "Convention blindness",
      correction:
        "Inspect adjacent code and tests before introducing a new structure or naming pattern.",
    },
    {
      failure: "Unbounded polish",
      correction:
        "Prioritize required behavior, reproducibility, and material risk before optional cleanup.",
    },
    {
      failure: "Unsupported production claim",
      correction:
        "Separate verified interview behavior from integrations, load, deployment, and operational checks that were not performed.",
    },
  ],

  seniority: [
    {
      level: "SDE I / entry level",
      emphasis:
        "Correct behavior, focused navigation, safe local changes, and basic use of tests carry the most weight.",
      strongSignals: [
        "Finds the relevant implementation with reasonable guidance.",
        "Makes a bounded correct change.",
        "Uses existing tests and conventions.",
        "Explains the result clearly.",
      ],
      avoid: [
        "Introducing unnecessary abstractions before the central behavior works.",
        "Treating unfamiliar repository structure as a reason to stop reasoning.",
      ],
    },
    {
      level: "SDE II / mid level",
      emphasis:
        "Autonomous orientation, maintainable integration, test quality, compatibility, and proportionate operational judgment become more visible.",
      strongSignals: [
        "Defines the change boundary independently.",
        "Handles adjacent interfaces and failure paths deliberately.",
        "Uses tests to guide and validate implementation.",
        "Explains trade-offs and residual risk.",
      ],
      avoid: [
        "Optimizing only for a passing happy-path example.",
        "Ignoring maintainability or compatibility because the task is time-bounded.",
      ],
    },
    {
      level: "Senior+",
      emphasis:
        "Senior execution adds judgment about boundaries, broader effects, production risk, and deliberately limited scope while still completing the requested code task.",
      strongSignals: [
        "Identifies the simplest safe change for the stated requirement.",
        "Recognizes material downstream or operational consequences.",
        "Balances maintainability with interview-time completion.",
        "Communicates what would be required before shipping.",
      ],
      avoid: [
        "Turning a bounded change into an architecture redesign.",
        "Discussing production strategy instead of completing the central implementation.",
        "Assuming seniority excuses missing tests or incomplete code.",
      ],
    },
  ],

  environment: {
    remote: [
      "Confirm repository access, editor behavior, run controls, screen sharing, and the backup contact path before the round.",
      "Keep the relevant code, test, and output visible when explaining a change.",
      "State immediately when editor, dependency, network, or execution failure is blocking progress.",
    ],
    onsite: [
      "Confirm whether the task uses a provided machine, a shared editor, or discussion around printed or projected code.",
      "Keep the current behavioral contract and change boundary visible during navigation.",
      "Ask before changing environment configuration or removing information the interviewer may still need.",
    ],
    accessibility: [
      "Request formal accommodations through the recruiter or designated company contact before the interview when possible.",
      "Ask for repository text, output, or instructions to be enlarged, repeated, written, or divided into smaller steps when useful.",
      "A deliberate navigation pace or brief processing pause is not evidence of weaker engineering ability.",
      "The Playbook does not infer capability from typing speed, cursor speed, eye contact, accent, or a particular communication style.",
    ],
  },

  companyModifierRules: [
    "Official recruiter and company-provided instructions override this general guide.",
    "Candidate reports may describe historical task formats but must not be presented as current company policy.",
    "Use the verified Company Guide for known repository, framework, collaboration, or level-specific modifiers.",
    "Do not infer that every practical-coding round permits the same documentation, dependencies, tests, or external assistance.",
  ],

  interactions: [
    {
      id: "orientation",
      title: "Focused orientation versus repository tourism",
      scenario:
        "The candidate receives an unfamiliar project and must change request validation.",
      weak:
        "The candidate opens many unrelated directories and narrates filenames without connecting them to the required behavior.",
      strong:
        "The candidate says: “I’m locating the request entry point and its nearest validation test. Once I know that boundary, I can scope the change without reading the whole repository.”",
      annotation:
        "The stronger version connects navigation to the behavioral contract and establishes a stopping condition.",
      classification: "illustrative",
    },
    {
      id: "expected-behavior",
      title: "Clarifying expected behavior",
      scenario:
        "The prompt says an invalid request should be rejected but does not specify the current response contract.",
      weak:
        "The candidate immediately changes the first conditional that appears related.",
      strong:
        "The candidate says: “Before editing, I’ll inspect the existing error response and tests so the new validation preserves the current interface.”",
      annotation:
        "Practical coding begins with behavioral compatibility, not merely finding a line that can be changed.",
      classification: "illustrative",
    },
    {
      id: "redirection",
      title: "Using an interviewer hint",
      scenario:
        "The interviewer points out that a nearby test already exercises the relevant boundary.",
      weak:
        "The candidate continues exploring because the original plan was to inspect another directory first.",
      strong:
        "The candidate says: “That test gives me the current contract and a place to add the missing case. I’ll use it to narrow the implementation.”",
      annotation:
        "A useful redirection reduces uncertainty; defending inefficient exploration produces no additional evidence.",
      classification: "illustrative",
    },
    {
      id: "regression",
      title: "Recovering from a regression",
      scenario:
        "A previously passing test fails after the candidate’s change.",
      weak:
        "The candidate changes several unrelated conditions and reruns the whole suite.",
      strong:
        "The candidate says: “This regression appeared after the validation moved earlier. I’ll inspect the failed expectation, restore the previous ordering invariant, and rerun this test first.”",
      annotation:
        "The stronger response localizes the change, identifies a contract, and uses the smallest discriminating check.",
      classification: "illustrative",
    },
    {
      id: "short-on-time",
      title: "Closing a partially integrated change",
      scenario:
        "The central behavior works, but one external integration has not been exercised.",
      weak:
        "The candidate says the feature is production ready because the local test passed.",
      strong:
        "The candidate says: “The requested local behavior passes its focused tests. I have not exercised the external integration, so before shipping I would run that contract test and verify the failure path.”",
      annotation:
        "A precise validation boundary is stronger than an unsupported production-readiness claim.",
      classification: "illustrative",
    },
  ],

  integrity: [
    "This dossier describes general practical-coding execution behavior, not a pass/fail rubric.",
    "It does not teach a particular framework or reproduce proprietary tasks.",
    "It does not authorize external assistance during a live interview.",
    "Language, framework, and testing instruction remain in their owning learning and practice resources.",
  ],
};

const debuggingDossier: RoundExecutionDossier = {
  slug: "debugging",
  status: "published",
  lastReviewed: "2026-08-18",
  title: "Debugging: turn a symptom into a verified root cause.",
  purpose:
    "Observe and reproduce the failure, form falsifiable hypotheses, choose discriminating checks, repair the smallest supported cause, and verify both the original case and material neighboring behavior.",

  intendedEvaluation: [
    "Distinguish expected behavior, observed behavior, and unsupported assumptions.",
    "Reproduce or characterize the failure reliably enough to investigate it.",
    "Reduce the search space using boundaries, inputs, state, logs, tests, and recent changes.",
    "Form plausible hypotheses and choose checks that can distinguish among them.",
    "Update the working model when evidence disproves a hypothesis.",
    "Repair the smallest root cause supported by the evidence rather than masking the symptom.",
    "Run regression checks and communicate blast radius, uncertainty, and remaining production risk.",
  ],

  companyVariation: [
    "Whether the task provides executable code, tests, logs, traces, a repository, or only a narrated scenario.",
    "Whether the failure is deterministic, intermittent, environment-specific, data-dependent, or concurrency-related.",
    "Whether the candidate may use a debugger, logging, shell commands, documentation, or only code inspection.",
    "Whether the round emphasizes code-level diagnosis, distributed behavior, production incidents, or test failures.",
    "How much context the interviewer reveals initially versus after focused clarification.",
    "Whether the expected artifact is a fixed implementation, a diagnosis, an experiment plan, or a production-risk discussion.",
  ],

  beforeRound: [
    "Confirm the environment, run and test commands, available logs or traces, and permitted diagnostic tools.",
    "Know how to execute a focused test, inspect output, and make a reversible change in the provided language or environment.",
    "Practice explaining hypotheses and discriminating checks rather than memorizing a single debugging doctrine.",
    "Use a debugging or practical-coding mock when available; ordinary problem solving does not fully reproduce diagnostic uncertainty.",
  ],

  flow: [
    {
      id: "observe",
      title: "Observe the actual failure",
      objective:
        "Establish the concrete symptom and separate it from interpretation.",
      actions: [
        "State the expected behavior and the observed divergence.",
        "Identify the input, environment, timing, or state associated with the failure.",
        "Record what evidence is already available and what remains anecdotal.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "reproduce",
      title: "Reproduce or characterize",
      objective:
        "Create a reliable failing case or define the conditions under which the issue appears.",
      actions: [
        "Run the smallest known failing input or test.",
        "Check whether the failure is deterministic and whether nearby cases behave differently.",
        "When reproduction is impossible, describe the missing environment or evidence and use the best available characterization.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "localize",
      title: "Localize the failing boundary",
      objective:
        "Reduce the search space before changing code.",
      actions: [
        "Trace the value, state, or request across meaningful boundaries.",
        "Find the earliest point where actual behavior diverges from expected behavior.",
        "Use tests, logs, interfaces, and recent changes to eliminate unrelated areas.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "hypothesize",
      title: "Form explicit hypotheses",
      objective:
        "Turn suspicion into testable explanations.",
      actions: [
        "State one or more plausible causes with appropriate uncertainty.",
        "Connect each hypothesis to an observable consequence.",
        "Prioritize hypotheses using the available evidence rather than intuition alone.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "discriminate",
      title: "Run discriminating checks",
      objective:
        "Choose observations that separate competing explanations.",
      actions: [
        "Select the smallest test, trace, inspection, or temporary observation that can falsify a hypothesis.",
        "Explain what each possible result would imply before running the check.",
        "Update or discard the hypothesis when the result contradicts it.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "repair",
      title: "Repair the supported cause",
      objective:
        "Make the smallest coherent change that addresses the explained root cause.",
      actions: [
        "State the violated contract, invariant, or state transition.",
        "Change the narrowest boundary consistent with the evidence.",
        "Avoid unrelated cleanup until the original failure is resolved and verified.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "regress-close",
      title: "Regress and close",
      objective:
        "Prove that the original failure is fixed, check neighboring behavior, and communicate residual risk.",
      actions: [
        "Rerun the original failing case after the repair.",
        "Run material neighboring, boundary, or regression cases.",
        "Explain the root cause, why the fix addresses it, and what remains unverified.",
        "Identify blast radius, monitoring, rollback, or broader validation needs when relevant.",
      ],
      classification: "widely-applicable",
    },
  ],

  timeFrameworks: [
    {
      label: "Typical 45-minute debugging round",
      assumption:
        "This is an adaptable range for a bounded executable failure. Reproduction difficulty and interviewer direction may materially change the allocation.",
      phases: [
        {
          label: "Observe and reproduce",
          range: "About 5–9 minutes",
          objective:
            "Establish expected behavior and a reliable failing case.",
          adjustment:
            "When a failing test is already provided, move quickly to localization; when reproduction is unstable, agree on a bounded characterization.",
        },
        {
          label: "Localize and hypothesize",
          range: "About 8–14 minutes",
          objective:
            "Reduce the search space and state plausible causes.",
          adjustment:
            "Avoid reading every code path; follow evidence toward the earliest divergent boundary.",
        },
        {
          label: "Discriminate and repair",
          range: "About 12–18 minutes",
          objective:
            "Run targeted checks and implement the smallest evidence-supported correction.",
          adjustment:
            "When a hypothesis is disproven, update the model rather than defending sunk effort.",
        },
        {
          label: "Regress and close",
          range: "Use the remaining 8–14 minutes",
          objective:
            "Verify the original case, check neighboring behavior, and explain risk.",
          adjustment:
            "Protect time to rerun the original failure even when diagnosis took longer than expected.",
        },
      ],
      classification: "context-dependent",
    },
    {
      label: "Typical 60-minute debugging round",
      assumption:
        "This range assumes a deeper failure, larger code surface, or meaningful production-risk discussion. It is not a universal format.",
      phases: [
        {
          label: "Observe and reproduce",
          range: "About 6–12 minutes",
          objective:
            "Confirm the symptom, environment, and reproducibility.",
          adjustment:
            "Use the smallest failing case available rather than reproducing the entire production setting.",
        },
        {
          label: "Localize and hypothesize",
          range: "About 12–20 minutes",
          objective:
            "Trace relevant boundaries and form falsifiable explanations.",
          adjustment:
            "Prioritize hypotheses by evidence and expected discriminatory value.",
        },
        {
          label: "Discriminate and repair",
          range: "About 16–24 minutes",
          objective:
            "Test competing causes and make a bounded root-cause correction.",
          adjustment:
            "If the task expects diagnosis rather than code, invest the time in evidence and a safe repair plan instead of inventing an implementation.",
        },
        {
          label: "Regress and close",
          range: "Use the remaining 10–18 minutes",
          objective:
            "Confirm the repair, examine adjacent risk, and state remaining uncertainty.",
          adjustment:
            "Discuss monitoring, rollback, or broader tests only when relevant to the failure domain.",
        },
      ],
      classification: "context-dependent",
    },
  ],

  communication: [
    {
      title: "State hypotheses with uncertainty",
      productive:
        "Say what might be true, why it fits the evidence, and what check would distinguish it from another explanation.",
      avoid:
        "Presenting the first suspicion as the root cause before it has been tested.",
    },
    {
      title: "Explain the value of each check",
      productive:
        "Describe which competing causes a test, log, or inspection will support or eliminate.",
      avoid:
        "Running commands or adding output without a clear diagnostic purpose.",
    },
    {
      title: "Treat falsification as progress",
      productive:
        "Acknowledge when evidence disproves a hypothesis and update the working model.",
      avoid:
        "Defending a failed hypothesis or changing the explanation after seeing the result.",
    },
    {
      title: "Separate evidence from speculation",
      productive:
        "Label confirmed observations, plausible inferences, and remaining unknowns distinctly.",
      avoid:
        "Using confident language to hide uncertainty or missing reproduction.",
    },
  ],

  recovery: [
    {
      situation: "You cannot reproduce the failure.",
      response:
        "Clarify the original conditions, compare environment and input differences, and agree on the smallest useful characterization or instrumentation step.",
      avoid:
        "Changing code until the symptom disappears without knowing whether the original failure was exercised.",
    },
    {
      situation: "Your leading hypothesis is disproven.",
      response:
        "State what the result eliminated, update the model, and choose the next check with the highest discriminatory value.",
      avoid:
        "Treating the falsified hypothesis as wasted time or continuing to defend it.",
    },
    {
      situation: "Logs or tests produce several noisy failures.",
      response:
        "Identify the earliest common boundary, choose one representative failure, and separate likely causes from downstream symptoms.",
      avoid:
        "Attempting to repair every visible error independently.",
    },
    {
      situation: "The symptom disappears after a change but the cause is unclear.",
      response:
        "Revert or isolate the change, rerun the original case, and explain whether the repair addressed a cause or merely altered timing or state.",
      avoid:
        "Declaring success because the symptom was not observed once.",
    },
    {
      situation: "Time is running short.",
      response:
        "State the strongest supported diagnosis, the evidence collected, the smallest safe next check or repair, and the remaining uncertainty.",
      avoid:
        "Making a speculative final patch and calling the incident resolved.",
    },
  ],

  validation: [
    "Rerun the original failing case after the proposed repair.",
    "Confirm that the observed symptom and the explained cause are connected.",
    "Run a nearby passing case to detect an overly broad fix.",
    "Check boundary, state-transition, timing, or repeated-execution behavior relevant to the cause.",
    "Inspect whether the repair introduces compatibility, data, concurrency, or failure-path risk.",
    "State which environment, load, dependency, or production conditions remain unverified.",
  ],

  closing: [
    "Describe the root cause using the violated contract, invariant, boundary, or state transition.",
    "Summarize the evidence that supported the diagnosis and eliminated alternatives.",
    "State the repair and the regression checks performed.",
    "Identify residual blast radius, monitoring, rollback, or validation work when relevant.",
  ],

  questionsToAsk: [
    "How does the team investigate and learn from production failures?",
    "What observability or testing gaps create the most recurring debugging work?",
    "How are risky fixes reviewed, validated, and rolled out on this team?",
  ],

  signals: {
    strong: [
      "Separates observed behavior from interpretation.",
      "Reproduces or bounds the failure before changing code.",
      "Forms explicit hypotheses linked to observable consequences.",
      "Uses tests or observations that distinguish competing causes.",
      "Updates the model constructively when evidence disproves a hypothesis.",
      "Verifies the original case and communicates remaining risk honestly.",
    ],
    concern: [
      "Makes random edits before reproducing or characterizing the failure.",
      "Treats the first suspicion as a confirmed root cause.",
      "Adds logs or runs commands without explaining their diagnostic value.",
      "Becomes defensive when a hypothesis is falsified.",
      "Stops when the symptom disappears without explaining the cause.",
      "Claims the issue is resolved without regression checks.",
    ],
  },

  failureModes: [
    {
      failure: "Shotgun debugging",
      correction:
        "State a falsifiable hypothesis and choose one check that can distinguish it from alternatives.",
    },
    {
      failure: "Symptom-only repair",
      correction:
        "Connect the change to an explained root cause and rerun the original failure.",
    },
    {
      failure: "Log accumulation",
      correction:
        "Use each observation to answer a specific causal question rather than collecting output indiscriminately.",
    },
    {
      failure: "Hypothesis attachment",
      correction:
        "Treat contradictory evidence as useful and update the model explicitly.",
    },
    {
      failure: "Boundary skipping",
      correction:
        "Find the earliest point where actual and expected behavior diverge.",
    },
    {
      failure: "Regression omission",
      correction:
        "Verify the original case and at least one meaningful neighboring case after the repair.",
    },
    {
      failure: "Production certainty",
      correction:
        "Separate interview evidence from load, dependency, rollout, and monitoring behavior that was not tested.",
    },
  ],

  seniority: [
    {
      level: "SDE I / entry level",
      emphasis:
        "Systematic reproduction, code-level reasoning, focused hypotheses, and basic regression checks carry the most weight.",
      strongSignals: [
        "States expected and observed behavior clearly.",
        "Uses a failing example to narrow the problem.",
        "Tests hypotheses rather than editing randomly.",
        "Verifies the repair.",
      ],
      avoid: [
        "Guessing repeatedly without using available evidence.",
        "Assuming a fix is correct because the error message changed.",
      ],
    },
    {
      level: "SDE II / mid level",
      emphasis:
        "The same systematic process remains, with stronger cross-component reasoning, test design, interface awareness, and operational consequences.",
      strongSignals: [
        "Localizes failures across meaningful boundaries.",
        "Chooses high-value discriminating experiments.",
        "Designs regression coverage around the cause.",
        "Explains compatibility and operational risk.",
      ],
      avoid: [
        "Stopping at the first code-level symptom.",
        "Ignoring adjacent components or failure paths supported by the evidence.",
      ],
    },
    {
      level: "Senior+",
      emphasis:
        "Senior debugging adds failure-domain judgment, observability, dependencies, concurrency, rollback, and systemic risk when the prompt actually exposes them.",
      strongSignals: [
        "Distinguishes local defects from broader failure propagation.",
        "Uses observability and controlled experiments proportionately.",
        "Considers blast radius, rollback, and monitoring.",
        "Avoids inventing distributed complexity when a local cause explains the evidence.",
      ],
      avoid: [
        "Turning every defect into an incident-management lecture.",
        "Discussing systemic risk instead of proving the local diagnosis.",
        "Assuming seniority removes the need to reproduce and verify.",
      ],
    },
  ],

  environment: {
    remote: [
      "Confirm access to the executable environment, logs, tests, output, and the backup contact path.",
      "Keep the failing case, current hypothesis, and relevant output visible when explaining diagnostic progress.",
      "State immediately when platform, dependency, network, or execution failure is distinct from the target bug.",
    ],
    onsite: [
      "Keep expected behavior, observed behavior, and the current hypothesis visible on the shared surface.",
      "Use board or paper space to track evidence and eliminated causes when no executable environment exists.",
      "Ask before clearing output or erasing a hypothesis that the interviewer may still be following.",
    ],
    accessibility: [
      "Request formal accommodations through the recruiter or designated company contact before the interview when possible.",
      "Ask for logs, error text, code, or diagrams to be enlarged, repeated, written, or divided into smaller sections when useful.",
      "A deliberate diagnostic pace or explicit written hypothesis is not evidence of weaker engineering ability.",
      "The Playbook does not infer capability from typing speed, speaking speed, eye contact, accent, or a particular communication style.",
    ],
  },

  companyModifierRules: [
    "Official recruiter and company-provided instructions override this general guide.",
    "Candidate reports may describe historical debugging formats but must not be presented as current company policy.",
    "Use the verified Company Guide for known tools, incident scenarios, repository formats, or level-specific modifiers.",
    "Do not infer that every debugging round provides executable code, logs, tests, production context, or the same hint policy.",
  ],

  interactions: [
    {
      id: "expected-observed",
      title: "Clarifying expected versus observed behavior",
      scenario:
        "A test returns an empty result when one record is expected.",
      weak:
        "The candidate immediately assumes the query is wrong and rewrites it.",
      strong:
        "The candidate says: “The expected result is one record, while the observed result is empty. I’ll first confirm the fixture and trace where the record is filtered out.”",
      annotation:
        "The stronger version separates the symptom from the suspected cause and chooses a boundary to inspect.",
      classification: "illustrative",
    },
    {
      id: "hypothesis",
      title: "A falsifiable hypothesis",
      scenario:
        "The failure appears after a cached value is read.",
      weak:
        "The candidate says the cache is probably broken and clears it.",
      strong:
        "The candidate says: “A stale cache is one possibility. I’ll compare the cached and source values; if they match, that hypothesis is eliminated.”",
      annotation:
        "A useful hypothesis predicts an observable result before the check is run.",
      classification: "illustrative",
    },
    {
      id: "falsification",
      title: "Responding to a disproven hypothesis",
      scenario:
        "The failure persists after the candidate bypasses the suspected cache.",
      weak:
        "The candidate continues discussing cache invalidation because it was the original theory.",
      strong:
        "The candidate says: “That result disproves the cache hypothesis. The divergence occurs later, so I’ll inspect the transformation boundary next.”",
      annotation:
        "Falsification narrows the search space and should update the working model.",
      classification: "illustrative",
    },
    {
      id: "symptom-cause",
      title: "Symptom disappearance versus explained cause",
      scenario:
        "Adding a delay makes an intermittent test pass.",
      weak:
        "The candidate concludes that the delay fixed the bug.",
      strong:
        "The candidate says: “The delay changes timing, but it does not explain the race. I’ll identify the unsynchronized state transition before proposing a repair.”",
      annotation:
        "A changed symptom is not equivalent to a verified root cause.",
      classification: "illustrative",
    },
    {
      id: "risk-close",
      title: "Production-risk close",
      scenario:
        "The local failure is fixed, but dependency and load behavior were not exercised.",
      weak:
        "The candidate says the issue is fully resolved.",
      strong:
        "The candidate says: “The original case and neighboring tests now pass. I have not validated dependency latency or load behavior, so I would monitor this path and use a bounded rollout.”",
      annotation:
        "The stronger close separates verified repair evidence from broader operational uncertainty.",
      classification: "illustrative",
    },
  ],

  integrity: [
    "This dossier describes general debugging execution behavior, not a pass/fail rubric.",
    "It does not teach exploitation, reproduce proprietary incidents, or claim access to hidden production systems.",
    "It does not authorize external assistance during a live interview.",
    "Language, tooling, observability, and testing instruction remain in their owning learning and practice resources.",
  ],
};

export const ROUND_EXECUTION_DOSSIERS: readonly RoundExecutionDossier[] = [algorithmicCodingDossier, practicalCodingDossier, debuggingDossier];

export const ROUND_EXECUTION_DOSSIER_BY_SLUG: ReadonlyMap<RoundExecutionGuideSlug, RoundExecutionDossier> = new Map(
  ROUND_EXECUTION_DOSSIERS.map((dossier) => [dossier.slug, dossier]),
);

export const PUBLISHED_ROUND_EXECUTION_DOSSIERS: readonly RoundExecutionDossier[] = ROUND_EXECUTION_DOSSIERS.filter(
  (dossier) => dossier.status === "published",
);

export function getRoundExecutionDossier(slug: string): RoundExecutionDossier | null {
  return ROUND_EXECUTION_DOSSIER_BY_SLUG.get(slug as RoundExecutionGuideSlug) ?? null;
}
