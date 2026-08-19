/**
 * Behavioral round-execution dossier.
 *
 * Content only — see `./schema.ts` for the shared type contract and
 * `./index.ts` for the registry that assembles every authored dossier.
 */
import type { RoundExecutionDossier } from "./schema.ts";

export const behavioralDossier: RoundExecutionDossier = {
  slug: "behavioral",
  status: "published",
  lastReviewed: "2026-08-18",
  title:
    "Behavioral execution: answer with truthful evidence, clear ownership, and adaptable depth.",
  purpose:
    "Identify the evidence being requested, choose a truthful relevant example, establish context efficiently, make personal ownership, decisions, trade-offs, outcomes, and learning clear, and adapt under follow-up without reciting a memorized script or inventing precision.",

  intendedEvaluation: [
    "Identify the competency, judgment, or evidence the interviewer is asking for before selecting an example.",
    "Choose a truthful example that is relevant enough to answer the question without forcing a perfect story.",
    "Establish the necessary context, stakes, constraints, and personal role without burying the important decision.",
    "Make personal ownership, actions, decisions, trade-offs, and collaboration boundaries explicit.",
    "Describe outcomes and impact at the level the available evidence supports without manufacturing certainty or precision.",
    "Respond to probing follow-ups consistently, acknowledge ambiguity or mistakes, and revise an earlier statement when new detail requires it.",
    "Show level-appropriate judgment, reflection, learning, and confidentiality while keeping the answer responsive to the question asked.",
  ],

  companyVariation: [
    "Which values, competencies, leadership behaviors, or role expectations the company chooses to explore.",
    "Whether the round is highly structured around predefined questions or develops conversationally through follow-ups.",
    "How much the interviewer emphasizes conflict, failure, influence, execution, leadership, collaboration, customer judgment, or another behavior.",
    "Whether one story receives deep follow-up or several shorter questions are asked across different evidence areas.",
    "How expectations change by level, especially around scope, autonomy, influence, ambiguity, mentoring, and cross-functional judgment.",
    "Whether recruiter or company-provided guidance asks candidates to prepare examples around specific published values or competencies.",
  ],

  beforeRound: [
    "Review the official round format and any company-provided values or competency guidance without assuming candidate reports are current policy.",
    "Review the existing story map for coverage and factual consistency rather than memorizing full answer scripts.",
    "Make sure the prepared examples include enough evidence for ownership, conflict or disagreement, failure or learning, impact, and difficult judgment where those areas are relevant.",
    "Practice follow-up questions that challenge ownership, decisions, outcomes, trade-offs, uncertainty, and sensitive details.",
  ],

  flow: [
    {
      id: "identify-signal",
      title: "Identify the evidence requested",
      objective:
        "Determine what judgment, behavior, competency, or evidence the question is actually asking you to demonstrate.",
      actions: [
        "Listen for the decision, behavior, relationship, failure, conflict, ownership, or learning dimension in the question.",
        "Clarify the question briefly when two materially different interpretations would lead to different examples.",
        "Avoid choosing a favorite story before understanding why the interviewer asked the question.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "select-evidence",
      title: "Choose the most relevant truthful example",
      objective:
        "Select evidence that directly supports the requested behavior without forcing a rehearsed story into the wrong question.",
      actions: [
        "Choose the example with the strongest relevant decision or behavior, not necessarily the most impressive project.",
        "Prefer a real imperfect example over a polished story that only loosely matches the question.",
        "If no example is exact, state the limitation briefly and use the closest truthful evidence rather than inventing one.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "establish-context",
      title: "Establish context and stakes",
      objective:
        "Give the interviewer enough information to understand the problem, constraints, and your role without turning context into the majority of the answer.",
      actions: [
        "State the relevant setting, objective, constraint, and why the situation mattered.",
        "Make your role and authority boundary clear before describing team activity.",
        "Exclude background details that do not change the decision or evidence being evaluated.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "explain-ownership",
      title: "Explain personal ownership and judgment",
      objective:
        "Show what you personally noticed, decided, did, changed, or influenced while representing team contributions accurately.",
      actions: [
        "Use personal language for your decisions and actions and team language for genuinely shared work.",
        "Explain the alternatives, trade-offs, disagreement, or uncertainty that made the decision non-trivial.",
        "Describe how you collaborated, influenced, escalated, or changed direction when those behaviors were material.",
        "Make failures, mistakes, and corrective actions explicit when the question asks for them.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "outcome-learning",
      title: "Explain outcome and learning",
      objective:
        "Connect the actions to a supported result and show what changed in your judgment or behavior afterward.",
      actions: [
        "State the observable outcome and distinguish direct evidence from inference.",
        "Use numbers only when they are remembered and defensible; otherwise describe impact without false precision.",
        "Acknowledge unresolved limitations or negative consequences instead of polishing every story into a complete success.",
        "Explain the lesson, changed behavior, or subsequent decision when it demonstrates real reflection.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "handle-followups",
      title: "Handle follow-ups and challenge",
      objective:
        "Remain truthful, specific, and internally consistent as the interviewer probes ownership, alternatives, outcomes, or missing detail.",
      actions: [
        "Answer the follow-up directly before adding new context.",
        "Treat skepticism or challenge as a request for evidence rather than a cue to defend every original choice.",
        "Say when you do not remember a detail and provide the boundary of what you do know.",
        "Correct an earlier statement explicitly when a follow-up reveals that it was incomplete or imprecise.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "close-consistently",
      title: "Close consistently and protect the boundary",
      objective:
        "Leave the interviewer with a clear answer to the original question without adding unsupported claims or confidential detail.",
      actions: [
        "Reconnect the example to the behavior or judgment the question requested.",
        "Keep the final ownership, outcome, and learning consistent with the details already provided.",
        "Generalize or anonymize sensitive implementation, customer, personnel, or business details when disclosure would be inappropriate.",
        "Stop once the evidence is complete and let the interviewer choose the next follow-up rather than extending into a memorized monologue.",
      ],
      classification: "widely-applicable",
    },
  ],

  timeFrameworks: [
    {
      label: "Typical 30-minute Behavioral round",
      assumption:
        "This is an adaptable range for a focused behavioral conversation. Question count, interviewer follow-up depth, and company format may substantially change the allocation.",
      phases: [
        {
          label: "Orient to the question",
          range: "About 3–5 minutes across the opening",
          objective:
            "Understand the requested evidence and choose an appropriate example.",
          adjustment:
            "Use less time when the question is precise; clarify only ambiguity that changes the evidence you would select.",
        },
        {
          label: "Present the core evidence",
          range: "About 10–14 minutes across primary answers",
          objective:
            "Make context, ownership, decisions, trade-offs, outcomes, and learning understandable.",
          adjustment:
            "Keep the first pass concise enough to leave room for interviewer-directed depth.",
        },
        {
          label: "Follow-ups and additional evidence",
          range: "About 8–12 minutes",
          objective:
            "Respond to probing questions, test consistency, and provide another example when needed.",
          adjustment:
            "Follow the interviewer’s depth rather than trying to complete every prepared story.",
        },
        {
          label: "Close and candidate questions",
          range: "Use the remaining 3–5 minutes",
          objective:
            "Finish the current evidence cleanly and use remaining time for relevant questions when invited.",
          adjustment:
            "Do not truncate an important follow-up merely to preserve a preset closing allocation.",
        },
      ],
      classification: "context-dependent",
    },
    {
      label: "Typical 45-minute Behavioral round",
      assumption:
        "This range assumes several evidence areas or deeper probing of ownership, judgment, failure, influence, or leadership. It is not a universal timing script.",
      phases: [
        {
          label: "Orient to the evidence requested",
          range: "About 4–6 minutes across the opening",
          objective:
            "Understand the role of the question and select the strongest relevant truthful evidence.",
          adjustment:
            "Avoid turning clarification into an interview about the interview.",
        },
        {
          label: "Core examples",
          range: "About 16–22 minutes",
          objective:
            "Provide clear evidence across the most important questions while preserving room for probing.",
          adjustment:
            "Prefer complete evidence on fewer questions over rushing several memorized answers.",
        },
        {
          label: "Follow-up depth and consistency",
          range: "About 12–16 minutes",
          objective:
            "Explore decisions, alternatives, personal contribution, outcomes, failures, and learning in greater depth.",
          adjustment:
            "Let interviewer interest determine which story receives deeper exploration.",
        },
        {
          label: "Close and candidate questions",
          range: "Use the remaining 4–7 minutes",
          objective:
            "Finish the final evidence cleanly and ask role-relevant questions when time is offered.",
          adjustment:
            "If the interviewer continues probing, prioritize answering that evidence request over following a preset schedule.",
        },
      ],
      classification: "context-dependent",
    },
  ],

  communication: [
    {
      title: "Answer the question that was asked",
      productive:
        "Lead with evidence relevant to the requested behavior and keep optional context subordinate to it.",
      avoid:
        "Delivering the same prepared story regardless of what the interviewer is trying to understand.",
    },
    {
      title: "Separate I from we",
      productive:
        "Make your decisions and actions explicit while crediting team contributions accurately.",
      avoid:
        "Using only 'we' so the interviewer cannot determine personal ownership, or claiming shared work as exclusively yours.",
    },
    {
      title: "Use evidence without false precision",
      productive:
        "State remembered metrics and observable outcomes clearly and label estimates or uncertainty when exact detail is unavailable.",
      avoid:
        "Inventing numbers, dates, scope, or impact because precision sounds more impressive.",
    },
    {
      title: "Give a concise first pass, then deepen",
      productive:
        "Provide enough structure for the answer to stand on its own while leaving room for interviewer follow-up.",
      avoid:
        "Reciting a long memorized monologue that prevents collaborative probing.",
    },
  ],

  recovery: [
    {
      situation: "You do not have a perfect example.",
      response:
        "Choose the closest truthful example, state the limitation briefly when material, and focus on the behavior that actually maps to the question.",
      avoid:
        "Inventing an event or heavily altering a prepared story to manufacture a perfect match.",
    },
    {
      situation: "You lose the structure of the answer.",
      response:
        "Return to the decision or behavior the interviewer asked about, state what you personally did, then finish with the supported outcome and learning.",
      avoid:
        "Restarting the entire story from the beginning or apologizing repeatedly for losing the thread.",
    },
    {
      situation: "The interviewer challenges your ownership.",
      response:
        "Separate your contribution from the team’s work, identify the decisions you personally made, and narrow any claim that was too broad.",
      avoid:
        "Inflating ownership or becoming defensive about collaborative work.",
    },
    {
      situation: "You cannot remember an exact metric or detail.",
      response:
        "Say that you do not remember the exact figure, provide the qualitative or approximate boundary only when defensible, and continue with the decision evidence.",
      avoid:
        "Inventing a precise value to preserve the appearance of certainty.",
    },
    {
      situation: "The example involves sensitive or confidential information.",
      response:
        "Generalize names, customer details, implementation specifics, or internal business information while preserving the decision, constraints, and learning.",
      avoid:
        "Disclosing proprietary or personal information because the interviewer asks for more detail.",
    },
  ],

  validation: [
    "Confirm that the example answers the behavior, judgment, or competency actually requested.",
    "Check that the context is sufficient but does not hide the important decision.",
    "Make personal ownership and team contribution distinguishable.",
    "Make the consequential decision, alternative, trade-off, conflict, failure, or uncertainty explicit where relevant.",
    "State the supported outcome and learning without fabricated precision or a forced success narrative.",
    "Verify that follow-up answers remain consistent and that confidential or sensitive details stay appropriately bounded.",
  ],

  closing: [
    "Reconnect the example to the behavior or judgment the interviewer asked about.",
    "State the supported result, limitation, or learning that matters most.",
    "Correct or qualify any claim that became less certain during follow-up.",
    "Stop once the evidence is complete instead of adding another rehearsed conclusion.",
  ],

  questionsToAsk: [
    "What kinds of decisions or ownership most distinguish strong engineers at this level on the team?",
    "How does the team handle disagreement and feedback when several approaches are reasonable?",
    "What tends to help engineers become trusted with broader scope or more ambiguous work here?",
  ],

  signals: {
    strong: [
      "Selects evidence based on the question rather than on a favorite prepared story.",
      "Makes personal ownership and collaboration boundaries easy to understand.",
      "Explains decisions, alternatives, trade-offs, conflict, or uncertainty with concrete evidence.",
      "Uses outcomes and metrics proportionately and labels uncertainty honestly.",
      "Handles follow-ups constructively without changing the story to satisfy the interviewer.",
      "Shows reflection, learning, and level-appropriate judgment while protecting confidential information.",
    ],
    concern: [
      "Forces a memorized story into a question it does not actually answer.",
      "Uses team-level language throughout without clarifying personal contribution.",
      "Presents unsupported metrics or polished impact claims as certain fact.",
      "Removes meaningful failure, conflict, or ambiguity so every story becomes an uncomplicated success.",
      "Becomes defensive or materially changes facts when the interviewer probes the example.",
      "Reveals confidential information or invents details to make the answer appear stronger.",
    ],
  },

  failureModes: [
    {
      failure: "Memorized monologue",
      correction:
        "Answer the requested evidence concisely, then let follow-up questions determine which details deserve depth.",
    },
    {
      failure: "Team-only ownership",
      correction:
        "Separate personal decisions and actions from genuinely shared execution and give collaborators appropriate credit.",
    },
    {
      failure: "Framework-first answer",
      correction:
        "Use structure only to make the evidence understandable; do not narrate a framework instead of answering the question.",
    },
    {
      failure: "Manufactured precision",
      correction:
        "Use only defensible numbers and details, and state uncertainty or approximation explicitly when needed.",
    },
    {
      failure: "Success-only storytelling",
      correction:
        "Preserve mistakes, limitations, conflict, or unresolved outcomes when they are material to the evidence.",
    },
    {
      failure: "Defensive follow-up",
      correction:
        "Treat challenge as a request for evidence, narrow claims when necessary, and explain why the original decision was reasonable under the known constraints.",
    },
    {
      failure: "Confidentiality spill",
      correction:
        "Generalize sensitive names, business data, implementation details, and personnel information while preserving the relevant decision evidence.",
    },
  ],

  seniority: [
    {
      level: "SDE I / entry level",
      emphasis:
        "Clear personal contribution, truthful examples, learning, collaboration, and basic ownership are the primary evidence.",
      strongSignals: [
        "Explains what they personally did rather than only describing the team.",
        "Uses specific examples with understandable context.",
        "Acknowledges mistakes and describes what changed afterward.",
        "Shows dependable collaboration and follow-through.",
      ],
      avoid: [
        "Trying to manufacture senior-level scope the example did not have.",
        "Replacing concrete evidence with broad statements about personal qualities.",
      ],
    },
    {
      level: "SDE II / mid level",
      emphasis:
        "Autonomous judgment, trade-offs, cross-functional collaboration, conflict handling, delivery ownership, and repeated learning become more visible.",
      strongSignals: [
        "Explains how competing constraints shaped the decision.",
        "Distinguishes direct ownership from influence and collaboration.",
        "Shows how feedback or failure changed later execution.",
        "Connects individual decisions to meaningful team or product outcomes.",
      ],
      avoid: [
        "Describing responsibility without showing the judgment exercised inside that responsibility.",
        "Presenting influence as authority when the outcome depended on collaboration.",
      ],
    },
    {
      level: "Senior+",
      emphasis:
        "Senior evidence adds ambiguous ownership, multi-team influence, durable decision quality, organizational consequences, leadership through others, and explicit learning from difficult trade-offs.",
      strongSignals: [
        "Explains how decisions changed direction across a broader system, team, or organization where relevant.",
        "Shows influence without overstating authority or erasing collaborators.",
        "Identifies second-order consequences, stakeholder trade-offs, and difficult-to-reverse choices.",
        "Connects reflection to later leadership, operating mechanisms, mentoring, or decision quality.",
      ],
      avoid: [
        "Using large project scope as a substitute for personal judgment.",
        "Claiming strategic influence without evidence of decisions or changed outcomes.",
        "Turning every answer into an organization-wide leadership story when a smaller concrete example better answers the question.",
      ],
    },
  ],

  environment: {
    remote: [
      "Confirm the meeting link, audio, video, timezone, and any permitted notes before the round.",
      "Keep only compact story cues or allowed notes visible so reading does not replace the live conversation.",
      "State promptly when connection or audio problems prevent hearing a question or follow-up accurately.",
    ],
    onsite: [
      "Confirm the schedule, location, expected format, and any materials permitted during the conversation.",
      "Keep enough attention on the conversation to notice interviewer follow-ups rather than delivering a fixed prepared answer.",
      "Ask for a question to be repeated or clarified when needed instead of guessing what was asked.",
    ],
    accessibility: [
      "Request formal accommodations through the recruiter or designated company contact before the interview when possible.",
      "Ask for questions or follow-ups to be repeated, written, enlarged, or divided into smaller parts when useful.",
      "A deliberate speaking pace, response pause, use of notes, or different conversational rhythm is not evidence of weaker behavioral judgment.",
      "The Playbook does not infer capability from eye contact, accent, speaking speed, response latency, facial expression, or a particular communication style.",
    ],
  },

  companyModifierRules: [
    "Official recruiter and company-provided instructions override this general guide.",
    "Candidate reports may describe historical values questions or behavioral formats but must not be presented as current company policy.",
    "Use the verified Company Guide for supported values, competency, level, format, or role-specific modifiers.",
    "Do not infer a universal story framework, ideal answer length, required story count, values mapping, interviewer style, or scoring rubric.",
  ],

  interactions: [
    {
      id: "question-fit",
      title: "Favorite story versus requested evidence",
      scenario:
        "The interviewer asks about a disagreement where the candidate changed their approach after receiving new evidence.",
      weak:
        "The candidate uses a polished leadership story that contains conflict but never changed their own position.",
      strong:
        "The candidate chooses a less dramatic example where they initially disagreed, learned new information, changed the plan, and explains why.",
      annotation:
        "Relevance to the requested evidence is more important than using the most impressive prepared story.",
      classification: "illustrative",
    },
    {
      id: "ownership",
      title: "Team result versus personal ownership",
      scenario:
        "A project succeeded through work from several engineers and partner teams.",
      weak:
        "The candidate repeatedly says 'we built' and 'we decided' without identifying any personal decision or action.",
      strong:
        "The candidate credits the team outcome, then identifies the design decision they owned, the coordination they personally drove, and the work another team owned.",
      annotation:
        "Strong ownership evidence distinguishes personal judgment from shared execution without minimizing collaborators.",
      classification: "illustrative",
    },
    {
      id: "failure",
      title: "Failure without a forced success ending",
      scenario:
        "The interviewer asks about a decision that did not work as expected.",
      weak:
        "The candidate reframes the example until the failure disappears and describes the outcome as successful overall.",
      strong:
        "The candidate explains the flawed assumption, the consequence, the corrective action, and what changed in later decisions without pretending the original result was good.",
      annotation:
        "The learning evidence is stronger when the negative outcome remains visible and factual.",
      classification: "illustrative",
    },
    {
      id: "follow-up",
      title: "Handling a challenging follow-up",
      scenario:
        "The interviewer asks whether the candidate actually made the decision or merely implemented a lead engineer’s direction.",
      weak:
        "The candidate becomes defensive and expands their ownership claim.",
      strong:
        "The candidate separates the lead’s decision from the implementation decisions they owned and explains where they influenced the direction.",
      annotation:
        "Follow-up resilience comes from accurate ownership boundaries, not from defending the strongest possible interpretation.",
      classification: "illustrative",
    },
    {
      id: "confidentiality",
      title: "Protecting sensitive information",
      scenario:
        "A useful example involves an unreleased product issue and identifiable customer details.",
      weak:
        "The candidate shares internal names, exact confidential figures, and customer-specific context to make the story feel concrete.",
      strong:
        "The candidate generalizes the product and customer details, preserves the technical or organizational constraint, and explains the decision without exposing restricted information.",
      annotation:
        "Confidentiality can be preserved without removing the evidence the interviewer needs to evaluate judgment.",
      classification: "illustrative",
    },
  ],

  integrity: [
    "This dossier describes general Behavioral interview execution, not a company scoring rubric or personality assessment.",
    "It does not reproduce proprietary prompts, hidden evaluation standards, or fabricated candidate stories.",
    "It does not authorize external assistance during a live interview.",
    "Story creation, question coverage, answer frameworks, story-to-question mapping, answer variants, and repeated practice remain in the dedicated Behavioral learning and private workspace.",
  ],
};
