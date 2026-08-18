/**
 * Algorithmic Coding round-execution dossier.
 *
 * Content only — see `./schema.ts` for the shared type contract and
 * `./index.ts` for the registry that assembles every authored dossier.
 */
import type { RoundExecutionDossier } from "./schema.ts";

export const algorithmicCodingDossier: RoundExecutionDossier = {
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
