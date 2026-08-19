/**
 * Project Deep Dive round-execution dossier.
 *
 * Content only — see `./schema.ts` for the shared type contract and
 * `./index.ts` for the registry that assembles every authored dossier.
 */
import type { RoundExecutionDossier } from "./schema.ts";

export const projectDeepDiveDossier: RoundExecutionDossier = {
  slug: "project-deep-dive",
  status: "published",
  lastReviewed: "2026-08-18",
  title:
    "Project Deep Dive: make the system, your decisions, and the consequences understandable under follow-up.",
  purpose:
    "Orient the interviewer to a real project, explain the technical model at the depth needed for the conversation, distinguish personal ownership from team execution, examine consequential decisions and trade-offs, connect execution to outcomes and learning, and remain factual and coherent as follow-ups move across technical and organizational branches.",

  intendedEvaluation: [
    "Establish why the project mattered, its relevant constraints, the candidate's role, and the part of the work the interviewer wants to explore.",
    "Explain the technical system or approach deeply enough to support discussion without replacing the deep dive with a complete architecture lecture.",
    "Distinguish inherited context, team decisions, delegated work, personal implementation, personal decisions, and influence accurately.",
    "Explain consequential technical or organizational decisions, realistic alternatives, and the evidence or constraints behind the selected trade-offs.",
    "Describe execution, rollout, failure behavior, operational consequences, collaboration, and adaptation where those areas are relevant to the project.",
    "Support outcomes and impact with defensible evidence while acknowledging uncertainty, limitations, failed assumptions, and what changed afterward.",
    "Remain consistent under nonlinear technical and behavioral follow-ups while communicating at a level appropriate to both the interviewer and the candidate's actual scope.",
  ],

  companyVariation: [
    "Whether the interviewer selects a résumé item or allows the candidate to choose a project.",
    "Whether the discussion emphasizes implementation depth, architecture, operational ownership, technical judgment, project execution, collaboration, leadership, or a mixture.",
    "How much diagramming, pseudocode, code-level explanation, metric detail, or system history is expected.",
    "Whether the interviewer stays on one project for most of the round or compares evidence across multiple résumé items.",
    "How deeply the interviewer probes failures, migrations, reliability, security, performance, cost, stakeholder disagreement, or later system evolution.",
    "How expectations vary with role and level, especially around autonomy, architectural scope, organizational reach, risk, and long-term consequences.",
  ],

  beforeRound: [
    "Review the factual timeline, objective, constraints, ownership boundaries, major decisions, important metrics, failures, collaborators, and final outcome of the projects most relevant to the role.",
    "Prepare a concise orientation for each major project and expandable branches for architecture, decisions, trade-offs, execution, failures, stakeholders, measurement, aftermath, and learning.",
    "Refresh the technical concepts required to explain your own decisions, while leaving full System Design, ML Design, and Low-Level Design curriculum in their dedicated sections.",
    "Identify sensitive names, customer information, proprietary mechanisms, exact internal metrics, or business details that should be generalized before the interview.",
  ],

  flow: [
    {
      id: "orient-project",
      title: "Orient to the project and question",
      objective:
        "Establish which project or résumé item is being discussed, why it mattered, what the interviewer wants to explore, and the candidate's role.",
      actions: [
        "Give a concise project orientation: problem, users or stakeholders, relevant scale or context, constraints, your role, and outcome.",
        "Clarify which part of the project the interviewer wants to explore when the project contains several independent technical or organizational branches.",
        "Avoid beginning with a full architecture dump before the interviewer understands the problem and your responsibility.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "establish-technical-model",
      title: "Establish the technical model",
      objective:
        "Give enough architecture, data flow, interfaces, or implementation context for the interviewer to understand the later decisions.",
      actions: [
        "Start approximately one level above the deepest implementation detail and descend when the interviewer asks for depth.",
        "Describe only the components, flows, constraints, and dependencies needed to understand the project's important decisions.",
        "Connect technical details to project behavior rather than listing technologies or reproducing an entire system diagram.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "separate-ownership",
      title: "Separate personal ownership from team work",
      objective:
        "Make the candidate's actual contribution, authority, influence, implementation, and inherited context explicit.",
      actions: [
        "State what already existed before your involvement and what another engineer, team, vendor, or leader owned.",
        "Use personal language for decisions, implementations, investigations, or coordination you actually owned.",
        "Use team language for genuinely shared work and give collaborators appropriate credit.",
        "Distinguish direct authority from influence when a decision required alignment rather than unilateral ownership.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "explain-key-decisions",
      title: "Explain the consequential decisions",
      objective:
        "Show the judgment behind the project by examining decisions that had meaningful alternatives or consequences.",
      actions: [
        "Choose one or two genuinely difficult decisions instead of narrating the project chronology step by step.",
        "State the alternatives considered and the constraints, evidence, risks, or trade-offs that differentiated them.",
        "Explain why the selected option was reasonable with the information available at the time.",
        "Identify what would have changed the decision when the trade-off depended on uncertain assumptions.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "trace-execution",
      title: "Trace execution, adaptation, and failure",
      objective:
        "Connect the chosen approach to implementation, rollout, verification, operational behavior, and changes made when evidence contradicted assumptions.",
      actions: [
        "Explain how the project moved from decision to implementation, rollout, migration, adoption, or operation at the level relevant to the question.",
        "Describe testing, monitoring, rollback, migration, reliability, performance, security, or operational controls only where they were material to the project.",
        "Make failed assumptions, incidents, rejected approaches, or implementation problems visible rather than editing them out of the story.",
        "Explain what evidence caused the team or candidate to adapt the original plan.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "outcomes-aftermath",
      title: "Explain outcomes and aftermath",
      objective:
        "Show what changed, how the candidate knows, what limitations remained, and how the system or organization evolved after the initial result.",
      actions: [
        "State the observable technical, product, operational, team, or business outcome using only defensible evidence.",
        "Separate remembered measurements from estimates and avoid inventing precise traffic, revenue, latency, adoption, or reliability figures.",
        "Describe meaningful limitations, regressions, follow-on work, ownership transfers, migrations, or later changes when relevant.",
        "Explain what you learned and what you would change now with the benefit of later evidence.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "handle-followups-close",
      title: "Handle nonlinear follow-ups and close",
      objective:
        "Maintain technical and factual consistency as the interviewer moves among implementation, architecture, ownership, trade-offs, failures, and organizational consequences.",
      actions: [
        "Answer the specific follow-up before trying to return to the original narrative.",
        "Move deeper or shallower technically based on the interviewer’s question rather than on a memorized presentation sequence.",
        "State when a detail is not remembered or cannot be shared, then give the boundary of what can be explained safely.",
        "Close by reconnecting the important decision, personal contribution, trade-off, outcome, limitation, and learning.",
      ],
      classification: "widely-applicable",
    },
  ],

  timeFrameworks: [
    {
      label: "Typical 45-minute Project Deep Dive",
      assumption:
        "This is an adaptable range for a focused project conversation. Project complexity, interviewer follow-up depth, and whether one or several projects are discussed may substantially change the allocation.",
      phases: [
        {
          label: "Orient to project and role",
          range: "About 5–8 minutes",
          objective:
            "Establish the problem, stakes, project boundary, personal role, and technical orientation.",
          adjustment:
            "Compress the overview when the interviewer already knows the résumé context and asks for one specific decision.",
        },
        {
          label: "Technical model and key decisions",
          range: "About 12–17 minutes",
          objective:
            "Explain enough of the system to support detailed discussion of ownership, alternatives, and trade-offs.",
          adjustment:
            "Avoid consuming the round on architecture that the candidate did not personally influence.",
        },
        {
          label: "Execution and follow-up depth",
          range: "About 14–19 minutes",
          objective:
            "Explore implementation, failure, rollout, operations, collaboration, and the branches the interviewer chooses.",
          adjustment:
            "Let interviewer probes determine depth rather than trying to visit every prepared branch.",
        },
        {
          label: "Outcome, aftermath, and close",
          range: "Use the remaining 6–10 minutes",
          objective:
            "Make evidence, limitations, learning, and remaining candidate questions clear.",
          adjustment:
            "If the interviewer is still probing a consequential decision, finish that evidence rather than forcing a scripted conclusion.",
        },
      ],
      classification: "context-dependent",
    },
    {
      label: "Typical 60-minute Project Deep Dive",
      assumption:
        "This range assumes a technically substantial project or deeper exploration of architecture, execution, organizational dependencies, failures, and later evolution. It is not a universal timing script.",
      phases: [
        {
          label: "Orient to project and role",
          range: "About 6–10 minutes",
          objective:
            "Establish objective, context, scope, technical model, ownership boundary, and expected depth.",
          adjustment:
            "Use a compact executive summary before descending into implementation.",
        },
        {
          label: "Technical model and consequential decisions",
          range: "About 16–22 minutes",
          objective:
            "Explain how the system worked and examine the decisions that most exposed candidate judgment.",
          adjustment:
            "Prefer depth on two or three consequential decisions over broad narration of every project phase.",
        },
        {
          label: "Execution, failures, and nonlinear follow-ups",
          range: "About 20–27 minutes",
          objective:
            "Explore rollout, production behavior, risks, collaboration, failure, alternatives, and interviewer-selected technical branches.",
          adjustment:
            "Keep factual ownership and chronology consistent as the discussion changes direction.",
        },
        {
          label: "Outcome, evolution, and close",
          range: "Use the remaining 8–13 minutes",
          objective:
            "Explain evidence, aftermath, learning, unresolved limitations, and role-relevant questions.",
          adjustment:
            "Keep enough time to state what changed after launch and what the candidate would do differently now.",
        },
      ],
      classification: "context-dependent",
    },
  ],

  communication: [
    {
      title: "Start with the project, not the diagram",
      productive:
        "Establish why the project mattered, the relevant constraints, and your role before explaining technical structure.",
      avoid:
        "Opening with a dense architecture walkthrough before the interviewer knows what problem the system solves.",
    },
    {
      title: "Externalize decisions, not every implementation detail",
      productive:
        "Explain the assumption, decision, alternative, trade-off, and consequence at useful checkpoints.",
      avoid:
        "Narrating every class, service, API, command, ticket, or implementation step regardless of relevance.",
    },
    {
      title: "Separate I from we precisely",
      productive:
        "Identify what you designed, implemented, decided, influenced, or investigated while representing shared work accurately.",
      avoid:
        "Using 'we' for everything or claiming team-level outcomes as exclusively personal accomplishments.",
    },
    {
      title: "Adjust technical resolution",
      productive:
        "Begin with a coherent system model and descend into implementation only as the interviewer probes.",
      avoid:
        "Assuming every interviewer wants the deepest possible technical explanation from the start.",
    },
  ],

  recovery: [
    {
      situation: "You realize the explanation has become an architecture dump.",
      response:
        "Return to the project objective and the decision being examined, then keep only the components required to explain that decision.",
      avoid:
        "Continuing to add technical components because complexity appears impressive.",
    },
    {
      situation: "The interviewer challenges whether you personally owned the decision.",
      response:
        "Separate who had formal decision authority, what you recommended or implemented, and where your evidence materially influenced the result.",
      avoid:
        "Expanding your ownership claim or minimizing the engineer or leader who actually owned the decision.",
    },
    {
      situation: "You cannot remember an exact metric, date, or implementation detail.",
      response:
        "State that the exact detail is not remembered, give only a defensible approximate or qualitative boundary when useful, and continue with the decision evidence.",
      avoid:
        "Inventing precision to make the project sound more credible.",
    },
    {
      situation: "A major project assumption failed.",
      response:
        "Explain the original evidence, what contradicted it, the consequence, how the plan changed, and what was learned.",
      avoid:
        "Editing the failure out of the account or pretending the final solution had been obvious from the beginning.",
    },
    {
      situation: "The interviewer asks for confidential detail.",
      response:
        "State that the exact internal detail cannot be shared, generalize the sensitive name, metric, customer, or mechanism, and preserve the engineering constraint and decision logic.",
      avoid:
        "Disclosing restricted information or improvising a fictional substitute presented as fact.",
    },
  ],

  validation: [
    "Confirm that the interviewer can state why the project mattered and what the candidate personally owned.",
    "Check that the technical model contains enough detail to explain the decisions without becoming a replacement System Design interview.",
    "Make at least one consequential decision, alternative, and trade-off explicit.",
    "Make execution, failure or uncertainty, and adaptation visible where they materially affected the project.",
    "Support the outcome with defensible evidence and preserve meaningful limitations or later changes.",
    "Verify that technical details, ownership boundaries, chronology, metrics, and confidential-information boundaries remain consistent under follow-up.",
  ],

  closing: [
    "Reconnect the project objective to the consequential decision and personal contribution.",
    "State the strongest supported outcome and the most important remaining limitation or consequence.",
    "Explain what changed in your judgment or what you would do differently now.",
    "Stop once the project evidence is complete rather than introducing another unrelated résumé item.",
  ],

  questionsToAsk: [
    "What kinds of technical ownership distinguish strong engineers at this level on the team?",
    "How does the team make and revisit difficult architectural or operational decisions when evidence changes?",
    "How are ownership boundaries handled when a project spans several engineering or cross-functional teams?",
  ],

  signals: {
    strong: [
      "Explains the project objective and technical model before diving into isolated implementation details.",
      "Makes personal ownership, inherited context, collaboration, and decision authority easy to distinguish.",
      "Explains consequential decisions using alternatives, constraints, evidence, and trade-offs.",
      "Can move between architecture, implementation, execution, failure, and organizational consequences without losing factual consistency.",
      "Uses outcomes and metrics proportionately and acknowledges uncertainty, limitations, and failed assumptions.",
      "Shows level-appropriate technical judgment, reflection, and confidentiality under follow-up.",
    ],
    concern: [
      "Uses system complexity or jargon as a substitute for explaining why the project mattered.",
      "Spends most of the deep dive describing architecture or decisions created by other engineers.",
      "Uses 'we' throughout without establishing personal decisions, implementation, or influence.",
      "Cannot explain realistic alternatives or why an important technical choice was made.",
      "Changes ownership, chronology, metrics, or technical facts under probing or invents details that are not remembered.",
      "Hides failures and limitations, or reveals confidential information to make the story sound more concrete.",
    ],
  },

  failureModes: [
    {
      failure: "Architecture dump",
      correction:
        "Return to the problem and decision, then explain only the technical structure needed to understand the evidence.",
    },
    {
      failure: "Chronology dump",
      correction:
        "Organize around consequential decisions and trade-offs rather than narrating every project phase in order.",
    },
    {
      failure: "Team-only ownership",
      correction:
        "Separate direct personal decisions and implementation from shared execution, inherited architecture, and other teams’ work.",
    },
    {
      failure: "Complexity as impact",
      correction:
        "Explain what changed for users, systems, operations, teams, or the business rather than treating technical complexity as the outcome.",
    },
    {
      failure: "No real alternatives",
      correction:
        "Identify the credible options available at the time and explain which constraints or evidence made one preferable.",
    },
    {
      failure: "Success-only history",
      correction:
        "Preserve failed assumptions, incidents, limitations, regressions, and later corrections when they materially shaped the project.",
    },
    {
      failure: "Follow-up inconsistency",
      correction:
        "Maintain one factual project model and explicitly correct earlier wording when a deeper answer reveals that it was incomplete.",
    },
  ],

  seniority: [
    {
      level: "SDE I / entry level",
      emphasis:
        "A bounded but technically real contribution, clear implementation ownership, sound reasoning, collaboration, and learning are the primary evidence.",
      strongSignals: [
        "Explains the specific component or implementation personally owned.",
        "Understands how that work fits into the larger system.",
        "Can justify important local decisions and tests.",
        "Describes a failure, correction, or learning honestly.",
      ],
      avoid: [
        "Inflating a bounded contribution into ownership of the entire system.",
        "Using architecture terminology without understanding the implemented behavior.",
      ],
    },
    {
      level: "SDE II / mid level",
      emphasis:
        "End-to-end ownership of a meaningful component or project, autonomous decisions, production implications, trade-offs, and cross-team collaboration become more visible.",
      strongSignals: [
        "Explains how a meaningful project moved from ambiguous requirements through implementation and rollout.",
        "Owns consequential technical choices and production outcomes.",
        "Reasons about failure, operability, migration, or reliability where relevant.",
        "Shows how collaboration or disagreement changed execution.",
      ],
      avoid: [
        "Describing delivery responsibility without exposing the decisions made inside it.",
        "Claiming end-to-end ownership while being unable to explain rollout, failure behavior, or important dependencies.",
      ],
    },
    {
      level: "Senior+",
      emphasis:
        "Senior evidence adds ambiguous problem framing, architectural consequences, cross-team dependencies, influence, risk, migration or evolution strategy, longer-term trade-offs, and leverage through others when those were genuinely part of the project.",
      strongSignals: [
        "Explains which decisions were difficult to reverse and why.",
        "Connects architecture to organizational, operational, product, cost, or migration consequences.",
        "Shows influence across ownership boundaries without erasing other teams’ decisions.",
        "Explains how the project evolved after launch and how later evidence changed strategy or operating mechanisms.",
      ],
      avoid: [
        "Using project size or organizational visibility as a substitute for personal technical judgment.",
        "Adding senior-sounding architecture language unsupported by actual ownership.",
        "Turning every project into an enterprise-wide transformation when a smaller factual scope is more accurate.",
      ],
    },
  ],

  environment: {
    remote: [
      "Confirm the meeting, diagramming, screen-sharing, and any permitted note or artifact expectations before the round.",
      "Keep only the project overview or allowed compact cues visible so notes support rather than replace live explanation.",
      "State promptly when audio, connection, screen-sharing, or diagramming problems prevent a technical branch from being explained accurately.",
    ],
    onsite: [
      "Confirm whether the discussion is expected to stay conversational or use a whiteboard, diagram, résumé copy, or other artifact.",
      "Use diagrams only when they clarify the system or decision currently under discussion.",
      "Ask before erasing technical context the interviewer may still be using for follow-up.",
    ],
    accessibility: [
      "Request formal accommodations through the recruiter or designated company contact before the interview when possible.",
      "Ask for long or multi-part follow-ups to be repeated, written, enlarged, or divided into smaller parts when useful.",
      "A deliberate explanation pace, use of notes, drawing speed, or response pause is not evidence of weaker technical judgment.",
      "The Playbook does not infer capability from eye contact, accent, speaking speed, response latency, handwriting, drawing style, or a particular storytelling style.",
    ],
  },

  companyModifierRules: [
    "Official recruiter and company-provided instructions override this general guide.",
    "Candidate reports may describe historical project-deep-dive formats or emphasis areas but must not be presented as current company policy.",
    "Use the verified Company Guide for supported level, role, duration, domain, presentation, artifact, or technical-depth modifiers.",
    "Do not infer a universal project count, ideal project size, required architecture depth, answer length, metric requirement, interviewer style, or scoring rubric.",
  ],

  interactions: [
    {
      id: "architecture-depth",
      title: "System orientation versus architecture dump",
      scenario:
        "The interviewer asks for an overview of a technically substantial migration project.",
      weak:
        "The candidate immediately draws every service, database, queue, cache, deployment component, and monitoring system before explaining why the migration existed.",
      strong:
        "The candidate establishes the business and technical problem, their ownership boundary, and the main system flow, then expands the migration architecture when the interviewer probes it.",
      annotation:
        "Technical depth is useful when it supports project evidence and interviewer questions rather than replacing the project narrative.",
      classification: "illustrative",
    },
    {
      id: "ownership",
      title: "Project ownership versus team outcome",
      scenario:
        "Several engineers and a platform team contributed to a successful launch.",
      weak:
        "The candidate says they led the project but cannot distinguish their decisions from the platform team's architecture and another engineer's implementation.",
      strong:
        "The candidate explains the decision they owned, the component another engineer owned, the platform boundary they depended on, and how they coordinated the rollout.",
      annotation:
        "Credible deep-dive ownership makes responsibility boundaries more precise as follow-up becomes deeper.",
      classification: "illustrative",
    },
    {
      id: "hard-decision",
      title: "Explaining a consequential trade-off",
      scenario:
        "The project had a choice between a faster migration with operational risk and a slower compatibility approach.",
      weak:
        "The candidate says the selected architecture was the best practice and does not discuss credible alternatives.",
      strong:
        "The candidate explains the two viable paths, the compatibility and operational risks, the evidence available at the time, and why the team accepted one set of costs.",
      annotation:
        "The quality of the decision is more visible when alternatives and constraints are explicit.",
      classification: "illustrative",
    },
    {
      id: "failed-assumption",
      title: "Explaining a failed assumption",
      scenario:
        "A rollout assumption proved wrong after production traffic reached the new path.",
      weak:
        "The candidate skips the failure and presents the final architecture as though it had been designed correctly from the beginning.",
      strong:
        "The candidate explains the assumption, the production evidence that disproved it, the consequence, the mitigation, and the design change that followed.",
      annotation:
        "A failed assumption can provide strong engineering evidence when the response and learning remain factual.",
      classification: "illustrative",
    },
    {
      id: "confidentiality",
      title: "Handling confidential project detail",
      scenario:
        "The interviewer asks for exact internal scale and customer information from a former employer.",
      weak:
        "The candidate supplies restricted figures and identifiable internal details because they believe precision will make the project sound stronger.",
      strong:
        "The candidate says the exact values are confidential, gives a safe order-of-magnitude or qualitative constraint only when defensible, and continues with the engineering decision.",
      annotation:
        "Confidentiality boundaries should preserve the reasoning evidence without exposing protected information.",
      classification: "illustrative",
    },
  ],

  integrity: [
    "This dossier describes general Project Deep Dive interview execution, not a company scoring rubric or résumé evaluation rubric.",
    "It does not reproduce proprietary prompts, confidential project architectures, hidden evaluation standards, or fabricated candidate project histories.",
    "It does not authorize external assistance during a live interview.",
    "Project preparation and story construction remain in Behavioral, while System Design, ML Design, Low-Level Design, implementation, and other technical concepts remain in their dedicated learning and practice sections.",
  ],
};
