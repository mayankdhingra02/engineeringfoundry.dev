/**
 * Practical Coding round-execution dossier.
 *
 * Content only — see `./schema.ts` for the shared type contract and
 * `./index.ts` for the registry that assembles every authored dossier.
 */
import type { RoundExecutionDossier } from "./schema.ts";

export const practicalCodingDossier: RoundExecutionDossier = {
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
