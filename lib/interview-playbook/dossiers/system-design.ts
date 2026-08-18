/**
 * System Design round-execution dossier.
 *
 * Content only — see `./schema.ts` for the shared type contract and
 * `./index.ts` for the registry that assembles every authored dossier.
 */
import type { RoundExecutionDossier } from "./schema.ts";

export const systemDesignDossier: RoundExecutionDossier = {
  slug: "system-design",
  status: "published",
  lastReviewed: "2026-08-18",
  title:
    "System Design: establish the core flow, then deepen deliberately.",
  purpose:
    "Clarify the product objective, users, requirements, scale, and constraints; establish a minimal end-to-end design; trace the important request and data flows; deepen selected bottlenecks, failure modes, and trade-offs; and close with a coherent design boundary rather than a list of technologies.",

  intendedEvaluation: [
    "Clarify the product objective, primary users, core use cases, and expected design scope.",
    "Distinguish important functional requirements from non-functional constraints and make assumptions explicit.",
    "Establish a coherent minimal end-to-end architecture before optimizing isolated components.",
    "Define important interfaces, data boundaries, ownership, and request or event flows.",
    "Identify material bottlenecks, failure modes, reliability concerns, and scaling pressures.",
    "Deepen selected areas and explain trade-offs while responding constructively to interviewer redirection.",
    "Communicate and validate a level-appropriate design whose boundaries, risks, and unresolved questions are clear.",
  ],

  companyVariation: [
    "Whether the prompt begins as a broad product problem, a specific subsystem, an existing architecture, or an operational scenario.",
    "Whether scale estimates are supplied, expected from the candidate, or intentionally left qualitative.",
    "How much depth is expected in APIs, data models, storage, asynchronous processing, reliability, or operations.",
    "Whether the interviewer emphasizes product reasoning, distributed-systems depth, implementation detail, or organizational trade-offs.",
    "How actively the interviewer redirects the candidate or chooses the area for deeper discussion.",
    "Whether the round is forty-five or sixty minutes and whether the expected artifact is a whiteboard, shared document, diagramming tool, or verbal design.",
  ],

  beforeRound: [
    "Confirm the expected duration, design surface, drawing tools, and any recruiter-provided preparation guidance.",
    "Practice taking one bounded design from product objective through a minimal architecture, primary flow, focused deep dive, and validation.",
    "Refresh only the architecture concepts needed to explain decisions; do not replace live design reasoning with a technology inventory.",
    "Use a System Design practice problem or mock that includes interviewer redirection, failure analysis, and a final validation pass.",
  ],

  flow: [
    {
      id: "clarify-objective",
      title: "Clarify the product objective",
      objective:
        "Establish who the system serves, what outcome matters, and which user behavior should drive the design.",
      actions: [
        "Restate the prompt in product and user terms before discussing infrastructure.",
        "Identify the primary actors, central use case, and the result the system must produce.",
        "Ask what the interviewer wants emphasized when several interpretations or subsystems are possible.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "scope-requirements",
      title: "Scope requirements and assumptions",
      objective:
        "Define the functional boundary and the non-functional pressures that materially affect the design.",
      actions: [
        "Choose the core functional requirements and state what is intentionally out of scope.",
        "Clarify latency, availability, consistency, durability, privacy, geography, and cost expectations only where relevant.",
        "Estimate traffic, data, or growth when the estimate can change a capacity, partitioning, storage, or reliability decision.",
        "Label assumptions so they can be revised when the interviewer supplies new information.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "establish-baseline",
      title: "Establish a minimal end-to-end design",
      objective:
        "Create the simplest coherent architecture that can support the primary use case.",
      actions: [
        "Define the major clients, service boundaries, data stores, and external dependencies needed for the core flow.",
        "Introduce an interface or API boundary sufficient to explain how the use case enters the system.",
        "Prefer a complete baseline over premature scaling layers, optimizations, or optional subsystems.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "trace-flows",
      title: "Trace the important flows",
      objective:
        "Demonstrate how requests, events, and data move through the proposed architecture.",
      actions: [
        "Walk the primary write or mutation path from entry to durable outcome.",
        "Walk the primary read, retrieval, delivery, or processing path where it differs.",
        "Explain asynchronous boundaries, retries, state transitions, and ownership where they affect correctness.",
        "Keep the diagram synchronized with the verbal flow instead of adding disconnected components.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "deepen-critical-paths",
      title: "Deepen the critical paths",
      objective:
        "Investigate the areas where scale, reliability, or correctness creates the greatest design pressure.",
      actions: [
        "Identify the likely bottleneck, hotspot, contention point, or failure domain from the stated requirements.",
        "Choose one or two high-value areas for depth rather than surveying every infrastructure topic.",
        "Discuss partitioning, replication, caching, queues, indexes, concurrency, or consistency only when they address an observed pressure.",
        "Explain how the design behaves during dependency failure, overload, partial completion, or recovery.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "handle-tradeoffs-followups",
      title: "Handle trade-offs and follow-ups",
      objective:
        "Evolve the design under interviewer direction while making decision costs explicit.",
      actions: [
        "Treat a new requirement or interviewer redirection as evidence rather than an interruption.",
        "Compare viable alternatives using the relevant dimensions, such as latency, availability, consistency, durability, complexity, cost, and operability.",
        "Change the smallest responsible part of the design and update affected flows or assumptions.",
        "State what the design gains, what it gives up, and which requirement drives the decision.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "validate-close",
      title: "Validate and close",
      objective:
        "Confirm that the design supports the requested behavior and leave a clear account of its risks and boundaries.",
      actions: [
        "Replay the primary user flow through the final architecture.",
        "Check the most important capacity pressure, bottleneck, and failure behavior.",
        "Summarize the major trade-offs and the assumptions that most shaped the design.",
        "State which concerns were intentionally deferred and what the next deeper investigation would address.",
      ],
      classification: "widely-applicable",
    },
  ],

  timeFrameworks: [
    {
      label: "Typical 45-minute System Design round",
      assumption:
        "This is an adaptable range for a focused design discussion after introductions. Prompt breadth and interviewer direction may materially change the allocation.",
      phases: [
        {
          label: "Clarify objective and scope",
          range: "About 5–8 minutes",
          objective:
            "Agree on the product outcome, primary use case, important requirements, and design boundary.",
          adjustment:
            "Compress this when the prompt supplies explicit requirements; expand only when ambiguity would materially change the architecture.",
        },
        {
          label: "Establish the baseline and flows",
          range: "About 10–14 minutes",
          objective:
            "Create a coherent minimum architecture and trace the core request or data paths.",
          adjustment:
            "Avoid adding scaling components before the primary flow is complete.",
        },
        {
          label: "Deepen critical areas",
          range: "About 15–20 minutes",
          objective:
            "Investigate the most important bottlenecks, failure modes, and trade-offs.",
          adjustment:
            "Follow interviewer interest and requirement pressure instead of covering every common System Design topic.",
        },
        {
          label: "Validate and close",
          range: "Use the remaining 7–11 minutes",
          objective:
            "Replay the design, test key assumptions, and summarize risks and trade-offs.",
          adjustment:
            "Protect a validation window even when a deep dive takes longer than expected.",
        },
      ],
      classification: "context-dependent",
    },
    {
      label: "Typical 60-minute System Design round",
      assumption:
        "This range assumes a broader prompt or additional depth in interfaces, data, reliability, or operations. It is not a universal timing script.",
      phases: [
        {
          label: "Clarify objective and scope",
          range: "About 6–10 minutes",
          objective:
            "Establish users, use cases, constraints, scale assumptions, and expected emphasis.",
          adjustment:
            "Use one design-driving scenario rather than collecting an exhaustive product specification.",
        },
        {
          label: "Establish the baseline and flows",
          range: "About 12–18 minutes",
          objective:
            "Build the minimum end-to-end architecture and explain its interfaces and flows.",
          adjustment:
            "Keep optional features out until the central system works coherently.",
        },
        {
          label: "Deepen critical areas",
          range: "About 22–30 minutes",
          objective:
            "Explore scaling, correctness, reliability, and operational trade-offs where the design is most pressured.",
          adjustment:
            "Spend depth on a few consequential decisions rather than naming every available technology.",
        },
        {
          label: "Validate and close",
          range: "Use the remaining 10–15 minutes",
          objective:
            "Replay the final design, examine failure behavior, and summarize its decision boundary.",
          adjustment:
            "Keep enough time to reconcile the diagram after the final follow-up.",
        },
      ],
      classification: "context-dependent",
    },
  ],

  communication: [
    {
      title: "Connect components to requirements",
      productive:
        "Introduce each major component because it supports a use case, constraint, failure boundary, or identified design pressure.",
      avoid:
        "Listing familiar technologies and asking the interviewer to infer why they belong.",
    },
    {
      title: "Narrate flows, not every drawing action",
      productive:
        "Explain how a request, event, or piece of data moves and where ownership changes.",
      avoid:
        "Narrating every box, arrow, or label without connecting them into system behavior.",
    },
    {
      title: "Separate assumptions from decisions",
      productive:
        "State what the prompt confirms, what you are assuming, and which decision depends on that assumption.",
      avoid:
        "Presenting an unstated traffic, consistency, or durability assumption as a universal fact.",
    },
    {
      title: "Use depth instead of breadth theater",
      productive:
        "Choose consequential areas for deeper reasoning and explain why they deserve attention.",
      avoid:
        "Mentioning every architecture topic briefly without completing any trade-off analysis.",
    },
  ],

  recovery: [
    {
      situation: "The prompt feels too broad.",
      response:
        "Return to the primary user outcome, select one design-driving use case, and state which adjacent capabilities are deferred.",
      avoid:
        "Trying to design the entire product surface before establishing one coherent flow.",
    },
    {
      situation: "You lack domain knowledge.",
      response:
        "Ask focused behavioral questions, label assumptions, and reason from the required inputs, outputs, and constraints.",
      avoid:
        "Inventing domain rules or compensating with generic infrastructure terminology.",
    },
    {
      situation: "The interviewer redirects the discussion.",
      response:
        "Acknowledge the new focus, connect it to the current design, and move depth toward the requested boundary.",
      avoid:
        "Defending the original agenda or continuing a prepared monologue.",
    },
    {
      situation: "A key assumption proves wrong.",
      response:
        "State which decision depended on it, revise the smallest affected boundary, and replay the impacted flow.",
      avoid:
        "Leaving the original architecture unchanged while verbally accepting contradictory requirements.",
    },
    {
      situation: "Time is running short.",
      response:
        "Complete the primary flow, identify the largest unresolved risk, and summarize the next concrete deep dive.",
      avoid:
        "Adding optional components or starting another broad subsystem that cannot be validated.",
    },
  ],

  validation: [
    "Replay the primary user flow through every major boundary in the final design.",
    "Confirm that the chosen storage and state ownership support the required reads, writes, updates, and failure behavior.",
    "Revisit the scale or load assumption that most influenced the architecture.",
    "Identify the most important bottleneck, failure domain, and recovery behavior.",
    "Check that availability, consistency, durability, latency, cost, and complexity trade-offs match the stated requirements.",
    "State which integrations, operational concerns, or alternative flows remain intentionally out of scope.",
  ],

  closing: [
    "Summarize the product objective and the final end-to-end flow.",
    "Name the two or three decisions that most shaped the architecture.",
    "State the largest remaining risk or unresolved assumption.",
    "Identify the next area that would receive deeper implementation or operational analysis.",
  ],

  questionsToAsk: [
    "How does the team balance product requirements, operational simplicity, and long-term scale during design reviews?",
    "Which design decisions most often distinguish strong mid-level and senior candidates in this interview?",
    "How collaborative is the round, and how does the interviewer typically choose areas for deeper discussion?",
  ],

  signals: {
    strong: [
      "Begins with product objective, users, requirements, and scope rather than technology selection.",
      "Creates a coherent minimum design before adding scale or reliability mechanisms.",
      "Traces important request and data flows across clear ownership boundaries.",
      "Chooses depth based on observed bottlenecks, failure modes, and constraints.",
      "Explains trade-offs and adapts constructively to interviewer direction.",
      "Validates the final architecture and communicates its assumptions and limits honestly.",
    ],
    concern: [
      "Starts with a technology stack before establishing the system’s required behavior.",
      "Collects requirements indefinitely without choosing a design-driving scope.",
      "Draws disconnected boxes without tracing executable request or data flows.",
      "Adds caching, queues, replication, or partitioning without a demonstrated pressure.",
      "Covers many topics superficially while avoiding consequential trade-offs.",
      "Ends without replaying the design, identifying failure behavior, or stating unresolved risks.",
    ],
  },

  failureModes: [
    {
      failure: "Technology shopping list",
      correction:
        "Introduce architecture elements only when they serve a requirement, flow, or identified design pressure.",
    },
    {
      failure: "Requirements spiral",
      correction:
        "Select the core use case and material constraints, then declare the remaining product surface out of scope.",
    },
    {
      failure: "Premature scale",
      correction:
        "Establish a correct minimum design first and add scale mechanisms only where estimates or bottlenecks justify them.",
    },
    {
      failure: "Static boxes without flows",
      correction:
        "Trace writes, reads, events, state changes, and failure paths across the diagram.",
    },
    {
      failure: "Breadth without depth",
      correction:
        "Choose the most consequential bottleneck or trade-off and investigate it thoroughly.",
    },
    {
      failure: "Unbounded redesign",
      correction:
        "Respond to follow-ups by revising the smallest affected boundary and replaying impacted flows.",
    },
    {
      failure: "No validation pass",
      correction:
        "Replay the primary flow, test a meaningful failure, and summarize assumptions and risks before closing.",
    },
  ],

  seniority: [
    {
      level: "SDE I / entry level",
      emphasis:
        "A coherent basic architecture, understandable data flow, reasonable component responsibilities, and recognition of common bottlenecks carry the most weight.",
      strongSignals: [
        "Clarifies the main use case and important constraints.",
        "Builds a complete baseline before optimizing.",
        "Explains how requests and data move through the system.",
        "Identifies at least one meaningful failure or scaling concern.",
      ],
      avoid: [
        "Using technology names as substitutes for design reasoning.",
        "Expanding scope beyond what can be explained and validated.",
      ],
    },
    {
      level: "SDE II / mid level",
      emphasis:
        "Autonomous scoping, interface and data judgment, scaling depth, reliability reasoning, and explicit trade-offs become more visible.",
      strongSignals: [
        "Connects requirements to service, data, and asynchronous boundaries.",
        "Identifies meaningful bottlenecks and chooses proportionate mitigations.",
        "Reasons about consistency, failure handling, and operability.",
        "Adapts the design cleanly under follow-up requirements.",
      ],
      avoid: [
        "Applying generic scale mechanisms without requirement pressure.",
        "Discussing reliability or consistency without tracing concrete system behavior.",
      ],
    },
    {
      level: "Senior+",
      emphasis:
        "Senior execution adds product framing, boundary and evolution judgment, failure-domain reasoning, operational consequences, cost awareness, and deliberate control of complexity.",
      strongSignals: [
        "Identifies which decisions are difficult to reverse and which can remain simple.",
        "Balances product needs, correctness, reliability, cost, and operational load.",
        "Recognizes cross-team, migration, rollout, and ownership consequences where relevant.",
        "Keeps the architecture coherent while exploring deep alternatives.",
      ],
      avoid: [
        "Turning a bounded interview into an enterprise architecture presentation.",
        "Discussing organization-wide strategy instead of completing the requested system design.",
        "Assuming seniority removes the need for clear flows and validation.",
      ],
    },
  ],

  environment: {
    remote: [
      "Confirm the diagramming tool, editor, screen-sharing behavior, and backup contact path before the round.",
      "Keep requirements and the relevant architecture region visible while explaining flows or changing the design.",
      "State immediately when tool or connection problems prevent showing the expected artifact.",
    ],
    onsite: [
      "Confirm whether the interviewer expects a whiteboard, shared document, diagram, or verbal design.",
      "Keep the board legible by grouping responsibilities and updating obsolete arrows or assumptions.",
      "Ask before erasing material the interviewer may still be referencing.",
    ],
    accessibility: [
      "Request formal accommodations through the recruiter or designated company contact before the interview when possible.",
      "Ask for prompts, requirements, numbers, or follow-ups to be enlarged, repeated, written, or divided into smaller parts when useful.",
      "A deliberate drawing, typing, estimation, or explanation pace is not evidence of weaker design ability.",
      "The Playbook does not infer capability from handwriting, drawing speed, eye contact, accent, or a particular diagramming style.",
    ],
  },

  companyModifierRules: [
    "Official recruiter and company-provided instructions override this general guide.",
    "Candidate reports may describe historical prompts or emphasis areas but must not be presented as current company policy.",
    "Use the verified Company Guide for supported format, level, domain, duration, or depth modifiers.",
    "Do not infer a universal estimation requirement, technology preference, diagram notation, timing allocation, or scoring rubric.",
  ],

  interactions: [
    {
      id: "clarification",
      title: "Useful clarification versus product discovery",
      scenario:
        "The prompt asks for a service that distributes updates to a large audience.",
      weak:
        "The candidate spends many minutes collecting every possible content type, user role, moderation feature, and administrative workflow.",
      strong:
        "The candidate confirms the primary publisher and reader flow, expected delivery freshness, and scale, then defers administration and optional content modes.",
      annotation:
        "Clarification should produce a design-driving boundary rather than an exhaustive product specification.",
      classification: "illustrative",
    },
    {
      id: "estimation",
      title: "Decision-driving estimation versus performative arithmetic",
      scenario:
        "The interviewer provides a large active-user count but no explicit throughput.",
      weak:
        "The candidate calculates several precise storage and bandwidth figures without connecting them to a design decision.",
      strong:
        "The candidate estimates peak writes and reads only far enough to determine whether a single data partition and synchronous delivery path are plausible.",
      annotation:
        "An estimate is valuable when it changes capacity, partitioning, storage, or reliability reasoning.",
      classification: "illustrative",
    },
    {
      id: "redirection",
      title: "Responding to interviewer redirection",
      scenario:
        "The candidate is discussing read scaling when the interviewer asks to focus on write durability and duplicate processing.",
      weak:
        "The candidate finishes the prepared caching discussion before addressing the requested write path.",
      strong:
        "The candidate acknowledges the shift, returns to the write flow, and examines durable acceptance, idempotency, retries, and recovery.",
      annotation:
        "Redirection identifies where evidence is needed; following it is part of collaborative design execution.",
      classification: "illustrative",
    },
    {
      id: "tradeoff",
      title: "Handling a design disagreement",
      scenario:
        "The interviewer questions whether an asynchronous boundary is worth its operational complexity.",
      weak:
        "The candidate defends the queue because scalable systems normally use one.",
      strong:
        "The candidate connects the boundary to latency isolation and retry requirements, then removes it when those pressures are not present in the agreed scope.",
      annotation:
        "The component should remain only when its benefit addresses an actual requirement or failure boundary.",
      classification: "illustrative",
    },
    {
      id: "short-on-time",
      title: "Closing a partial design",
      scenario:
        "The primary flow is coherent, but only a few minutes remain before reliability and secondary features are fully explored.",
      weak:
        "The candidate rapidly adds replicas, caches, queues, monitoring, analytics, and regional deployment boxes.",
      strong:
        "The candidate replays the primary flow, identifies the largest unaddressed failure domain, states the relevant trade-off, and names the next deep-dive step.",
      annotation:
        "A validated bounded architecture is stronger evidence than a final burst of disconnected infrastructure.",
      classification: "illustrative",
    },
  ],

  integrity: [
    "This dossier describes general System Design interview execution, not a company scoring rubric.",
    "It does not reproduce proprietary prompts, complete company solutions, or hidden evaluation standards.",
    "It does not authorize external assistance during a live interview.",
    "Architecture concepts, technology instruction, and complete design exercises remain in the dedicated System Design learning and practice section.",
  ],
};
