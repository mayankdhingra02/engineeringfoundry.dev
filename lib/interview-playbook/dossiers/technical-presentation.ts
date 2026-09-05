import type { RoundExecutionDossier } from "./schema.ts";

export const technicalPresentationDossier = {
  slug: "technical-presentation",
  status: "published",
  lastReviewed: "2026-09-05",
  title: "Technical presentation: from audience contract to defensible conclusion",
  purpose: "Prepare and deliver a technical narrative that makes one central conclusion, its evidence, trade-offs, and uncertainty legible to the actual interview audience.",
  intendedEvaluation: [
    "Audience-aware technical judgment and prioritization.",
    "A coherent narrative connecting context, decision, evidence, and consequence.",
    "Accurate ownership, constraints, trade-offs, limitations, and uncertainty.",
    "Visual and spoken communication that helps the audience inspect the reasoning.",
    "Time control, question handling, and recovery when challenged or interrupted.",
  ],
  companyVariation: [
    "The assignment may ask for past work, a proposed design, a research result, a product decision, or a domain briefing.",
    "Audience size, technical depth, duration, interruption policy, and question placement vary.",
    "Some assignments require slides, a document, a demo, a whiteboard, or no visual artifact.",
    "Confidentiality rules may limit which project details, data, screenshots, or metrics can be shown.",
    "Evaluation emphasis may shift by role and level; the assignment and recruiter instructions govern.",
  ],
  beforeRound: [
    "Confirm the audience, purpose, expected artifact, duration, question format, submission deadline, sharing method, and permitted materials.",
    "Choose one central message the audience should retain and verify that every major section supports it.",
    "Replace confidential details with truthful abstractions and disclose material uncertainty rather than inventing precision.",
    "Rehearse in the delivery environment, test every visual or demo, and prepare an accessible fallback artifact.",
  ],
  flow: [
    {
      id: "contract",
      title: "Reconfirm the contract",
      objective: "Align the room on the topic, audience, timing, and question behavior before beginning the narrative.",
      actions: [
        "State the topic and intended takeaway in one concise opening.",
        "Confirm whether questions should come during the talk or at a designated point.",
        "Adapt when the live audience or available time differs materially from the assignment.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "orient",
      title: "Orient the audience",
      objective: "Give only the context and definitions needed to understand the decision or result.",
      actions: [
        "Name the user, system, or business problem and why it mattered.",
        "State your role and the scope you personally owned.",
        "Define unfamiliar terms and make the central question explicit.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "reason",
      title: "Show the decision path",
      objective: "Connect constraints and alternatives to the selected approach without narrating every historical detail.",
      actions: [
        "Name the constraints and evidence that changed the decision.",
        "Compare the most credible alternative and its trade-off.",
        "Separate your contribution from team or organizational decisions.",
      ],
      classification: "context-dependent",
    },
    {
      id: "evidence",
      title: "Make evidence inspectable",
      objective: "Use each visual, result, trace, or example to support a specific claim.",
      actions: [
        "Introduce what the audience should read from a visual before interpreting it.",
        "Explain measurement limits, missing evidence, and consequential uncertainty.",
        "Use a representative flow or example when raw detail would obscure the conclusion.",
      ],
      classification: "widely-applicable",
    },
    {
      id: "close-questions",
      title: "Conclude and handle questions",
      objective: "Restate the central conclusion, its limits, and the next decision before opening the remaining discussion.",
      actions: [
        "Connect the conclusion back to the original problem and audience need.",
        "Repeat or reframe a question when needed, answer directly, and distinguish fact from hypothesis.",
        "When the answer is unknown, state what you know and the next evidence you would seek.",
      ],
      classification: "widely-applicable",
    },
  ],
  timeFrameworks: [
    {
      label: "Assignment-shaped presentation",
      assumption: "This adaptable framework assumes the assignment provides a total duration; reserve discussion time according to the stated question format rather than a universal split.",
      phases: [
        { label: "Opening and contract", range: "A brief opening", objective: "Establish topic, purpose, central message, and question behavior.", adjustment: "Compress context when the audience already shares it." },
        { label: "Decision narrative", range: "Most of the speaking time", objective: "Connect context, constraints, alternatives, evidence, and outcome.", adjustment: "Remove secondary chronology before removing the decision or its evidence." },
        { label: "Conclusion", range: "A protected close", objective: "State the takeaway, limitation, and next implication clearly.", adjustment: "Move to the conclusion early when time is shortened." },
        { label: "Questions", range: "The agreed discussion window", objective: "Inspect assumptions and deepen the most consequential decisions.", adjustment: "Follow the live moderator or interviewer instruction when it differs." },
      ],
      classification: "context-dependent",
    },
  ],
  communication: [
    { title: "Use conclusion-bearing headings", productive: "State the point a visual or section supports so the audience can follow the argument.", avoid: "Using topic labels that make the audience infer why the material matters." },
    { title: "Translate before deepening", productive: "Give a plain-language model, then add the technical detail the audience needs.", avoid: "Beginning with dense notation, jargon, or architecture before orienting the audience." },
    { title: "Own uncertainty", productive: "Separate measured results, remembered facts, estimates, assumptions, and future work.", avoid: "Presenting a guess or team-wide result as personally verified fact." },
    { title: "Treat questions as inspection", productive: "Listen, restate the decision under discussion, and answer at the requested depth.", avoid: "Defending the deck or answering a different, easier question." },
  ],
  recovery: [
    { situation: "The audience is less familiar with the domain than expected.", response: "Pause, provide the smallest shared model and definition, then resume from the central question.", avoid: "Repeating the same jargon more slowly." },
    { situation: "A question interrupts the planned sequence.", response: "Answer now when it changes the argument; otherwise mark where the narrative will address it and return there explicitly.", avoid: "Ignoring the question or abandoning the presentation structure." },
    { situation: "A visual or demo fails.", response: "State the intended evidence, switch to the tested fallback, and continue without hiding the failure.", avoid: "Spending the remaining session debugging presentation tooling." },
    { situation: "Time is shortened.", response: "Move to the central decision, strongest evidence, limitation, and conclusion; identify omitted depth.", avoid: "Speaking faster while keeping every section." },
    { situation: "You do not know an answer.", response: "State the boundary of what you know, offer a clearly labeled hypothesis if useful, and name the next evidence you would seek.", avoid: "Inventing a metric, implementation detail, or historical fact." },
  ],
  validation: [
    "Read only the section headings and confirm they form a coherent argument.",
    "Verify that every visual supports a stated claim and remains legible in the actual delivery format.",
    "Check ownership, dates, units, metrics, citations, and confidentiality abstractions.",
    "Run the deck, document, demo, or whiteboard plan in the intended environment and test the fallback.",
    "Rehearse likely questions about alternatives, trade-offs, limitations, and personal contribution.",
  ],
  closing: [
    "Restate the central conclusion and why it matters to this audience.",
    "Name the most important limitation or uncertainty.",
    "Connect the result to the next decision or learning.",
    "Leave the agreed space for questions instead of adding an unplanned final section.",
  ],
  questionsToAsk: [
    "Who will attend, and what background should I assume?",
    "What outcome or evidence should the presentation make clear?",
    "How are questions handled, and are there required or prohibited materials?",
  ],
  signals: {
    strong: [
      "The central message is clear before technical depth begins.",
      "Constraints, alternatives, and evidence connect to the decision.",
      "Personal ownership and team contribution remain distinguishable.",
      "Visuals make the reasoning easier to inspect.",
      "Questions lead to precise, candid depth rather than defensiveness.",
    ],
    concern: [
      "The talk is chronological but has no decision or conclusion.",
      "Dense slides substitute for spoken reasoning.",
      "Confidential or unsupported details are presented as fact.",
      "The conclusion is lost when time changes or questions interrupt.",
      "Answers obscure uncertainty or personal ownership.",
    ],
  },
  failureModes: [
    { failure: "Building slides before choosing the message", correction: "Write the audience, purpose, and one-sentence conclusion before selecting evidence or visuals." },
    { failure: "Excessive project chronology", correction: "Organize around the consequential decision and use chronology only where it explains cause or learning." },
    { failure: "One deck for every audience", correction: "Adjust context, terminology, depth, and evidence for the people named in the assignment." },
    { failure: "Decorative visuals", correction: "Give each visual one claim to support; remove material that does not help inspect that claim." },
    { failure: "Unprotected close", correction: "Create a shorter route that still reaches the decision, evidence, limitation, and conclusion." },
  ],
  seniority: [
    { level: "SDE I / entry level", emphasis: "Clear ownership, accurate technical explanation, and evidence of learning from a bounded project.", strongSignals: ["Explains the problem and personal contribution concretely.", "Uses evidence honestly and answers foundational questions."], avoid: ["Inflating scope or hiding uncertainty behind jargon.", "Showing artifacts without explaining the decision they support."] },
    { level: "SDE II / mid level", emphasis: "Independent decisions, trade-offs, cross-component reasoning, and operational consequences.", strongSignals: ["Compares credible alternatives against constraints.", "Connects implementation choices to validation and outcomes."], avoid: ["Presenting implementation detail without product or system context.", "Claiming team outcomes without isolating personal judgment."] },
    { level: "Senior+", emphasis: "Problem framing, leverage, ambiguity, risk, organizational interfaces, and durable technical judgment.", strongSignals: ["Makes scope and decision boundaries explicit.", "Explains second-order consequences and what would change the decision."], avoid: ["Replacing technical depth with strategy vocabulary.", "Claiming certainty where the evidence or ownership is distributed."] },
  ],
  environment: {
    remote: ["Test screen sharing, fonts, video playback, audio, presenter view, links, and the fallback artifact.", "Keep private notifications and unrelated material outside the shared surface.", "Have a recruiter or moderator contact available if the meeting or sharing tool fails."],
    onsite: ["Confirm connector, projector, room, board, clicker, and artifact-transfer expectations.", "Design visuals for the furthest likely viewer and avoid relying only on color.", "Know how the conclusion will be delivered if the display or demo is unavailable."],
    accessibility: ["Ask the recruiter or designated contact about needed presentation or interview accommodations.", "Use readable contrast, legible type, labeled visuals, and a text-accessible fallback where practical.", "Describe material visual evidence aloud and do not infer capability from eye contact, speaking style, or speed."],
  },
  companyModifierRules: [
    "The assignment, recruiter instruction, and moderator direction override this general dossier.",
    "Keep company, role, level, audience, format, and evaluation claims attached to a current source.",
    "Do not infer slide count, duration, interruption policy, or expected project type from another candidate's process.",
    "When the audience or objective remains unknown, ask the recruiter and prepare a transferable short version as fallback.",
  ],
  interactions: [
    { id: "opening", title: "Opening with a conclusion", scenario: "The audience knows the project title but not why it matters.", weak: "The candidate begins with a long agenda and project chronology.", strong: "The candidate names the problem, their role, and the central decision the presentation will defend.", annotation: "The stronger opening gives the audience a question and destination before detail.", classification: "illustrative" },
    { id: "tradeoff", title: "Defending a trade-off", scenario: "An interviewer asks why a plausible alternative was not selected.", weak: "The candidate says the chosen tool was the standard option.", strong: "The candidate compares both options against the actual constraint, names the cost accepted, and states what would reverse the choice.", annotation: "A bounded comparison shows judgment without claiming the alternative is universally wrong.", classification: "illustrative" },
    { id: "unknown", title: "Handling an unknown", scenario: "A question asks for a metric the candidate did not own and cannot verify.", weak: "The candidate estimates a precise value and presents it as remembered fact.", strong: "The candidate says the metric was owned elsewhere, states the evidence they did observe, and explains how they would verify it.", annotation: "Truthful scope and a verification path preserve credibility.", classification: "illustrative" },
  ],
  integrity: [
    "This dossier is a general communication and execution guide, not an employer scoring rubric.",
    "It does not reproduce proprietary presentation assignments, prompts, project material, or confidential employer data.",
    "It does not authorize external assistance during a live interview or assessment.",
    "The candidate must follow the assignment's current rules for sources, artifacts, collaboration, and tools.",
  ],
} satisfies RoundExecutionDossier;

