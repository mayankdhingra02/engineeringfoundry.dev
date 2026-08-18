/**
 * Low-Level Design round-execution dossier.
 *
 * Content only — see `./schema.ts` for the shared type contract and
 * `./index.ts` for the registry that assembles every authored dossier.
 */
import type { RoundExecutionDossier } from "./schema.ts";

export const lowLevelDesignDossier: RoundExecutionDossier = {
  slug: "low-level-design",
  status: "published",
  lastReviewed: "2026-08-18",
  title:
    "Low-Level Design: turn use cases into responsibilities and validated flows.",
  purpose:
    "Clarify the requested use cases, establish cohesive responsibilities and relationships, define interfaces and state, evolve a minimal design under follow-ups, and validate it through representative flows without turning the interview into a pattern catalog.",

  intendedEvaluation: [
    "Clarify the central use cases, constraints, and expected design artifact before introducing classes or interfaces.",
    "Identify the important domain concepts without modeling every noun as an object.",
    "Assign cohesive responsibilities and make ownership boundaries understandable.",
    "Define relationships, interfaces, state, and invariants that support the requested behavior.",
    "Walk representative flows through the design and reason about failure behavior.",
    "Adapt the design when requirements change while explaining the trade-offs introduced.",
    "Communicate a level-appropriate design that is minimal, testable, and internally consistent.",
  ],

  companyVariation: [
    "Whether the expected artifact is a class diagram, interfaces, pseudocode, compilable code, or a combination.",
    "Whether the interviewer emphasizes object modeling, API design, extensibility, state management, testing, or implementation.",
    "How much domain and product context is supplied before the candidate begins.",
    "Whether concurrency, persistence, networking, or distributed-system concerns are in scope.",
    "Whether the candidate starts from a blank surface or an existing partial design.",
    "How aggressively the interviewer introduces follow-up requirements or asks for implementation detail.",
  ],

  beforeRound: [
    "Confirm the expected artifact, language constraints, available tools, and whether implementation is required.",
    "Practice moving from one concrete use case to responsibilities, interfaces, and a representative flow.",
    "Refresh only the object-oriented and design concepts needed to explain choices; do not memorize a pattern list as the interview plan.",
    "Use a Low-Level Design exercise or mock that includes changing requirements and validation rather than drawing static class diagrams only.",
  ],

  flow: [
    {
      id: "clarify",
      title: "Clarify use cases and scope",
      objective:
        "Establish the behavior the design must support and the artifact the interviewer expects.",
      actions: [
        "Restate the core use cases and ask which one should drive the initial design.",
        "Clarify important constraints, actors, boundaries, and out-of-scope behavior.",
        "Confirm whether the expected result is a diagram, interfaces, pseudocode, code, or a mixed artifact.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "model-domain",
      title: "Identify the essential domain model",
      objective:
        "Create a minimal vocabulary for the problem without turning every noun into a class.",
      actions: [
        "Identify the concepts that hold behavior, identity, or meaningful state.",
        "Separate core domain concepts from input formats, infrastructure details, and incidental implementation objects.",
        "Use the primary use case to test whether each proposed concept is necessary.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "assign-responsibilities",
      title: "Assign responsibilities and ownership",
      objective:
        "Give each component a cohesive reason to exist and make lifecycle ownership explicit.",
      actions: [
        "State which component owns each important decision, state transition, and side effect.",
        "Keep responsibilities cohesive and avoid one object coordinating every concern.",
        "Explain where objects are created, who holds them, and who is allowed to change their state.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "define-relationships",
      title: "Define relationships and boundaries",
      objective:
        "Connect the model through relationships that support the use cases without unnecessary coupling.",
      actions: [
        "Choose composition, references, or inheritance only when the relationship and substitution behavior justify it.",
        "State cardinality, ownership, and lifecycle implications for important relationships.",
        "Keep external systems and replaceable policies behind understandable boundaries where relevant.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "design-interfaces-state",
      title: "Design interfaces, state, and invariants",
      objective:
        "Make behavior callable, state changes controlled, and invalid conditions difficult to create.",
      actions: [
        "Define the operations needed by the primary use case before expanding the public interface.",
        "Identify meaningful state, allowed transitions, and invariants that must always hold.",
        "Discuss error behavior, validation responsibility, and important return contracts.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "walk-flow-evolve",
      title: "Walk the flow and evolve the design",
      objective:
        "Demonstrate that the design works as a connected system and can respond to a meaningful follow-up.",
      actions: [
        "Trace one representative use case through the objects, calls, state changes, and outputs.",
        "Apply the interviewer’s follow-up by identifying the smallest responsible design change.",
        "Explain the new trade-off rather than claiming the original design anticipated every requirement.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "validate-close",
      title: "Validate and close",
      objective:
        "Confirm behavioral coverage, internal consistency, and honest design boundaries.",
      actions: [
        "Replay the primary use case and one important failure or boundary case.",
        "Check responsibility ownership, relationship consistency, interface sufficiency, and state invariants.",
        "Summarize the main trade-offs and the requirement that most shaped the design.",
        "State which implementation or operational concerns remain outside the current scope.",
      ],
      classification: "widely-applicable",
    },
  ],

  timeFrameworks: [
    {
      label: "Typical 45-minute Low-Level Design round",
      assumption:
        "This is an adaptable range for a bounded object-design problem. Interviewer redirection, implementation requirements, and domain complexity may change the allocation.",
      phases: [
        {
          label: "Clarify use cases and artifact",
          range: "About 5–8 minutes",
          objective:
            "Establish the primary behavior, constraints, and expected output.",
          adjustment:
            "Compress this when the interviewer supplies a precise use case and artifact.",
        },
        {
          label: "Model responsibilities and relationships",
          range: "About 10–14 minutes",
          objective:
            "Identify essential concepts, ownership, and collaboration boundaries.",
          adjustment:
            "Avoid spending the entire phase naming classes before responsibilities are clear.",
        },
        {
          label: "Define interfaces and walk flows",
          range: "About 14–18 minutes",
          objective:
            "Make behavior, state changes, and representative execution concrete.",
          adjustment:
            "Move into code only when requested or when it clarifies a disputed interface.",
        },
        {
          label: "Evolve, validate, and close",
          range: "Use the remaining 8–12 minutes",
          objective:
            "Respond to a follow-up, test the model, and summarize trade-offs.",
          adjustment:
            "When time is short, validate the primary flow and invariants before adding optional abstractions.",
        },
      ],
      classification: "context-dependent",
    },
    {
      label: "Typical 60-minute Low-Level Design round",
      assumption:
        "This range assumes additional implementation depth, multiple use cases, or follow-up evolution. It is not a universal timing script.",
      phases: [
        {
          label: "Clarify use cases and artifact",
          range: "About 6–10 minutes",
          objective:
            "Agree on scope, priorities, constraints, and expected design detail.",
          adjustment:
            "Use a representative example to resolve ambiguity instead of collecting every possible requirement.",
        },
        {
          label: "Model responsibilities and relationships",
          range: "About 14–20 minutes",
          objective:
            "Build a coherent domain model with explicit ownership and boundaries.",
          adjustment:
            "Prefer a small defensible model over a broad class inventory.",
        },
        {
          label: "Define interfaces, state, and flows",
          range: "About 18–25 minutes",
          objective:
            "Demonstrate behavior through operations, state transitions, and implementation detail where requested.",
          adjustment:
            "Spend depth on the design decisions the interviewer explores rather than documenting every accessor.",
        },
        {
          label: "Evolve, validate, and close",
          range: "Use the remaining 10–15 minutes",
          objective:
            "Handle follow-ups, evaluate failure behavior, and summarize trade-offs.",
          adjustment:
            "Keep enough time to replay the design after the final requirement change.",
        },
      ],
      classification: "context-dependent",
    },
  ],

  communication: [
    {
      title: "Explain responsibilities before names",
      productive:
        "Describe the behavior and ownership a component needs before committing to a class or interface name.",
      avoid:
        "Listing classes immediately and asking the interviewer to infer why each one exists.",
    },
    {
      title: "Justify choices with use cases",
      productive:
        "Connect interfaces and relationships to a concrete flow, invariant, or follow-up requirement.",
      avoid:
        "Citing a design principle or pattern name as sufficient justification.",
    },
    {
      title: "Make state and ownership explicit",
      productive:
        "State who owns mutable state, which operations may change it, and which invariants protect it.",
      avoid:
        "Passing state between objects without explaining lifecycle or mutation responsibility.",
    },
    {
      title: "Adapt without defending the first design",
      productive:
        "Treat new requirements as evidence and explain the smallest responsible change.",
      avoid:
        "Arguing that the initial design should remain unchanged because it was presented confidently.",
    },
  ],

  recovery: [
    {
      situation: "You realize the initial abstraction does not support the main use case.",
      response:
        "State the mismatch, return to the required behavior, and revise the responsibility or boundary that caused it.",
      avoid:
        "Adding adapters and helper classes around a model whose central responsibility is still wrong.",
    },
    {
      situation: "You have created too many classes or interfaces.",
      response:
        "Group them by responsibility, remove pass-through abstractions, and keep only boundaries that support behavior or variation.",
      avoid:
        "Continuing to expand the diagram because deleting an earlier idea feels like failure.",
    },
    {
      situation: "The interviewer asks for code earlier than expected.",
      response:
        "Confirm which use case or interface should be implemented, state any remaining assumption, and write the smallest coherent slice.",
      avoid:
        "Ignoring the request while completing a large diagram first.",
    },
    {
      situation: "You do not know the domain well.",
      response:
        "Use the supplied behavior, ask focused domain questions, and label assumptions rather than inventing specialized rules.",
      avoid:
        "Masking missing knowledge with generic class names or confident domain claims.",
    },
    {
      situation: "Time is running short.",
      response:
        "Complete the primary flow, state the important invariant and failure behavior, and summarize what the next design step would address.",
      avoid:
        "Adding one more pattern or optional extension while the central flow remains unvalidated.",
    },
  ],

  validation: [
    "Walk the primary use case through the objects, interfaces, state changes, and output.",
    "Check that every important responsibility has one understandable owner.",
    "Verify relationship cardinality, lifecycle ownership, and substitution assumptions where relevant.",
    "Test state transitions and invariants with a meaningful failure or boundary case.",
    "Apply at least one requirement change and confirm the design evolves without unrelated rewrites.",
    "Summarize which concerns were validated and which implementation or operational details remain out of scope.",
  ],

  closing: [
    "Replay the primary flow from entry point to result.",
    "Summarize the responsibility and relationship decisions that most shaped the design.",
    "Call out the main trade-off introduced by the follow-up requirement.",
    "State the design boundary and the next concern that would need deeper implementation work.",
  ],

  questionsToAsk: [
    "How does the team decide when an abstraction has earned its place in production code?",
    "Which design concerns most often distinguish strong mid-level and senior candidates in this round?",
    "Does the team usually expect diagrams, interfaces, implementation, or a combination in Low-Level Design interviews?",
  ],

  signals: {
    strong: [
      "Begins with concrete use cases and scope rather than a pattern or class list.",
      "Assigns cohesive responsibilities and makes lifecycle ownership understandable.",
      "Uses relationships and interfaces that are justified by behavior.",
      "Models state transitions and invariants explicitly.",
      "Walks representative flows and validates failure behavior.",
      "Adapts the design constructively when requirements change.",
    ],
    concern: [
      "Models every noun as a class without testing whether the object has meaningful responsibility.",
      "Uses design-pattern names as substitutes for behavioral reasoning.",
      "Creates one coordinator object that owns unrelated responsibilities.",
      "Leaves mutation, lifecycle, or state ownership ambiguous.",
      "Draws a static model without walking an executable use case.",
      "Adds extensibility for hypothetical requirements while the requested behavior remains incomplete.",
    ],
  },

  failureModes: [
    {
      failure: "Pattern-first design",
      correction:
        "Start from use cases, responsibilities, and variation points; introduce a pattern only when it solves an observed design pressure.",
    },
    {
      failure: "Class inventory without behavior",
      correction:
        "Walk the primary flow and remove or revise objects that do not own meaningful behavior or state.",
    },
    {
      failure: "God object",
      correction:
        "Separate unrelated decisions and side effects into cohesive owners with explicit collaboration.",
    },
    {
      failure: "Anemic responsibility model",
      correction:
        "Move behavior toward the component that owns the relevant state and invariant instead of centralizing all logic externally.",
    },
    {
      failure: "Premature extensibility",
      correction:
        "Design for the stated use cases and one evidence-supported variation rather than every imaginable future requirement.",
    },
    {
      failure: "Diagram-code disconnect",
      correction:
        "Trace the operations and state transitions to confirm the proposed interfaces could implement the diagram.",
    },
    {
      failure: "No validation pass",
      correction:
        "Replay a representative success path, a failure path, and the final follow-up before closing.",
    },
  ],

  seniority: [
    {
      level: "SDE I / entry level",
      emphasis:
        "Clear use cases, understandable classes or components, basic responsibility assignment, and a working representative flow.",
      strongSignals: [
        "Identifies the essential concepts without excessive abstraction.",
        "Defines understandable operations and relationships.",
        "Keeps state changes internally consistent.",
        "Walks the requested flow successfully.",
      ],
      avoid: [
        "Memorizing pattern names without understanding when they apply.",
        "Adding broad extensibility before the core behavior works.",
      ],
    },
    {
      level: "SDE II / mid level",
      emphasis:
        "Autonomous scoping, cohesive boundaries, interface judgment, state modeling, maintainability, and adaptation become more visible.",
      strongSignals: [
        "Balances cohesion and coupling across component boundaries.",
        "Explains lifecycle ownership and failure behavior.",
        "Uses interfaces proportionately at real variation points.",
        "Evolves the model without destabilizing unrelated responsibilities.",
      ],
      avoid: [
        "Treating every dependency as an interface regardless of likely change.",
        "Discussing maintainability without connecting it to concrete ownership or change cost.",
      ],
    },
    {
      level: "Senior+",
      emphasis:
        "Senior execution adds boundary judgment, lifecycle and concurrency awareness, evolution strategy, and explicit control of design complexity where the prompt exposes them.",
      strongSignals: [
        "Recognizes which boundaries carry the greatest change or correctness risk.",
        "Makes invariants, ownership, and consistency decisions explicit.",
        "Evaluates alternatives in terms of operational and organizational consequences.",
        "Keeps the design minimal while preserving the most important evolution path.",
      ],
      avoid: [
        "Turning a bounded object-design round into a complete distributed architecture.",
        "Using seniority to justify abstractions unsupported by the requested behavior.",
        "Skipping the concrete object flow in favor of broad architecture commentary.",
      ],
    },
  ],

  environment: {
    remote: [
      "Confirm the diagramming, editor, execution, and screen-sharing tools before the round.",
      "Keep the current use case and the relevant design region visible while explaining a change.",
      "State immediately when tool limitations prevent showing the expected artifact or running code.",
    ],
    onsite: [
      "Confirm whether the interviewer expects a whiteboard model, written interfaces, code, or a combination.",
      "Keep the design legible by grouping responsibilities and updating relationships when the model changes.",
      "Ask before erasing or replacing material the interviewer may still be referencing.",
    ],
    accessibility: [
      "Request formal accommodations through the recruiter or designated company contact before the interview when possible.",
      "Ask for requirements, diagrams, or follow-ups to be enlarged, written, repeated, or divided into smaller parts when useful.",
      "A deliberate drawing, typing, or explanation pace is not evidence of weaker design ability.",
      "The Playbook does not infer capability from handwriting, drawing speed, eye contact, accent, or a particular diagramming style.",
    ],
  },

  companyModifierRules: [
    "Official recruiter and company-provided instructions override this general guide.",
    "Candidate reports may describe historical artifacts or implementation expectations but must not be presented as current company policy.",
    "Use the verified Company Guide for known language, artifact, implementation-depth, or level-specific modifiers.",
    "Do not infer a universal diagram notation, pattern expectation, coding requirement, timing allocation, or scoring rubric.",
  ],

  interactions: [
    {
      id: "clarification",
      title: "Useful clarification versus requirement collection",
      scenario:
        "The prompt asks for a parking-management design with several possible actors and features.",
      weak:
        "The candidate spends ten minutes enumerating every vehicle, payment, reservation, and reporting feature before choosing a flow.",
      strong:
        "The candidate asks which actor and use case should drive the design, confirms entry and exit are primary, and labels reservations as out of scope until requested.",
      annotation:
        "Clarification should establish a design-driving flow, not produce an exhaustive product specification.",
      classification: "illustrative",
    },
    {
      id: "responsibility",
      title: "Pattern-first versus responsibility-first",
      scenario:
        "The design needs different pricing behavior for several customer categories.",
      weak:
        "The candidate announces a strategy pattern before explaining who requests a price or what may vary.",
      strong:
        "The candidate identifies pricing as a replaceable policy used by checkout, explains the variation, and then notes that a strategy-shaped interface fits that boundary.",
      annotation:
        "The pattern follows the observed responsibility and variation point rather than replacing that reasoning.",
      classification: "illustrative",
    },
    {
      id: "requirement-change",
      title: "Handling a changing requirement",
      scenario:
        "The interviewer adds partial cancellation after the initial booking design is presented.",
      weak:
        "The candidate says the feature requires rebuilding the booking classes from scratch.",
      strong:
        "The candidate identifies the existing state and ownership assumptions, adds the minimal cancellation transition and allocation behavior, and explains the new invariant.",
      annotation:
        "Strong evolution preserves valid responsibilities while changing the part of the design affected by new evidence.",
      classification: "illustrative",
    },
    {
      id: "disagreement",
      title: "Handling an abstraction disagreement",
      scenario:
        "The interviewer questions whether an interface is necessary for a dependency with one implementation.",
      weak:
        "The candidate insists that every dependency should have an interface because that is best practice.",
      strong:
        "The candidate explains the expected variation and testing boundary, then removes the interface when those pressures are not part of the current scope.",
      annotation:
        "The decision should depend on concrete design pressure rather than personal authority or slogans.",
      classification: "illustrative",
    },
    {
      id: "short-on-time",
      title: "Closing a partial design",
      scenario:
        "The primary flow works, but several optional extensions remain and time is nearly over.",
      weak:
        "The candidate rapidly adds placeholder classes for notifications, analytics, persistence, and auditing.",
      strong:
        "The candidate replays the completed flow, validates its main invariant and failure case, then names the highest-priority next boundary without pretending it is implemented.",
      annotation:
        "A validated bounded design is stronger evidence than an unconnected list of future components.",
      classification: "illustrative",
    },
  ],

  integrity: [
    "This dossier describes general Low-Level Design interview execution, not a company scoring rubric.",
    "It does not reproduce proprietary prompts, complete company solutions, or hidden evaluation standards.",
    "It does not authorize external assistance during a live interview.",
    "Object-oriented principles, design patterns, language details, and complete design exercises remain in the dedicated Low-Level Design learning and practice section.",
  ],
};
