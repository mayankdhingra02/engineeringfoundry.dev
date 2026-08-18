/**
 * Debugging round-execution dossier.
 *
 * Content only — see `./schema.ts` for the shared type contract and
 * `./index.ts` for the registry that assembles every authored dossier.
 */
import type { RoundExecutionDossier } from "./schema.ts";

export const debuggingDossier: RoundExecutionDossier = {
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
