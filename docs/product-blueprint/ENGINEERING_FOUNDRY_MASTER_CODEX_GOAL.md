---
title: Engineering Foundry Master Product, Content, and Autonomous Delivery Goal
version: 1.0
status: Authoritative single-document implementation specification
prepared_for: Codex lead agent and subagents
prepared_on: 2026-09-01
repository: mayankdhingra02/engineeringfoundry.dev
---

# Engineering Foundry Master Product, Content, and Autonomous Delivery Goal

> **Codex launcher**
>
> Read this file completely before changing code. Treat it as the authoritative product-and-content goal for Engineering Foundry. Reconcile it with the live repository, current tests, and current official sources. Continue through staged, reviewable pull requests until every item marked **Required** is implemented and every acceptance criterion in this document is satisfied. Use real Codex subagents for independent workstreams, but keep explicit file ownership and one lead agent for Git operations. Do not substitute generic model knowledge for a research-backed requirement, do not invent missing facts, and do not stop after one batch merely because the repository is large.

## Contents

0. What this document is and how to use it
1. Product model, users, and section ownership
2. Scope labels and implementation statuses
3. Source, evidence, freshness, and editorial policy
4. Shared page, content, and interaction contracts
5. Shared UX, accessibility, privacy, analytics, SEO, and engineering quality
6. System Design
7. Machine Learning System Design
8. DSA and Coding Interviews
9. Behavioral Interviews
10. Interview Playbook
11. Mock Interview Practice Lab
12. Company Interview Guides
13. Interview Experiences
14. Low-Level Design and Low-Level Systems
15. Salary Negotiation
16. AI Basics / AI for Noobs
17. Visualization Lab
18. Supporting product and platform routes
19. Immediate repository and P1 defect backlog
20. Requirement IDs, content manifest, and implementation truth
21. Autonomous Codex delivery protocol
22. Test, quality, and review requirements
23. Final Definition of Done
24. External owner gates and deliberate deferrals
25. Research registry, open decisions, and maintenance
26. Copy-paste Codex Goal launcher

## 0. What this document is

This is the single master goal for completing Engineering Foundry’s repository-defined product and research-backed content. It combines:

- the permanent product architecture;
- completed Deep Research conclusions;
- section-level information architecture;
- lesson and problem catalogs;
- content, source, freshness, privacy, accessibility, and analytics rules;
- implementation sequencing;
- Codex multi-agent operating rules;
- test and release requirements;
- explicit deferrals and external owner gates.

It is intentionally one file so that Codex can use one durable goal rather than depend on chat history. It is **not** permission to put all work into one giant pull request. Codex should use this one goal to produce a series of coherent, independently reviewable branches and pull requests.

This specification controls product and editorial decisions. The live repository controls implementation truth. Current official documentation and primary sources control changing external facts. When those conflict, Codex must not silently choose whichever is easiest.

## 0.1 Precedence rules

Use this order when resolving ambiguity:

1. **Security, privacy, integrity, and data-loss invariants already enforced by the repository.**
2. **This master goal’s product boundaries, curricula, and acceptance criteria.**
3. **Current primary or official sources for facts that can change.**
4. **Existing repository conventions and reusable architecture.**
5. **Secondary sources for teaching context.**
6. **Generic model knowledge only for ordinary implementation mechanics, never as evidence for a product claim.**

A lower-priority source must not override a higher-priority source. Existing code is not automatically correct simply because it exists. This document is not automatically current about vendor versions, company interview processes, prices, laws, model limits, or API behavior; those claims require fresh verification.

## 0.2 Current integration checkpoint

As of the repository integration checkpoint on 2026-09-02:

- PR `#35` merged the historical release-record validation repair at main merge commit `dd9e44ab77bbb26788537fc0abab5e2f7d49c040`.
- PR `#36` merged the anonymous Interview Experience column-privacy repair at main merge commit `af6968d18dec6c7d5bb3ac0be57b49b601227141`.
- PR `#34` was reviewed at final head `4d701df41012fbeefcd70ca6684780abde3f8521` and merged normally at main merge commit `7b7a414053dde308af01a42f2633cfe0a13eaf9c`.
- Static, Database, Production, Dependency Review, JavaScript/TypeScript analysis, and CodeQL checks succeeded on PR `#34`; the main-push Static, Database, Production, and CodeQL lanes also succeeded.
- The check evidence was reverified on 2026-09-02 in the immutable [PR #34 CI run](https://github.com/mayankdhingra02/engineeringfoundry.dev/actions/runs/33594000255), [PR #34 CodeQL run](https://github.com/mayankdhingra02/engineeringfoundry.dev/actions/runs/33594000246), [PR #34 Dependency Review run](https://github.com/mayankdhingra02/engineeringfoundry.dev/actions/runs/33594000313), [main CI run](https://github.com/mayankdhingra02/engineeringfoundry.dev/actions/runs/33594505214), and [main CodeQL run](https://github.com/mayankdhingra02/engineeringfoundry.dev/actions/runs/33594505212).
- The source branches were retained. No production deployment, hosted-service configuration, account enablement, analytics enablement, or generic curriculum expansion occurred during integration.

Codex must still re-fetch GitHub state before every later operation.

- Begin blueprint governance work from the latest verified `main`; do not assume the recorded SHA remains current.
- If branch, check, or base state differs, investigate. Do not reset, overwrite, rebase, or force-push unfamiliar shared work.
- Commit this master specification through its dedicated documentation branch before broader blueprint implementation.
- After the documentation PR merges and main is green, create or refresh the machine-readable requirement manifest, source ledger, and generated coverage report before research-backed curriculum implementation.

## 0.3 Mission

Engineering Foundry must continuously answer four questions for a candidate:

1. **What am I preparing for?**
2. **What should I do next?**
3. **Where should I do it?**
4. **What evidence should change the plan?**

The permanent operating loop is:

```text
Context
  → assess evidence
  → identify uncertainty and gaps
  → prioritize one useful next action
  → learn or practice in the canonical section
  → record trustworthy evidence
  → reprioritize
  → simulate when useful
  → prepare for the actual round
  → debrief and continue
```

Engineering Foundry does not win by publishing the largest interview encyclopedia. It wins by combining technically credible curricula, company and level context, persistent progress, one obvious next action, honest evidence boundaries, private workspaces, and a low-overwhelm interface with depth one click away.

## 0.4 Non-negotiable product principles

1. **Teach interview performance, not passive content consumption.**
2. **Teach transferable decisions and mental models, not famous diagrams or memorized answers.**
3. **Public value must be useful before account creation.**
4. **Completion is not mastery, activity is not capability, and a score is not a hiring probability.**
5. **Official facts, candidate reports, Engineering Foundry recommendations, and user-confirmed process details must remain distinguishable.**
6. **No fabricated users, testimonials, activity, counts, interview reports, questions, traffic, metrics, or outcomes.**
7. **No copied proprietary question corpus, paywalled prose, competitor diagrams, screenshots, or reconstructed confidential prompts.**
8. **Private user content is minimized, purpose-bound, exportable, deletable, and excluded from analytics.**
9. **Every important interaction works with keyboard and assistive technology; timers and media never create an unnecessary barrier.**
10. **Progressive disclosure organizes depth; it does not delete necessary technical substance.**
11. **One strong diagram or interaction is better than decorative animation.**
12. **Every content page must make a decision easier, expose a failure mode, or improve practice transfer.**
13. **Codex must not label missing research content complete merely because a route renders.**
14. **Repository tests must exercise product behavior where practical; source-string checks alone are not sufficient for interactive behavior.**
15. **Production deployment and external configuration are separate owner gates and must never be claimed from repository evidence alone.**

## 0.5 What “finish” means

The goal is complete when:

- all **Required** repository and content items in this document are implemented;
- all section acceptance criteria pass;
- all major public flows are coherent for anonymous and signed-in users;
- the remaining work is only explicitly **Deferred**, **External owner gate**, or **Requires new research approval**;
- canonical local and GitHub validation passes on the final integrated commit;
- no unresolved blocker or high-severity finding remains after independent review.

“Finish” does not mean implementing every speculative idea, every P2 extension, AI for Kids, arbitrary code execution, peer matching, a social network, a paid referral marketplace, or an opaque AI evaluator.

# 1. Product model, users, and section ownership

## 1.1 Primary users

### Entry / SDE I

Needs:

- a clear learning order;
- practical examples that can come from coursework, internships, open source, volunteer work, or personal projects;
- foundational DSA, System Design vocabulary, interview behavior, and truthful behavioral evidence;
- no assumption of management authority or large-company scale;
- guidance for unknown processes and limited experience.

### Mid-level / SDE II

Needs:

- independent ownership and end-to-end delivery evidence;
- stronger DSA transfer, Low-Level Design, System Design, project depth, debugging, and operational reasoning;
- company- and round-specific planning;
- trade-offs, failure recovery, testing, deployment, and cross-functional collaboration;
- preparation that connects multiple interview types.

### Senior Software Engineer

Needs:

- architecture and technical judgment under ambiguity;
- system boundaries, migration, reliability, cost, capacity, organizational influence, and long-term consequences;
- robust project and behavioral deep dives;
- realistic multi-round simulation and context switching;
- level-calibrated follow-ups without assuming people-management authority.

### Staff+ overlay

Staff+ is an overlay, not a separate duplicate curriculum. It increases expectations for:

- direction setting;
- multi-team or multi-system scope;
- durable mechanisms and leverage;
- platform or organizational boundaries;
- migration and long-term evolution;
- auditability, risk, and ownership distribution;
- influencing without formal authority.

It must not equate seniority with longer answers, company brand, team size, or direct reports.

### Adjacent technical roles

The core product remains software-engineering interview preparation. Role overlays may support:

- Software Engineer–ML;
- Machine Learning Engineer;
- Applied Scientist;
- Data Engineer;
- Infrastructure/SRE/Platform Engineer;
- Technical Program Manager;
- Engineering Manager.

An overlay changes emphasis and evidence expectations. It must not create a second copy of every curriculum.

## 1.2 Permanent section boundaries

| Section | Owns | Must not own |
| --- | --- | --- |
| DSA | Algorithms, data structures, patterns, language operating manuals, problem catalog, coding execution, debrief, review. | Company process truth, full interview orchestration, System Design, behavioral story authoring. |
| System Design | Vendor-neutral concepts, patterns, technology deep dives, end-to-end designs, production trade-offs, practice. | ML-specific learning signals, company process claims, generic interview lifecycle planning. |
| ML Design | Product-to-learning formulation, data/labels, models, evaluation, ML infrastructure, serving, experiments, monitoring, responsible ML. | General distributed-systems fundamentals already taught in System Design; company-branded secret architectures. |
| Behavioral | Truthful story bank, question taxonomy, answer construction, follow-ups, self-review, level calibration. | Company process ownership, pass prediction, personality or culture-fit inference. |
| Interview Playbook | Context, uncertainty, planning, next action, round execution, final-week/day, recovery, debrief, cross-section orchestration. | Full specialist curricula, mock-session mechanics, canonical company research, salary strategy. |
| Mock Interviews | Session mechanics, prompts, timers, interviewer interactions, structured self/evaluator feedback, evidence summary. | Choosing the entire preparation plan; declaring hire/no-hire or readiness probability. |
| Company Guides | Current, sourced company/role/level/region process and preparation modifiers. | Generic curricula, scraped proprietary questions, pretending candidate reports are official. |
| Interview Experiences | Moderated first-person high-level reports with provenance, context, date, consent, corrections, and removal. | Copied Glassdoor/Blind/LeetCode content, exact confidential prompts, universal process claims. |
| Low-Level Design | Object and component design: requirements, models, responsibilities, interfaces, invariants, flows, evolution, testability. | High-level distributed architecture and low-level systems/C++ internals. |
| Salary Negotiation | Post-offer package understanding, timing, truthful leverage, scripts, equity, raises, geography, written terms. | Legal, tax, immigration, securities, or individualized financial advice. |
| Applications / Calendar | Actual user-entered interview process, rounds, dates, reminders, and private state. | Canonical company truth or generic learning content. |
| Resources / Search | Discovery across canonical content with source-safe external references. | A content dump or ranking that implies endorsement without criteria. |
| AI Basics | Nontechnical-to-technical AI literacy through visual, interactive lessons. | Replacing ML Design, teaching vendor marketing as truth, or becoming a v1 blocker. |

## 1.3 Cross-section handoff protocol

Every handoff must include:

- a destination that performs the exact recommended action, not merely a generic home page;
- enough context to reconstruct the task;
- a return path or normalized completion/evidence event;
- a clear statement of whether the destination is public, account-backed, or unavailable while accounts are disabled;
- no duplicate factual claim that belongs to another section.

Examples:

- “Practice a timed medium graph problem” opens the DSA browser with the exact configuration.
- “Rehearse requirement clarification” opens a System Design or Mock mode configured for that objective.
- “Prepare a failure story” opens Behavioral with the relevant story category and follow-up family.
- A company round count is rendered from Company Guide evidence, not copied into the Playbook.
- A Mock Evidence Summary returns to the Playbook with evaluator provenance, prompt freshness, hints, and dimension-level observations.

## 1.4 User-facing evidence vocabulary

Use descriptive states rather than false precision:

- **Not observed**
- **Self-reported**
- **Practiced with guidance**
- **Demonstrated independently**
- **Demonstrated in a fresh timed simulation**
- **Needs review**
- **Mixed evidence**
- **Improving across varied attempts**

Do not display “82% ready,” “chance of passing,” “hire/no hire,” or a global mastery number that can be completed by checking boxes.

# 2. Scope labels and implementation statuses

Every requirement in implementation tracking must use one of these statuses:

| Status | Meaning |
| --- | --- |
| `required` | Must be implemented for this master goal to finish. |
| `required-audit` | Existing implementation may satisfy it, but Codex must verify behavior and tests. |
| `implementation-ready` | Research and product decision are sufficient; implementation may proceed. |
| `content-ready` | Curriculum decision is sufficient, but prose/visual assets require editorial production and source verification. |
| `partial` | Meaningful implementation exists but acceptance criteria are incomplete. |
| `research-approval-needed` | This document deliberately does not authorize substantive content creation. |
| `external-owner-gate` | Requires production credentials, legal review, hosted environment, DNS, or another external action. |
| `deferred-p2` | Valuable later, but not required to finish the current goal. |
| `excluded` | Deliberately must not be built. |

Codex must generate a repository-to-spec coverage matrix before implementation. Each row must include:

- requirement ID;
- section and route;
- status;
- current files;
- evidence found;
- missing behavior/content;
- source/freshness needs;
- tests;
- owner/workstream;
- pull request;
- final disposition.

A route existing is not evidence that its lesson, workflow, or accessibility is complete.

# 3. Source, evidence, freshness, and editorial policy

## 3.1 Source hierarchy

For technical and product claims, use:

1. standards, RFCs, original papers, and official public specifications;
2. official technology documentation;
3. first-party engineering or research publications describing real systems;
4. official employer careers/interview/value material;
5. peer-reviewed or authoritative assessment and learning research;
6. respected interview resources for pedagogy and comparative coverage;
7. candidate reports for bounded observations;
8. forums, social posts, and videos for pain points and teaching ideas only.

Competitor content can reveal missing topics or useful interaction patterns. It must not be copied, paraphrased too closely, or used as technical truth when primary sources exist.

## 3.2 Claim classes

Every externally checkable claim should be representable as one of:

- `primary-technical`
- `peer-reviewed`
- `official-employer`
- `first-party-engineering-example`
- `recruiter-or-interviewer-commentary`
- `candidate-reported`
- `secondary-synthesis`
- `engineering-foundry-recommendation`
- `candidate-confirmed-process`

Each claim should be able to carry:

```yaml
claim_id:
statement:
source_class:
source_title:
source_url:
published_or_updated_at:
verified_at:
applicability:
  company:
  role:
  level:
  region:
  stage:
confidence:
  high | medium-high | medium | cautious
volatile: true | false
notes:
```

Do not make one page-level confidence badge hide low-confidence individual claims.

## 3.3 Freshness

Treat these as volatile:

- company interview loops, values, role names, supported languages, and hiring guidance;
- vendor APIs, prices, limits, model names, service features, and security recommendations;
- legal, tax, immigration, employment, securities, and privacy information;
- model context windows, benchmark claims, and hosted-service behavior;
- candidate-reported process patterns.

Rules:

- Verify volatile claims immediately before publication.
- Store exact verification dates.
- Prefer hiding, downgrading, or marking stale content to silently retaining it.
- When official sources conflict, show the conflict or ask the candidate to confirm with recruiting.
- Candidate reports must retain role, level, location, date, and uncertainty where available.
- Stable concepts still require periodic editorial review, but they do not need artificial “latest” wording.

## 3.4 Publishable prose standard

A page should not read like an AI-generated encyclopedia. Apply this editorial sequence:

1. **Decision pass:** What choice does this concept help the candidate make?
2. **Technical adversarial pass:** What guarantee was overstated, what edge case was missed, what is vendor-specific, and what breaks?
3. **Human-voice pass:** Remove generic introductions, duplicated conclusions, unsupported adjectives, and empty “pros and cons.”
4. **Interview pass:** Can the candidate explain why to use it, what it costs, what alternative exists, and what requirement changes the decision?
5. **Source pass:** Are changing claims dated and every documented implementation clearly labeled?
6. **Integrity pass:** Is any example copied, confidential, fabricated, or too close to another publisher?

Preferred reasoning structure:

```text
Problem
  → simplest credible solution
  → why it stops working
  → scalable or safer alternative
  → new failure mode
  → decision rule
  → interviewer twist
```

## 3.5 Intellectual-property rules

- Write original prose.
- Draw original diagrams.
- Do not reproduce competitor screenshots, diagrams, course structure verbatim, paywalled explanations, or solution text.
- External coding problems may be linked by title and canonical URL where legally appropriate; do not republish the full proprietary prompt.
- Prefer Engineering Foundry-original problems and variants for complete in-product practice.
- Candidate reports must be contributor-owned, consented, moderated, and abstracted away from confidential exact questions.
- A public engineering architecture is a documented historical example, not proof of a company’s current private system.

# 4. Shared page, content, and interaction contracts

## 4.1 Learning landing page

Every major learning section landing page must provide:

- a one-sentence purpose;
- “start here” for a new learner;
- “continue” for an existing learner;
- a compact curriculum map;
- role/level or goal paths without forcing onboarding;
- clear separation of lessons, practice, mocks, tools, and sources;
- an honest count derived from current published records;
- a public first useful action;
- no account wall before value;
- one dominant next action;
- mobile-first navigation.

## 4.2 Concept lesson page

A substantial concept page must contain, when relevant:

1. decision-led opening;
2. definition in plain language;
3. interview relevance;
4. prerequisites;
5. memorable mental model;
6. core mechanism or flow;
7. one primary original diagram;
8. simplest example;
9. scaling or production extension;
10. trade-offs;
11. failure modes and debugging clues;
12. decision checklist;
13. common misconceptions;
14. interviewer follow-ups;
15. level calibration;
16. related problems and technologies;
17. one retrieval or application exercise;
18. concise summary;
19. authoritative sources and verification metadata.

A concept page should usually be long enough to let a candidate defend the decision—often around 800–1,500 edited words—but completeness and clarity matter more than a fixed word count.

## 4.3 Technology deep dive

A technology page must begin with the vendor-neutral concepts it implements. It must cover:

- what problems the technology is good at;
- its key data/processing model;
- guarantees and non-guarantees;
- partitioning, ordering, consistency, or durability semantics where applicable;
- scaling and operational constraints;
- failure modes;
- when not to use it;
- how it maps to interview problems;
- a documented implementation example;
- alternatives.

It must not become installation documentation or a feature catalog.

## 4.4 End-to-end design dossier

A System Design or ML Design problem page must include:

- clarified scope and variant choices;
- functional and non-functional requirements;
- assumptions and order-of-magnitude estimates;
- API or decision interface;
- data model and state ownership;
- simplest workable design;
- generalized reference architecture;
- critical request/data/training flow;
- bottleneck or deep-dive choices;
- reliability and degradation;
- security/privacy/abuse;
- rollout, migration, and evolution;
- alternatives;
- senior extensions;
- interviewer follow-ups;
- guided exercise;
- independent version with hidden scaffolding;
- rubric and self-review;
- related concepts;
- sources.

Do not present one architecture as uniquely correct.

## 4.5 Practice surface

Every practice mode must state:

- learning objective;
- support level;
- expected time or no-time mode;
- whether prompt exposure is fresh or repeated;
- allowed hints;
- what evidence is and is not produced;
- how to stop, pause, or request accommodation;
- how the result returns to the Playbook;
- privacy and retention behavior.

Modes:

- **Guided:** teaches; results are not readiness evidence.
- **Independent untimed:** practices transfer with no interviewer.
- **Timed rehearsal:** practices pacing and tooling.
- **Interview-like mock:** structured interaction and follow-ups.
- **Company-shaped:** only when modifiers are sourced and uncertainty is visible.
- **Full-loop:** multiple rounds, transitions, breaks, and delayed debrief.

## 4.6 Interactive tool

A calculator, visualizer, worksheet, or lab must:

- teach a defined concept or decision;
- have a no-JavaScript or textual explanation where practical;
- work with keyboard and screen reader;
- avoid unnecessary animation;
- respect reduced motion;
- not transmit user-entered sensitive data unless the feature explicitly requires and discloses it;
- show units and assumptions;
- handle invalid inputs;
- expose a reset;
- produce no misleading precision;
- have behavioral tests, not only source checks.

## 4.7 Company guide

Every guide must include:

- canonical company name;
- last verified date;
- claim-level source class and confidence;
- role/level/region applicability;
- official process/guidance;
- candidate-reported variation;
- Engineering Foundry preparation recommendations;
- coding, practical/LLD, System Design, conditional ML Design, Behavioral/values, project-depth, and level sections as evidence supports;
- relevant public practice links;
- moderated interview experiences;
- uncertainty and recruiter-confirmed override guidance;
- sources.

Never show unsupported preparation percentages.

## 4.8 Public contributor report

A public interview experience must include only consented, moderated fields such as:

- company;
- role and level;
- broad region;
- month/year;
- high-level stages;
- topic families;
- timing;
- preparation lessons;
- contributor identity choice;
- provenance and moderation state;
- correction/removal path.

Exact confidential prompts, interviewer identities, private links, discriminatory personal information, and employer-prohibited material must be rejected or abstracted.

## 4.9 Planner / next-action card

A next-action card must include:

- the action;
- why it is recommended now;
- evidence or context that caused the recommendation;
- expected outcome;
- estimated effort as a range or category;
- the exact destination;
- a reasonable alternative;
- source/confidence for any company modifier;
- an option to skip, reduce, reschedule, or correct assumptions.

## 4.10 Completion and evidence event

A normalized completion event must distinguish:

- page viewed;
- lesson meaningfully completed;
- problem attempted;
- assisted completion;
- independent completion;
- fresh timed completion;
- self-review completed;
- mock evidence returned;
- manual self-report;
- imported historical activity.

No event should carry private prose, code, stories, application notes, offer values, report drafts, or secret identifiers.

# 5. Shared UX, accessibility, privacy, analytics, SEO, and engineering quality

## 5.1 Information hierarchy

- Every page has one primary task.
- The primary action is visible without scrolling on ordinary mobile and desktop layouts.
- Secondary depth is progressively disclosed.
- Large catalogs provide search, filters, and a recommended path.
- Empty states state why data is absent and what the user can do next.
- “Coming soon” pages are noindex and never impersonate finished content.
- Account-disabled routes do not lead users into dead forms. They either offer a useful public equivalent or clearly explain availability.
- Browser Back and Forward restore filters and visible state.
- Escape closes overlays and returns focus to the control that opened them.
- Search must not steal focus while closed.

## 5.2 Accessibility target

Use the repository’s established accessibility target and reverify current standards before release. At minimum:

- semantic landmarks and headings;
- programmatic labels, instructions, errors, and status;
- visible focus;
- predictable focus restoration;
- full keyboard operation;
- sufficient contrast;
- usable at 200% text zoom and narrow viewport;
- touch targets suitable for mobile;
- reduced-motion support;
- no essential meaning conveyed by color alone;
- captions/transcripts for media;
- no required voice or camera;
- timers can be paused, disabled, or extended when the mode is educational;
- screen-reader announcements are concise and not noisy;
- tables and diagrams have textual alternatives;
- no scoring of accent, eye contact, facial affect, speaking style, charisma, or filler-word count.

## 5.3 Privacy

Private by default:

- applications and rounds;
- behavioral stories and answer variants;
- private practice notes;
- mock reflections;
- interview-day incident notes;
- salary worksheet content;
- draft interview experiences;
- profile and account data.

Rules:

- collect only what the feature needs;
- use actor-derived identity at server boundaries;
- preserve RLS and controlled mutation paths;
- exclude private routes and values from analytics;
- never log secrets or private content;
- make export/delete behavior truthful and tested;
- do not train models on private user data without a separate affirmative opt-in;
- disclose clipboard, localStorage, browser-session, server storage, and AI processing accurately;
- raw audio/video should not be retained by default if later introduced.

## 5.4 Analytics

Use analytics to improve product value, not manufacture success.

Core metrics:

- first useful action rate;
- track-start rate;
- lesson/practice start and meaningful completion;
- continue-preparation use;
- active-plan adoption and continuation;
- seven-day returning learner rate;
- mock session and reflection completion;
- interview-experience submission-to-approval conversion;
- company-guide-to-practice conversion;
- anonymous-to-account conversion after value;
- content correction and stale-source rate.

Guardrails:

- errors and failed saves;
- mobile drop-off;
- accessibility defects;
- moderation turnaround;
- privacy/security incidents;
- export/delete failures;
- stale content;
- AI feedback disagreement.

Do not optimize primarily for:

- daily streaks;
- raw time on page;
- Discord count;
- total problems solved;
- total pages;
- leaderboard position;
- inflated “readiness.”

Events must be typed, allowlisted, value-minimized, and behaviorally tested.

## 5.5 Search and SEO

- Build crawlable internal links.
- Use descriptive titles, headings, metadata, breadcrumbs, sitemap entries, robots rules, and canonical URLs.
- Structured data must describe visible content; never add schema solely to chase rankings.
- Do not create large numbers of thin AI-generated pages.
- Important educational content cannot exist only inside a client-only widget.
- Route aliases require redirects and canonical metadata.
- Search indexes only published, public, non-stale content.
- Search results identify content type, level, and status.
- Filters must remain URL-restorable without remounting or focus loss.

## 5.6 Performance

- Do not ship the editor, visualization runtime, Mermaid, or large data payload to pages that do not need them.
- Lazy-load expensive interactive modules.
- Keep primary page content server-rendered or statically rendered where freshness permits.
- Dynamic public data must use explicit request-time or bounded-revalidation behavior.
- Avoid layout shift, hydration mismatch, and unnecessary client boundaries.
- Measure real production performance as an external gate; repository build size and route behavior are necessary but not sufficient.

## 5.7 Test quality

Required test layers:

- pure unit tests for decision and normalization logic;
- data-contract and content validators;
- component or rendered-browser tests for interactive state, focus, URL synchronization, forms, and accessibility;
- route and metadata tests;
- public-link validation;
- privacy and analytics tests;
- database/RLS/RPC tests;
- production build;
- local and hosted smoke tests;
- CI checks.

Rules:

- Every `test:` command belongs in the canonical static inventory unless intentionally classified elsewhere.
- A source-string assertion may protect a static contract, but it cannot be the only proof of runtime behavior.
- Tests must not implement a second algorithm that production code does not use.
- Do not weaken or skip a failing check merely because it blocks a feature branch.
- Environmental failures must be distinguished from source failures and confirmed in canonical GitHub CI.

# 6. System Design specification

## 6.1 Product purpose

System Design must teach candidates to compose systems from reusable concepts and defend decisions under ambiguity. It must not be a flat glossary and must not be a collection of famous architectures to memorize.

Permanent information architecture:

```text
System Design
├── Getting Started
├── Foundations
├── Networking & APIs
├── Data & Storage
├── Caching
├── Messaging & Streaming
├── Reliability
├── Observability, Security & Operations
├── Common Patterns
├── Specialized Building Blocks
├── Technology Deep Dives
├── Practice Designs
└── Advanced Topics
```

The learning graph is:

```text
Foundation decision
  → vendor-neutral concept
  → composition pattern
  → concrete technology example
  → full design problem
  → timed practice and debrief
```

Kafka must not sit beside Caching as the same type of topic. Redis must not replace the lesson on caching. Concepts explain the decision; technologies show one implementation.

## 6.2 Route and navigation contract

Preferred conceptual routes are shown below. Codex must audit the existing router before renaming anything and should preserve stable URLs with redirects.

```text
/system-design
/system-design/start-here/[slug]
/system-design/concepts/[slug]
/system-design/patterns/[slug]
/system-design/technologies/[slug]
/system-design/problems
/system-design/problems/[slug]
/system-design/practice
/system-design/plan
/system-design/rubric
/system-design/glossary
```

The landing page must provide:

- Start Here;
- continue current lesson or problem;
- role/level path;
- concepts, patterns, technologies, and problems as distinct surfaces;
- a recommended core path;
- plan and practice entry;
- published counts derived from manifests;
- an honest unavailable state for researched/draft/needs-research records;
- no giant ungrouped sidebar.

## 6.3 System Design interview framework

Teach a flexible interview flow:

```text
Clarify users and scope
  → functional requirements
  → non-functional requirements and constraints
  → estimate only what changes the design
  → define APIs and core data
  → draw the simplest end-to-end design
  → identify bottlenecks
  → deepen one or two important areas
  → reliability, security, operations, and cost
  → alternatives, evolution, and concise close
```

This is a map, not a minute-by-minute script. Company-specific durations are modifiers. Candidates should be able to explain assumptions, accept interviewer redirection, recover from a mistake, and close partial work honestly.

## 6.4 Required curriculum map

| Area | Topic | Priority | Required learner outcome | Required asset |
| --- | --- | --- | --- | --- |
| Getting Started | How System Design Interviews Work | Required | Understand collaborative problem framing, interviewer redirection, breadth-versus-depth, and how evaluation differs by level. | Interview flow diagram + annotated mini-answer |
| Getting Started | A Framework for Any Design | Required | Use a reusable sequence without treating it as a rigid script. | Interactive checklist that can collapse during timed practice |
| Getting Started | Functional vs Non-Functional Requirements | Required | Separate product behavior from latency, scale, reliability, durability, consistency, cost, security, and compliance constraints. | Requirement sorting exercise |
| Getting Started | Back-of-the-Envelope Estimation | Required | Estimate average/peak QPS, storage, bandwidth, fan-out, and headroom with units and architectural consequences. | Worked example then capacity calculator |
| Getting Started | Trade-offs and Decision Records | Required | State the requirement that makes a choice preferable and the downside accepted. | Decision matrix exercise |
| Foundations | Latency vs Throughput | Required | Reason about response time, queueing, capacity, batching, and tail latency. | Latency budget and queue visual |
| Foundations | Vertical vs Horizontal Scalability | Required | Know when scale-up stops helping and what distributed state introduces. | Before/after topology |
| Foundations | Availability | Required | Connect redundancy, failover, dependency availability, and tolerated downtime. | Dependency availability tree |
| Foundations | Reliability | Required | Distinguish correct service over time from simple uptime. | Failure scenario comparison |
| Foundations | Durability | Required | Explain persistence, replication, backups, acknowledgments, and acceptable data loss. | Write acknowledgment timeline |
| Foundations | Fault Tolerance | Required | Continue or degrade through component failure and avoid correlated failure. | Failure injection flow |
| Foundations | Bottlenecks and Saturation | Required | Locate CPU, memory, network, disk, database, queue, lock, hot-key, and dependency bottlenecks. | Bottleneck diagnosis lab |
| Foundations | Orders of Magnitude | P1 | Use approximate hardware/network/storage intuition without brittle memorization. | Reference card with dated assumptions |
| Networking & APIs | Request Journey: Client to Service | Required | Trace DNS, connection, TLS, proxy, load balancer, application, cache, and datastore. | Request journey diagram |
| Networking & APIs | DNS | Required | Understand lookup, caching, TTL, failover limitations, and global routing role. | Resolution timeline |
| Networking & APIs | HTTP and HTTPS | Required | Reason about methods, status, headers, connection reuse, caching, TLS, and proxies. | Request/response inspector |
| Networking & APIs | TCP vs UDP | P1 | Choose reliable ordered streams versus lower-overhead datagrams based on application behavior. | Packet behavior comparison |
| Networking & APIs | REST API Design | Required | Model resources, operations, errors, versioning, pagination, and idempotency. | API critique exercise |
| Networking & APIs | Pagination | Required | Compare offset, cursor, time, and keyset pagination under mutation and scale. | Mutable-list pagination visual |
| Networking & APIs | Idempotency | Required | Make retries safe through keys, dedupe state, and operation semantics. | Payment retry timeline |
| Networking & APIs | gRPC and RPC | P1 | Understand typed contracts, streaming, compatibility, and internal-service trade-offs. | REST/RPC decision table |
| Networking & APIs | GraphQL | P1 | Understand flexible query surfaces, resolver fan-out, authorization, caching, and complexity controls. | Resolver execution graph |
| Networking & APIs | Polling, Long Polling, SSE, WebSockets | Required | Choose a real-time delivery mechanism from directionality, frequency, connection count, and reliability needs. | Mechanism comparison + connection flow |
| Networking & APIs | Forward and Reverse Proxies | Required | Distinguish client-side and server-side mediation, routing, security, and caching. | Topology comparison |
| Networking & APIs | Load Balancing | Required | Understand L4/L7 routing, health, capacity, affinity, failover, and algorithms. | Request distribution simulator |
| Networking & APIs | Health Checks and Draining | Required | Separate liveness/readiness, remove unhealthy nodes safely, and avoid retry storms. | Node lifecycle timeline |
| Networking & APIs | Sticky Sessions | P1 | Understand affinity, state coupling, rebalance problems, and alternatives. | Session placement visual |
| Networking & APIs | API Gateway | Required | Place auth, quotas, routing, policy, aggregation, and observability without centralizing business logic. | Gateway boundary diagram |
| Networking & APIs | Service Discovery | P1 | Resolve changing service endpoints and understand client/server-side discovery. | Registry update flow |
| Networking & APIs | CDN and Edge Delivery | Required | Cache and route static/dynamic content near users while managing invalidation and origin protection. | Edge miss flow |
| Networking & APIs | Global and Multi-Region Routing | P1 | Choose active/passive or active/active traffic patterns and understand locality/failover. | Region routing map |
| Networking & APIs | Rate Limiting | Required | Choose token bucket, leaky bucket, fixed/sliding windows, keys, storage, and failure behavior. | Token-bucket simulator |
| Networking & APIs | TLS Termination and Trust Boundaries | P1 | Place encryption boundaries and protect internal hops/secrets. | Trust-boundary diagram |
| Data & Storage | Data Modeling from Access Patterns | Required | Derive entities, relationships, invariants, read/write paths, and indexes from the product. | Access-pattern worksheet |
| Data & Storage | SQL vs NoSQL | Required | Choose by transactions, query flexibility, scale pattern, consistency, operations, and evolution—not fashion. | Decision matrix |
| Data & Storage | Relational Databases | Required | Understand schema, constraints, joins, transactions, indexes, and replication role. | Logical-to-physical model |
| Data & Storage | Key-Value Stores | Required | Model primary-key access, partitioning, limited queries, TTL, and scale. | Partitioned key-space visual |
| Data & Storage | Document Stores | P1 | Use aggregate-oriented documents while managing duplication, indexes, and update semantics. | Document modeling exercise |
| Data & Storage | Wide-Column Stores | P1 | Model partition and clustering keys around queries and avoid hot partitions. | Partition-key lab |
| Data & Storage | Indexes | Required | Understand lookup acceleration, write/storage cost, selectivity, covering behavior, and query planning. | Index selection exercise |
| Data & Storage | Composite and Secondary Indexes | P1 | Order index keys around filters/sorts and understand maintenance cost. | Query/index matching |
| Data & Storage | B-Trees and LSM Trees | P1 | Use enough storage-engine intuition to explain read/write amplification and workload fit. | Read/write path comparison |
| Data & Storage | Transactions and ACID | Required | Protect invariants across multiple operations while understanding scope and cost. | Reservation transaction flow |
| Data & Storage | Isolation and Concurrency Control | P1 | Recognize dirty/non-repeatable/phantom behavior and optimistic/pessimistic strategies. | Concurrent timeline |
| Data & Storage | Replication | Required | Explain leader/follower replication, acknowledgments, lag, read scaling, and failover. | Replication timeline |
| Data & Storage | Multi-Leader and Leaderless Replication | P1 | Reason about conflicts, quorums, locality, and application complexity. | Write conflict example |
| Data & Storage | Read Replicas and Replication Lag | Required | Understand stale reads, read-your-writes, lag monitoring, and routing. | Lag visual |
| Data & Storage | Sharding and Partitioning | Required | Choose a shard key, route requests, distribute load, and plan rebalancing. | Shard map |
| Data & Storage | Hash vs Range Partitioning | Required | Trade locality against balance and hotspot risk. | Key-distribution comparison |
| Data & Storage | Hot Keys and Hot Partitions | Required | Diagnose skew and use salting, caching, replication, splitting, or workload redesign. | Heat-map lab |
| Data & Storage | Consistent Hashing | Required | Minimize key movement while adding/removing nodes and understand virtual nodes. | Interactive consistent-hash ring |
| Data & Storage | Consistency Models | Required | Distinguish strong, eventual, read-your-writes, monotonic, causal, and session guarantees where relevant. | Read timeline |
| Data & Storage | CAP and Network Partitions | Required | Reason about behavior during partitions without reducing CAP to a database shopping slogan. | Partition decision exercise |
| Data & Storage | PACELC | P2 | Extend consistency/latency reasoning to normal operation. | Latency/consistency matrix |
| Data & Storage | Denormalization and Materialized Views | P1 | Precompute read models while owning update, staleness, and rebuild paths. | Write-to-read-model flow |
| Data & Storage | Unique ID Generation | Required | Compare database IDs, UUIDs, time-sortable IDs, counters, and distributed generators. | Collision/order trade-off |
| Data & Storage | Object and Blob Storage | Required | Separate metadata from large objects; use multipart upload, checksums, lifecycle, CDN, and access control. | Direct upload flow |
| Data & Storage | Presigned Upload and Download | P1 | Avoid proxying large files while preserving authorization and expiry. | Signed URL sequence |
| Data & Storage | Change Data Capture and Outbox | P1 | Move database changes into event pipelines without dual-write loss. | Transaction/outbox/relay timeline |
| Data & Storage | Backup, Restore, and Disaster Recovery | Required | Define RPO/RTO, backup consistency, restore testing, and regional failure strategy. | Recovery decision table |
| Caching | Caching Fundamentals | Required | Decide what to cache, where, for how long, and what staleness is acceptable. | Cache request animator |
| Caching | Cache-Aside | Required | Understand hit/miss/fill behavior and race conditions. | Read flow |
| Caching | Read-Through, Write-Through, Write-Behind | Required | Compare ownership, latency, durability, and consistency. | Strategy comparison |
| Caching | TTL and Invalidation | Required | Combine time-based expiry with event/version invalidation and define correctness. | Stale-data timeline |
| Caching | Eviction Policies | Required | Understand capacity pressure and workload effects of LRU/LFU/random/TTL. | Eviction simulator |
| Caching | Distributed Cache | Required | Partition, replicate, route, and fail over cache nodes. | Cluster topology |
| Caching | Cache Stampede and Dogpile | Required | Use request coalescing, jitter, stale-while-revalidate, and admission control. | Stampede animator |
| Caching | Hot Keys | Required | Detect and mitigate concentrated load without merely scaling the whole cluster. | Key heat map |
| Caching | Negative Caching and Bloom Filters | P1 | Avoid repeated misses while managing false positives and stale absence. | Miss path visual |
| Caching | Cache Consistency and Versioning | P1 | Prevent stale writes and schema incompatibility across deploys. | Versioned key migration |
| Messaging & Streaming | Asynchronous Processing | Required | Move slow/retryable work off the request path while defining completion and failure. | Sync-to-async transformation |
| Messaging & Streaming | Message Queues | Required | Buffer work, decouple producers/consumers, and handle retries and visibility. | Queue-worker flow |
| Messaging & Streaming | Publish/Subscribe | Required | Fan events to independent consumers while owning subscriber failures. | Topic/subscriber diagram |
| Messaging & Streaming | Event Streams | Required | Treat ordered append-only logs as durable replayable history where appropriate. | Partitioned log visual |
| Messaging & Streaming | Partitions and Consumer Groups | Required | Scale consumers while preserving order within a partition. | Interactive ownership/rebalance animator |
| Messaging & Streaming | Ordering | Required | Define global, partition, entity, or no ordering and understand throughput cost. | Ordering scope exercise |
| Messaging & Streaming | Delivery Semantics | Required | Explain at-most-once, at-least-once, effective exactly-once, dedupe, and side effects. | Duplicate delivery timeline |
| Messaging & Streaming | Retries and Backoff | Required | Use bounded retries, jitter, idempotency, and retry budgets. | Retry storm simulator |
| Messaging & Streaming | Dead-Letter Queues | Required | Quarantine poison messages with diagnosis and replay procedures. | Failure routing flow |
| Messaging & Streaming | Backpressure and Load Shedding | Required | Prevent queues and dependencies from unbounded overload. | Queue depth/latency graph |
| Messaging & Streaming | Event-Driven Architecture | Required | Define event ownership, schemas, consumers, failure, and evolution without hidden coupling. | Event map |
| Messaging & Streaming | Batch vs Streaming | P1 | Choose freshness and processing semantics based on product needs and operational cost. | Latency/cost comparison |
| Messaging & Streaming | Stream Processing and Event Time | P1 | Understand windows, late events, watermarks, state, and reprocessing. | Late-event timeline |
| Messaging & Streaming | Event Schema Evolution | P1 | Maintain compatibility and replayability across producer/consumer versions. | Version compatibility matrix |
| Reliability | Timeouts | Required | Bound waiting and allocate deadlines across dependencies. | Deadline budget |
| Reliability | Retries, Backoff, and Jitter | Required | Retry only safe/transient work and avoid synchronized amplification. | Retry timeline |
| Reliability | Circuit Breakers | Required | Stop repeated calls to an unhealthy dependency and probe recovery. | State-machine visual |
| Reliability | Bulkheads and Isolation | P1 | Prevent one workload or tenant from exhausting shared resources. | Resource pool diagram |
| Reliability | Failover | Required | Detect failure, choose authority, preserve data, and avoid split brain. | Failover sequence |
| Reliability | Graceful Degradation | Required | Preserve core value through fallbacks, stale data, partial results, or disabled features. | Dependency-failure choices |
| Reliability | Load Shedding and Admission Control | Required | Reject work deliberately before collapse and protect high-priority traffic. | Capacity threshold simulator |
| Reliability | Distributed Locks and Leases | Required | Coordinate ownership while understanding expiry, fencing, and stale holders. | Lease/fencing timeline |
| Reliability | Leader Election | P1 | Choose a coordinator and handle failover, terms, and stale leaders. | Lease/leader visual |
| Reliability | Distributed Transactions | P1 | Understand atomic commit limits and when to redesign boundaries. | 2PC failure flow |
| Reliability | Sagas and Compensating Actions | P1 | Coordinate long-running business workflows with explicit failure semantics. | Saga timeline |
| Reliability | Multi-Region Systems | P1 | Reason about data locality, writes, replication, failover, conflicts, and cost. | Region topology |
| Reliability | Thundering Herd | Required | Prevent synchronized reconnect, refill, retry, and scheduled-work spikes. | Herd visualization |
| Reliability | Dependency Failure and Fallback | Required | Define behavior for cache, DB, queue, search, third-party, and region failure. | Failure matrix |
| Reliability | Capacity Planning and Headroom | P1 | Connect growth, peak, failover capacity, and overload tests. | Headroom calculator |
| Reliability | Schema and Data Migration | P1 | Use backward-compatible expansion/contraction, backfills, verification, and rollback. | Migration phases |
| Reliability | Incident Recovery and Postmortems | P1 | Design detection, mitigation, communication, recovery, and durable prevention. | Incident lifecycle |
| Observability & Operations | Logs, Metrics, and Traces | Required | Choose signals by question and correlate request, dependency, and business behavior. | Trace waterfall |
| Observability & Operations | SLIs, SLOs, and Error Budgets | Required | Define user-relevant reliability targets and use them in trade-offs. | SLO worksheet |
| Observability & Operations | Alerting | Required | Alert on actionable symptoms with routing, dedupe, and escalation. | Alert quality exercise |
| Observability & Operations | Distributed Monitoring | P1 | Aggregate and query high-cardinality signals without losing context. | Telemetry pipeline |
| Observability & Operations | Security Threat Modeling | Required | Identify assets, actors, boundaries, abuse paths, and mitigations. | Threat-model worksheet |
| Observability & Operations | Authentication vs Authorization | Required | Separate identity from allowed action and enforce at each trust boundary. | Request policy flow |
| Observability & Operations | Secrets and Key Management | P1 | Avoid source/config leaks, rotate keys, and limit blast radius. | Secret lifecycle |
| Observability & Operations | Abuse Prevention | Required | Combine rate limits, quotas, anomaly signals, moderation, and appeal where relevant. | Defense-in-depth map |
| Observability & Operations | Cost and Efficiency | Required | Connect traffic, storage, egress, replicas, compute, and complexity to design choices. | Cost-driver worksheet |
| Observability & Operations | Operational Ownership | P1 | Define who deploys, monitors, responds, migrates, and deprecates each component. | Ownership map |
| Common Patterns | Scaling Reads | Required | Use caching, replicas, materialized views, partitioning, and async work with consistency trade-offs. | Pattern decision tree |
| Common Patterns | Scaling Writes | Required | Partition, batch, buffer, append, and relax coordination while protecting invariants. | Write path comparison |
| Common Patterns | Read-Heavy Architectures | Required | Optimize read amplification and freshness deliberately. | Reference flow |
| Common Patterns | Write-Heavy Architectures | Required | Manage ingestion, compaction, batching, and downstream views. | Reference flow |
| Common Patterns | Real-Time Updates | Required | Choose transport, state synchronization, reconnect, fan-out, and ordering. | Mechanism decision tree |
| Common Patterns | Fan-Out on Write vs Read | Required | Choose where amplification occurs and handle high-fanout users. | Fan-out animator |
| Common Patterns | Long-Running Jobs | Required | Use object storage, queues, workers, progress, retries, and notifications. | Job lifecycle |
| Common Patterns | Large File Handling | Required | Use chunking, resumability, dedupe, checksums, object storage, and CDN. | Upload/processing flow |
| Common Patterns | Contention and Reservations | Required | Protect scarce inventory with transactions, locks, holds, expiration, and idempotency. | Reservation race |
| Common Patterns | Multi-Step Workflows | P1 | Model state, compensation, retries, and human/manual steps. | Workflow state machine |
| Common Patterns | CQRS | P1 | Separate write and read models only when differing needs justify complexity. | Command/read-model flow |
| Common Patterns | Event Sourcing | P2 | Understand append-only state history, replay, projections, and operational cost. | Event-to-state replay |
| Common Patterns | Hot-Key Mitigation | Required | Recognize skew and select caching, splitting, replication, or product controls. | Decision lab |
| Common Patterns | Multi-Region Read/Write | P1 | Choose region affinity and conflict strategy. | Region pattern comparison |
| Common Patterns | Graceful Degradation | Required | Prioritize core user outcomes and make fallbacks explicit. | Fallback ladder |
| Common Patterns | Backfill and Rebuild | P1 | Recompute derived state safely while live traffic continues. | Dual-read/backfill flow |
| Common Patterns | Control Plane vs Data Plane | P1 | Separate configuration/lifecycle operations from hot-path serving. | Plane boundary diagram |
| Common Patterns | Multi-Tenancy | P1 | Choose isolation, quotas, noisy-neighbor protection, and data boundaries. | Tenant isolation options |
| Specialized Building Blocks | Full-Text Search | Required | Use inverted indexes, relevance, sharding, freshness, and ranking. | Index/query flow |
| Specialized Building Blocks | Geospatial Search | P1 | Use grid/geohash/tree concepts, nearby expansion, updates, and accuracy trade-offs. | Interactive spatial grid |
| Specialized Building Blocks | Task Scheduling | Required | Handle delayed/recurring jobs, ownership, retries, and missed executions. | Scheduler timeline |
| Specialized Building Blocks | Notification Delivery | Required | Model preferences, templates, fan-out, channels, retries, rate limits, and dedupe. | Delivery pipeline |
| Specialized Building Blocks | Leaderboards and Top-K | Required | Choose sorted sets, heaps, precomputation, partitioning, and update semantics. | Rank update visual |
| Specialized Building Blocks | Counters and Aggregation | Required | Scale high-write counters using sharding, approximation, and windows. | Sharded counter |
| Specialized Building Blocks | Autocomplete | Required | Serve prefix suggestions under extreme latency with freshness, safety, and ranking. | Trie/top-K flow |
| Specialized Building Blocks | Time-Series Data | P1 | Model high-volume timestamped data, retention, rollups, and query patterns. | Downsampling pipeline |
| Specialized Building Blocks | Web Crawling | Required | Schedule, dedupe, respect policies, fetch, parse, retry, and index at scale. | Crawler frontier |
| Specialized Building Blocks | Media Processing | Required | Upload, store, queue, transcode, publish, and serve large media. | Video pipeline |
| Specialized Building Blocks | Collaborative Editing | P1 | Model concurrent changes, ordering, conflict resolution, presence, and history. | Operation timeline |
| Specialized Building Blocks | Payments and Ledgers | Required | Separate payment orchestration from immutable accounting, retries, reconciliation, and disputes. | Ledger/payment flow |
| Technology Deep Dives | Redis | Required | Map caching, counters, sorted sets, ephemeral state, locks, streams, and operational limits. | Data-structure and failure map |
| Technology Deep Dives | Apache Kafka | Required | Map logs, partitions, consumer groups, ordering, retention, replay, and delivery behavior. | Partition/consumer animator |
| Technology Deep Dives | PostgreSQL | Required | Use relational modeling, transactions, indexes, replication, extensions, and operational trade-offs. | Query/index/replication map |
| Technology Deep Dives | DynamoDB | Required | Design key access, partitions, secondary indexes, capacity, consistency, and hot-key mitigation. | Access-pattern table |
| Technology Deep Dives | Elasticsearch / OpenSearch | Required | Understand inverted indexes, shards, relevance, updates, aggregation, and operational cost. | Index lifecycle |
| Technology Deep Dives | S3 / Object Storage | Required | Use durable object storage, multipart upload, lifecycle, events, and CDN integration. | Object lifecycle |
| Technology Deep Dives | Cassandra / Wide-Column | P1 | Model partitions, clustering, replication, consistency, tombstones, and repair. | Data model example |
| Technology Deep Dives | RabbitMQ / SQS | P1 | Compare work queues, acknowledgments, visibility, routing, and managed semantics. | Queue comparison |
| Technology Deep Dives | etcd / ZooKeeper | P1 | Understand coordination, leases, watches, metadata, and failure boundaries. | Coordination flow |
| Technology Deep Dives | Flink / Stream Processor | P1/P2 | Understand stateful event-time processing, checkpoints, late data, and exactly-once scope. | Checkpoint timeline |
| Advanced Topics | Consensus and Raft Intuition | P1/P2 | Reason about terms, leaders, replicated logs, majority, and safety without implementing the paper. | Term/log animator |
| Advanced Topics | CRDTs and Operational Transformation | P2 | Understand conflict-free or transformed concurrent updates and product constraints. | Concurrent edit example |
| Advanced Topics | Bloom Filters | P1 | Use probabilistic membership to avoid expensive lookups while accepting false positives. | Bit-array simulator |
| Advanced Topics | HyperLogLog and Approximate Counting | P2 | Trade small memory for approximate cardinality. | Accuracy/memory visual |
| Advanced Topics | Count-Min Sketch and Heavy Hitters | P2 | Estimate frequencies in streams and understand error bounds conceptually. | Stream sketch visual |
| Advanced Topics | Vector Databases | P1/P2 | Understand embedding retrieval, ANN, metadata filters, freshness, and index/model coupling. | Vector search lifecycle |
| Advanced Topics | LLM and AI Serving Infrastructure | P1/P2 | Reason about model serving, batching, KV cache, streaming, rate limits, cost, fallbacks, and safety. | Inference data plane |
| Advanced Topics | Distributed File Systems | P1 | Understand blocks, metadata, replication, locality, and recovery. | Metadata/data-node topology |
| Advanced Topics | Quorum Systems | P1 | Reason about read/write quorums, overlap, latency, and stale/conflicting replicas. | Quorum visual |
| Advanced Topics | Storage and Compute Separation | P1 | Understand independent scaling, caching, remote I/O, and failure/cost implications. | Disaggregated architecture |

## 6.5 Practice design catalog

The practice catalog should cover distinct architectural modes. Variants belong inside a canonical page unless the dominant state, scaling pattern, or correctness problem changes.

| Design | Priority | Signature decisions |
| --- | --- | --- |
| URL Shortener | Required | ID generation, read-heavy KV access, cache, redirects, abuse, expiration. |
| Distributed Rate Limiter | Required | Keys, token bucket/window algorithms, distributed state, atomicity, fail-open/closed. |
| News Feed / Home Feed | Required | Fan-out, ranking, celebrity/hot users, cache, pagination, freshness. |
| Chat / Messaging | Required | WebSockets, message persistence, ordering, presence, delivery status, fan-out. |
| Video Platform | Required | Large upload, object storage, queues, transcoding, metadata, CDN, rights/abuse. |
| Dropbox / File Sync | Required | Chunking, dedupe, metadata, conflict, resumability, sync, object storage. |
| Notification System | Required | Preferences, templates, channels, queues, retries, dedupe, fan-out, provider failure. |
| Web Crawler | Required | Frontier, politeness, scheduling, dedupe, failure, parsing, indexing. |
| Search Autocomplete | Required | Prefix retrieval, Top-K, trends, caching, freshness, personalization, safety. |
| Nearby / Uber / Yelp | Required | Geospatial partitioning, moving entities, search radius, freshness, load. |
| Ticketing / Reservations | Required | Contention, holds, expiration, transactions, idempotency, oversell prevention. |
| Leaderboard | Required | Sorted sets, Top-K, rank lookup, sharding, update volume, seasonal resets. |
| Metrics / Time-Series Platform | Required | High-volume ingestion, aggregation, retention, query, cardinality, alerts. |
| Job Scheduler | Required | Delayed and recurring execution, ownership, retries, dedupe, missed schedules. |
| Payment System | Required | Idempotency, orchestration, ledger, reconciliation, failure, refunds/disputes. |
| Collaborative Document Editor | P1 | Concurrent operations, history, presence, snapshots, conflict resolution. |
| Distributed Key-Value Store | P1 | Partitioning, replication, consistency, failure detection, rebalancing. |
| Distributed Message Queue | P1 | Partitions, ordering, consumer groups, visibility, durability, backpressure. |
| Object Storage | P1 | Metadata, large objects, replication/erasure, multipart, lifecycle, consistency. |
| Ad Click Aggregator | P1 | Streaming ingestion, dedupe, windows, late data, aggregation, serving. |
| Deployment / CI System | P1 | Control plane, workers, artifacts, isolation, scheduling, logs, rollback. |
| Stock Exchange / Matching Engine | P2 | Strict ordering, low latency, durability, partitioning limits, market data. |
| Wallet / Ledger Service | P1 | Double-entry ledger, transactions, balance projection, reconciliation. |
| Webhook Delivery Platform | P1 | Subscriptions, signing, retries, ordering, backoff, tenant quotas. |
| Feature Flag Control Plane | P1 | Configuration distribution, targeting, consistency, caching, audit, rollback. |
| AI Assistant / ChatGPT-like Service | P1/P2 | Streaming, conversation state, model routing, retrieval/tools, cost, safety, rate limits. |

Each problem must expose:

- a core generalized architecture;
- at least one meaningful variant;
- a “what breaks first?” section;
- one quantitative estimate whose result changes a decision;
- one reliability failure exercise;
- one senior extension;
- a guided version and an independent prompt;
- no copied proprietary answer.

## 6.6 Required reusable visuals

Build custom interactive visuals only where temporal or spatial behavior is the lesson:

1. consistent-hashing ring;
2. cache hit/miss/stale/stampede animator;
3. token-bucket rate limiter;
4. partition and consumer-group reassignment;
5. replication lag/read-your-writes timeline;
6. fan-out-on-write versus fan-out-on-read;
7. lease/leader/fencing timeline;
8. geospatial grid/ring search.

Use Mermaid or original static SVG for ordinary component architecture, request flow, CDC/outbox, saga, object upload, search indexing, and multi-region topology.

Every diagram caption must answer a precise sentence, such as:

> This diagram shows how a cache miss reaches the database, populates the cache, and creates a stampede risk.

## 6.7 System Design rubric

Use dimension-level descriptive feedback:

- requirement framing;
- estimation and constraints;
- API/data ownership;
- architecture coherence;
- depth and bottleneck analysis;
- reliability and degradation;
- security, operations, and cost;
- trade-off reasoning;
- communication and adaptation;
- seniority-appropriate scope.

Bands:

- **Needs evidence:** missing or contradictory.
- **Developing:** plausible but shallow or unconnected.
- **Strong:** coherent, requirement-driven, and failure-aware.
- **Exceptional:** compares alternatives, anticipates evolution, and manages system/organizational boundaries.

Do not convert the rubric into a pass probability.

## 6.8 System Design acceptance criteria

- Every Required topic is either published at full page contract or explicitly tracked as incomplete; no placeholder is called complete.
- Concepts, patterns, technologies, and problems remain separate but cross-linked.
- Every Required practice design uses distinct signature decisions.
- Every published page includes authoritative sources and verification metadata.
- Every technology page starts from vendor-neutral concepts.
- Every full design includes requirements, estimates, data/API, failures, operations, alternatives, and follow-ups.
- Required custom visuals have keyboard/text alternatives.
- Public progress and account-backed progress preserve the same semantic completion model.
- Back/Forward, deep links, mobile navigation, text zoom, and focus behavior are tested.
- Search indexes only published content.
- System Design tests cover manifests, routes, recommendations, study plans, workspaces, content quality, and behavior.

# 7. Machine Learning System Design specification

## 7.1 Product purpose

ML Design teaches **production ML system judgment**, not a catalog of famous-company diagrams and not a university machine-learning theory course.

The learner’s transferable task is:

> Given an ambiguous product problem, turn it into a measurable decision or learning problem, establish a credible baseline, construct valid data and evaluation, design the offline and serving systems, de-risk rollout, and explain how the system will remain reliable and useful.

The model is one component. Data collection, labels, evaluation, pipelines, serving, experimentation, monitoring, failure handling, privacy, security, human review, and feedback often determine whether the product works.

## 7.2 Required information architecture

The target route model is:

```text
/ml-design
/ml-design/core-concepts
/ml-design/core-concepts/[concept]
/ml-design/problems
/ml-design/problems/[problem]
/ml-design/practice
/ml-design/rubric
/ml-design/glossary
```

The repository may reach this route model incrementally. Existing routes must not be broken merely to force an immediate migration. Add redirects only when destinations are complete and tested.

The landing page must show:

- A basic-ML prerequisite check: supervised-learning intuition, train versus inference, overfitting, common losses, and broad model families.
- A default learning path.
- Fast paths for ranking/recommendation, risk/classification, forecasting/regression, SWE-ML, MLE, and Applied Scientist.
- Continue-learning or recent-practice state without presenting completion as mastery.
- Direct entries to concepts, design problems, practice, rubric, and glossary.
- Clear links to existing System Design prerequisites instead of reteaching queues, storage, caching, partitioning, load balancing, and SLOs.

## 7.3 Universal interview framework: DECIDE

DECIDE is a flexible reasoning map, not a script to recite and not a component checklist.

### D — Define the product decision

Establish:

- User and stakeholder.
- Product objective and user experience.
- The decision/action being improved.
- Prediction/ranking/retrieval/regression/forecasting unit.
- Why ML may help.
- What happens without ML.
- Simplest credible rule, heuristic, domain algorithm, or simple-model baseline.
- Constraints that materially change the design: latency, freshness, scale, reversibility, false-positive harm, human-review capacity, privacy, inventory/corpus size, and availability.

A candidate must be allowed to conclude that ML is unnecessary.

### E — Establish success criteria

Map:

```text
business outcome
    ↓
user/product outcome
    ↓
model or retrieval metric
    ↓
guardrail and operational metric
```

State the optimization target and where it is only a proxy. Select metrics by task rather than repeating one template. Include slices and capacity limits where relevant.

### C — Construct the learning signal

Trace:

```text
observable events
→ logging and exposure
→ labels
→ examples
→ point-in-time split
→ features / representations
→ model family and baseline
→ offline evaluation
```

Ask what is available at prediction time, which outcomes are delayed or disputed, which examples are missing because the old policy did not expose them, whether negatives are natural or sampled, and where leakage can occur.

### I — Integrate learning into the system

Separate at minimum:

```text
OFFLINE
events/data → validation → dataset/features → training → evaluation → artifact

ONLINE OR DECISION PATH
request/event → context/features/retrieval → model → policy/post-processing
→ response/action → logging
```

Decide batch, streaming, precomputation, online inference, feature access, index refresh, model placement, CPU/GPU needs, latency budget, throughput, caching, availability, and fallbacks.

### D — De-risk the launch

Use only what fits the risk:

```text
offline acceptance
→ shadow
→ canary / staged rollout
→ online experiment where appropriate
→ broader rollout
→ rollback
```

Shadow and canary are not synonyms. Specify block conditions, rollback signals, state/schema/index/model compatibility, and safe fallback.

### E — Evolve the production system

Monitor four layers:

- **Data:** schema, missingness, distribution, freshness, delayed arrival.
- **System:** availability, errors, latency, queueing, saturation, cost.
- **Predictions:** score/output distributions, uncertainty, slice behavior.
- **Outcomes:** delayed real-world quality and user/business effects.

Then address diagnosis, retraining/reconfiguration, feedback loops, abuse/adaptation, privacy/security/fairness, human intervention, auditability, and the next likely bottleneck.

## 7.4 Ordered Core Concepts catalog

The following twenty pages are the normalized target catalog. Consolidate overlapping existing material instead of creating duplicate pages.

| # | Concept | Level | Learning objective | Required coverage | Concrete anchor | Common failure | Required asset | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Product Problem Formulation & Baselines | Foundation | Translate an ambiguous product request into a user decision, prediction unit, action, and simplest credible non-ML or simple-model baseline. | User/stakeholder; product objective; decision/action; prediction unit; reversibility; latency/freshness; whether ML is justified; rule/heuristic baseline. | A fraud review queue where rules may solve the first version before a learned scorer is justified. | Jumps directly to a neural model; does not define the action; confuses business goal with training target. | Decision-tree exercise: rules, simple model, or richer ML. | V1 required |
| 2 | Objectives, Metrics & Guardrails | Foundation | Separate business outcome, user/product outcome, model metric, optimization objective, and guardrail. | Proxy objectives; metric conflicts; primary versus diagnostic metrics; slices; latency/safety/business guardrails; no universal metric. | Search: successful task completion, NDCG@K, zero-result rate, latency, complaint rate. | Uses accuracy for every task; optimizes click-through without quality guardrails; treats one proxy as the product goal. | Layered metric-map builder. | V1 required |
| 3 | Data Collection, Logging & Data Quality | Foundation | Design the event and data foundation before discussing training. | Impressions/exposure; events; schemas; identifiers; timestamps; consent; sampling; missingness; freshness; contracts; validation; lineage. | Recommendation logs must record what was shown, not only what was clicked. | Says 'collect user data'; omits exposures; ignores schema changes, late data, or privacy. | Event-to-training-example trace. | V1 required |
| 4 | Labels, Ground Truth & Label Delay | Foundation | Turn observable outcomes into labels while exposing delay, noise, dispute, and proxy risk. | Explicit/implicit labels; positive/negative definition; maturation windows; weak supervision; human labels; adjudication; delayed outcomes. | A purchase occurring a day after an ad click must not be prematurely labeled negative. | Assumes unclicked means irrelevant; treats reviewer decisions as objective truth; ignores delayed outcomes. | Label timeline with mutable label state. | V1 required |
| 5 | Dataset Construction, Splits & Leakage | Foundation | Build evaluation data that resembles future deployment and prevents information from the future leaking backward. | Temporal/entity/group splits; point-in-time joins; duplicate leakage; train/validation/test; backtesting; sampled negatives; leakage audits. | Forecasting uses rolling-origin validation rather than random splitting. | Random split on temporal data; feature calculated after decision; same user/entity across train and test without justification. | Split simulator and leakage hunt. | V1 required |
| 6 | Features & Feature Engineering | Foundation | Choose available-at-decision-time representations with explicit freshness and cost. | Static/dynamic/context features; aggregation windows; transformations; missing values; feature availability; online versus offline computation. | ETA combines route baseline, live traffic, location, time, and regional context. | Lists features without availability/freshness; includes label-derived data; ignores serving cost. | Prediction-time feature budget exercise. | V1 required |
| 7 | Embeddings & Learned Representations | Intermediate | Understand dense representations as learned similarity tools with lifecycle and retrieval consequences. | User/item/query/document embeddings; dual encoders; similarity; negative sampling; refresh; cold start; versioning; projection caveat. | Semantic search embeds queries and documents, then retrieves approximate nearest neighbors. | Says 'use embeddings' without training objective, index lifecycle, filters, or evaluation. | 2D illustration explicitly labeled projection; version-rollout visual. | V1 required |
| 8 | Class Imbalance, Sampling & Negative Examples | Intermediate | Design training and evaluation when positive events are rare or the candidate space is enormous. | Under/oversampling; weighting; hard negatives; exposure-aware negatives; sampled-distribution correction; PR-oriented evaluation. | Fraud positives are rare; recommendation negatives are mostly unobserved rather than true negatives. | Uses accuracy; creates easy random negatives only; evaluates on sampled prevalence without correction. | Sampling playground showing changed prevalence. | V1 required |
| 9 | Offline Evaluation by ML Task | Foundation → Intermediate | Select metrics and error analysis appropriate to classification, ranking, retrieval, regression, and forecasting. | Precision/recall/PR-AUC; ROC caveat; MAE/RMSE/quantiles; Recall@K/MRR/NDCG; slices; confidence intervals where appropriate; error taxonomy. | Candidate retrieval uses Recall@K while final ranking may use NDCG@K. | Metric bingo; no baseline; no slice analysis; one average hides important cohorts. | Task-to-metric decision game. | V1 required |
| 10 | Calibration & Decision Thresholds | Intermediate | Convert scores into operational actions under asymmetric costs and capacity limits. | Probability calibration; threshold bands; allow/review/challenge/block; reviewer capacity; costs; precision-recall operating point; abstention. | Fraud score becomes allow, step-up verification, manual review, or block. | Treats score as probability; uses 0.5 by default; ignores review capacity and reversal/appeal. | Threshold slider with cost and queue effects. | V1 required |
| 11 | Training Pipelines, Reproducibility & Lineage | Intermediate | Design repeatable learning workflows rather than ad-hoc notebooks. | DAGs; data/model artifacts; validation gates; experiment tracking; versioned code/config/data; retries; backfills; lineage; reproducible reruns. | A daily ranker pipeline validates schema, constructs point-in-time data, trains, evaluates, and registers only accepted artifacts. | No artifact lineage; mutable datasets; retries duplicate work; failures silently publish bad models. | Pipeline/artifact graph. | V1 required |
| 12 | Feature Stores & Training-Serving Consistency | Intermediate | Reason about reusable historical and online features without temporal corruption or skew. | Offline/online stores; point-in-time retrieval; materialization; freshness; ownership; backfills; feature definitions; skew; fallback. | Fraud velocity features need both historical reconstruction and low-latency online reads. | Joins latest feature into old examples; assumes feature store is always needed; no stale-feature policy. | Feature timeline and point-in-time join visual. | V1 required |
| 13 | Batch, Streaming & Online Inference | Intermediate | Choose when predictions and features are computed based on freshness, scale, and decision latency. | Batch scoring; precomputation; streaming updates; event time; online request inference; hybrid architecture; late events; cacheability. | Demand forecast is batch; fraud is online with streaming features; recommendation may precompute candidates and rank online. | Calls everything real time; ignores event-time semantics; serves an online model when batch output suffices. | Latency/freshness mode selector. | V1 required |
| 14 | Model Serving & Performance Engineering | Intermediate | Design a reliable prediction data plane with explicit latency, throughput, resource, and quality budgets. | Feature latency; network; preprocessing; inference; postprocessing; batching; CPU/GPU; autoscaling; model loading; caching; admission; cost. | An inference platform routes latency-sensitive small models to CPU and batchable heavy models to GPU pools. | Only draws endpoint; ignores p99, queueing, cold starts, numerical compatibility, saturation, or fallback. | Latency-throughput-cost simulator. | V1 required |
| 15 | Model Registry, Deployment & Rollback | Intermediate | Move accepted artifacts into production safely and reversibly. | Versions; metadata; compatibility; promotion; shadow; canary; staged rollout; traffic split; rollback; schema/model coupling; audit trail. | A new encoder must roll out with a compatible vector index version. | Treats registry as file storage; confuses shadow with canary; no rollback trigger or compatibility plan. | Rollout timeline and compatibility matrix. | V1 required |
| 16 | Online Experimentation & Causal Validation | Intermediate | Decide whether and how a production change can be evaluated causally. | Hypothesis; randomization unit; treatment/control; sample-ratio mismatch; guardrails; interference; long-term effects; ramp; analysis integrity. | Feed ranking may randomize by user and monitor engagement plus quality and latency guardrails. | Says 'A/B test it' without unit, exposure, power, integrity, or safety constraints. | Experiment design debugger. | V1 required |
| 17 | Monitoring, Drift & Performance Degradation | Intermediate | Observe data, system, predictions, and delayed outcomes and diagnose before retraining. | Schema/missingness/freshness; service errors/latency/saturation; score distributions; slice metrics; delayed ground truth; alerting; root cause. | A CTR drop plus feature null spike points to data quality before model drift. | Monitors only uptime or only model metric; retrains automatically on every drift alarm. | Multi-signal incident diagnosis. | V1 required |
| 18 | Feedback Loops, Exploration & Retraining | Advanced | Understand how model actions alter future data and define evidence-driven update policies. | Selection/presentation bias; endogenous labels; exploration; retraining triggers; schedule/event/performance policies; replay; correction. | A recommendation model narrows exposure and learns only from its own choices. | Treats logged behavior as an unbiased sample; rewards frequent retraining without validation. | Feedback-loop causal map. | V1 required |
| 19 | Reliability & Graceful Degradation | Intermediate → Advanced | Keep product decisions safe and useful when model, feature, index, or data dependencies fail. | SLOs; timeouts; stale modes; fallbacks; load shedding; dependency isolation; disaster recovery; model unavailable; partial feature sets. | Search falls back from neural reranking to lexical/lightweight ranker. | Model is a single point of failure; no stale-data policy; fallback violates policy or user expectations. | Failure injection decision table. | V1 required |
| 20 | Responsible ML, Privacy, Security & Human Oversight | Cross-cutting | Treat harm, privacy, abuse, auditability, appeal, and human review as design concerns throughout the lifecycle. | Sensitive data; access/control; subgroup errors; fairness context; adversarial abuse; poisoning/evasion; explainability; review/appeal; governance. | Moderation separates model estimate, policy, human review, and appeal. | Bolts on fairness at the end; makes legal claims; uses protected data casually; builds opaque automatic punishment. | Risk-and-control map; recurring callouts on every relevant page. | V1 required |

### Required learning branches

After the common foundation, expose these recommended paths without hiding the full catalog:

**Ranking / recommendation**

```text
Formulation → Data → Labels → Splits → Features → Embeddings
→ Offline + retrieval/ranking metrics → Pipelines → Feature consistency
→ Serving → Experimentation → Monitoring → Feedback loops
```

**Risk / classification**

```text
Formulation → Data → Labels → Splits → Features → Imbalance
→ Offline metrics → Calibration/thresholds → Pipelines → Serving
→ Deployment → Monitoring → HITL/feedback → Responsible ML
```

**Forecasting / regression**

```text
Formulation → Data → labels/horizons → temporal split → Features
→ Regression/forecast metrics → Pipeline → batch/online decision path
→ Monitoring → uncertainty-aware retraining
```

## 7.5 Required Design Problem catalog

The v1 target is thirteen differentiated end-to-end design dossiers. Variants belong inside the canonical dossier unless the dominant data, learning, serving, or operational problem is materially different.

| Design problem | Family | Difficulty | Dominant challenge | Required coverage | Primary visual | Senior / Staff+ extensions |
| --- | --- | --- | --- | --- | --- | --- |
| Personalized Recommendation System | Personalization | Intermediate | Large candidate space, implicit feedback, retrieval → ranking → reranking, cold start and feedback loops. | Product surface and inventory; rule baseline; impressions/labels; retrieval sources; embeddings; negatives; ranking metrics; online features; exploration; fallback. | Multi-stage retrieval/ranking funnel with exposure logging. | Index/model migration, multi-objective policy, long-term effects, fairness, cost and ownership. |
| Social / Content Feed Ranking | Personalization | Intermediate–Advanced | Rapidly changing inventory, session context, recency, diversity, creator/user ecosystem, endogenous feedback. | Candidate sources; freshness; fan-out context; ranking objective; diversity/quality; session features; exploration; abuse; latency. | Candidate-source fan-in → rank → rerank → policy → feed. | Marketplace/ecosystem effects, creator incentives, multi-region serving, incident fallback. |
| Search Ranking & Retrieval | Search | Intermediate–Advanced | Query-document relevance, lexical retrieval, query understanding, multi-stage ranking, index freshness and biased clicks. | Corpus; inverted index/BM25 baseline; query normalization/rewrite; retrieval recall; learning-to-rank; hard negatives; NDCG/MRR; permissions; fallback. | Query understanding → lexical/semantic retrieval → lightweight ranker → reranker. | Federated search, adaptive depth, permissions, index rollout, cross-lingual/multimodal variants. |
| Autocomplete & Query Suggestions | Search | Intermediate | Every-keystroke latency, prefixes, popularity/trends, personalization, unseen prefixes and unsafe suggestions. | Prefix source; trie/FST/popularity baseline; caching; batch/stream updates; session context; ranking; presentation bias; safety. | Keystroke request path and nearline trend pipeline. | Regional/locale scaling, abusive suggestion response, model/candidate versioning and load spikes. |
| Ads Retrieval & Ranking | Monetization | Advanced | Eligibility, calibrated probabilities, auction/value inputs, delayed conversions, budget/pacing and competing objectives. | Ad inventory/eligibility; retrieval; pCTR/pCVR; delayed labels; calibration; ranking; budget/pacing; auction boundary; user/advertiser/platform guardrails. | Eligibility → retrieval → calibrated prediction → policy/pacing/auction. | Interference, attribution, advertiser fairness, model/auction co-design, long-term user effects. |
| Real-Time Payment Fraud | Trust & prediction | Advanced | Rare/adversarial positives, delayed/disputed labels, streaming features and asymmetric intervention costs. | Transaction decision; rules baseline; labels/chargebacks; velocity/entity features; imbalance; calibration; action bands; review; appeals; monitoring. | Request + streaming feature path → scorer → policy actions. | Graph features, coordinated attacks, feature degradation, regulatory/audit needs, multi-region consistency. |
| Trust & Safety Decision System | Trust & prediction | Advanced | Model-policy boundary, disputed labels, human review, appeals, evolving adversaries and harm. | Policy taxonomy; decision unit; multimodal/text signals as applicable; model versus policy; review queues; escalation; appeal; subgroup errors; abuse. | Detection cascade → policy → human review → enforcement/appeal. | Policy migrations, reviewer quality, cross-locale differences, auditability and crisis response. |
| ETA Prediction | Prediction | Intermediate | Low-latency spatiotemporal regression against a strong routing/domain baseline. | Prediction unit/horizon; route baseline; live traffic; geo/time/context features; tail metrics; uncertainty; online serving; fallback. | Routing baseline + real-time features → model correction → ETA. | Regional drift, map/version changes, route-policy interaction, incident modes and fleet-scale cost. |
| Demand Forecasting | Prediction | Intermediate–Advanced | Future-time validation, multi-horizon uncertainty, seasonality, censored demand and batch operations. | Granularity/horizon; naive baseline; rolling backtest; holidays/promotions; stockout censoring; point/quantile forecasts; hierarchy; downstream cost. | Historical data → rolling validation → forecast distribution → operational decision. | Hierarchical reconciliation, new-item cold start, rare events, nowcasting and optimization coupling. |
| Feature Store | ML infrastructure | Advanced | Point-in-time correctness, feature reuse, offline/online consistency, freshness and ownership. | User needs; build-versus-not; registry/definitions; historical retrieval; materialization; online serving; backfills; lineage; skew; tenant/governance. | Definitions/control plane + offline history + online materialization. | Multi-tenancy, migration, backfill isolation, regional placement, feature deprecation and incident recovery. |
| ML Training & Deployment Platform | ML infrastructure | Advanced | Lifecycle control plane for reproducible training, evaluation, registry, promotion and scheduled/event-driven operation. | Personas; pipelines; artifacts; lineage; experiment tracking; compute scheduling; validation; registry; promotion; rollback; quotas; observability. | Workflow control plane connected to data/artifact/compute systems. | Multi-tenant isolation, priority/preemption, data governance, disaster recovery and organizational ownership. |
| Scalable Online Inference Service | ML infrastructure | Advanced | Hot-path serving economics, batching, resource pools, autoscaling, compatibility and graceful degradation. | SLOs; model sizes/runtimes; control/data plane; routing; batching; CPU/GPU; caching; loading; admission; canary; fallback; cost. | Deployment control plane → scheduler → CPU/GPU pools → request data plane. | Multi-model fleet, tenant isolation, regional failover, GPU fragmentation, rolling runtime changes. |
| Production RAG / Enterprise AI Assistant | Modern AI | Advanced | Retrieval plus generation, permissions, context construction, separate evaluation, model variability and prompt-injection risk. | Use case; corpus/access; ingestion/chunking; sparse/dense retrieval; reranking; context; generation; citations; evals; latency/cost; injection; fallback/HITL. | Ingestion/index path plus query → retrieve → rerank → construct context → generate. | Index/model version coupling, permission revocation, tool use, multi-tenancy, evaluation governance and incident containment. |

### Problem-specific prerequisite primers

Keep these as compact primers attached to a dossier, not new mandatory concept pages:

- Search: inverted-index and information-retrieval basics.
- Forecasting: horizon, seasonality, rolling validation, and uncertainty.
- RAG: tokens/context, retrieval, embeddings, and permissions.
- Graph recommendation variants: basic graph terminology.
- Ads: calibrated probabilities, delayed conversion labels, and the distinction between prediction and auction/policy.
- ETA: domain or routing baseline before model correction.

### “Same framework, changed constraints” variants

Attach variants and exercises rather than creating shallow duplicate pages:

- People You May Know / connection recommendation.
- E-commerce, video, and notification recommendation.
- Semantic and hybrid search.
- E-commerce, enterprise, and federated search.
- Spelling correction, query understanding, and zero-result diagnosis.
- Account takeover, suspicious login, bot detection, and spam.
- Anomaly detection.
- Batch prediction.
- Vector search and large-scale embedding generation.
- Dynamic pricing and marketplace matching.
- Visual and multimodal search.
- ML observability / continuous-training platform.

## 7.6 Core Concept page contract

Every concept lesson must contain:

1. A concrete decision or failure scenario before a definition dump.
2. One-sentence mental model.
3. Why it changes an interview design.
4. Prerequisites and related System Design knowledge.
5. Mechanism with data/state flow.
6. Alternatives and conditions under which the concept is unnecessary.
7. Product consequence.
8. Operational consequence.
9. Common failure modes.
10. A worked example.
11. At least one diagnostic or decision exercise.
12. Interviewer probes.
13. Entry, mid-level, Senior, and role overlays where meaningful.
14. Risk/privacy/security callout when relevant.
15. Related design problems.
16. Authoritative sources with claim-level use and review date.
17. “What number, requirement, or observation would change this decision?”

Preferred editorial pattern:

```text
decision
→ simplest baseline
→ why it stops working
→ mechanism
→ system consequence
→ failure
→ alternative
→ interviewer twist
```

## 7.7 Design Problem page contract

Each dossier must adapt—not mechanically display—these sections:

1. Clarifying questions that change the design.
2. Product objective and user decision.
3. Whether ML is needed and baseline.
4. Prediction/ranking/retrieval unit.
5. Scale, latency, freshness, and action reversibility.
6. Business, product, model, retrieval, and guardrail metrics.
7. Data sources and exact exposure/logging requirements.
8. Labels, delay, noise, bias, and missing counterfactuals.
9. Dataset/split/leakage plan.
10. Features and representations available at decision time.
11. Model-family progression, not architecture-name dumping.
12. Generalized offline/training/indexing architecture.
13. Online serving/action architecture.
14. Capacity, cost, reliability, and fallbacks.
15. Offline evaluation and error analysis.
16. Deployment, shadow/canary/experiment plan.
17. Monitoring and delayed outcome measurement.
18. Feedback/retraining/evolution.
19. Responsible ML, privacy, security, human review, and appeal where relevant.
20. Alternatives and explicit “do not add this component unless...” decisions.
21. Interviewer follow-ups.
22. Senior / Staff+ extensions.
23. “Same framework, changed constraints” exercise.
24. Sources and freshness.

The primary answer must be a generalized reference architecture. Public company systems are labeled historical or documented examples, not “the current secret architecture.”

## 7.8 Practice modes

### Guided

- Reveals DECIDE one stage at a time.
- Provides optional prompts and worked microexamples.
- Allows learners to revise assumptions.
- Does not count as strong readiness evidence.
- Ends with comparison to multiple defensible approaches, not one golden diagram.

### Untimed independent

- Presents the product prompt and lightweight clarification interface.
- Keeps the rubric available but collapsed.
- Records assumptions, design notes, reflection, and incomplete areas.
- Gives structured self-review after submission.

### Timed mock

- Uses realistic but configurable duration.
- Holds guidance until requested or until the session ends.
- Captures whether hints were used and whether the prompt was previously seen.
- Uses dimension-level descriptive feedback.
- Does not output pass probability, hire/no-hire, or opaque score.
- Can return normalized evidence to the Interview Playbook.

### Saved attempts

Store only with authenticated consent. Record:

- Problem/version.
- Mode and duration.
- Assumptions.
- Candidate-produced design text or structured state.
- Completed DECIDE sections.
- Hints.
- Self-review.
- Dimension-level evidence and provenance.
- Follow-up actions.
- Fresh versus repeated exposure.
- Created/updated timestamps.

Private attempt content must not enter analytics.

## 7.9 Transparent ML Design rubric

Use four descriptive bands: **Needs development, Acceptable, Strong, Exceptional**. Do not aggregate them into a pass probability.

Required dimensions:

| Dimension | Needs development | Acceptable | Strong | Exceptional |
| --- | --- | --- | --- | --- |
| Problem framing | Jumps to model; unclear decision | Defines user, task, and basic constraints | Connects decision, ML task, and baseline | Challenges need for ML and anticipates evolution/stakeholders |
| Data and labels | “Collect data” | Plausible sources and labels | Handles exposure, delay, noise, availability, leakage | Designs label operations, lineage, missing counterfactuals, repair |
| Metrics | Generic metric | Task-appropriate offline metric | Product, model, retrieval, slice, and guardrail connection | Explains proxy conflict, causal limits, long-term effects, capacity |
| Architecture | Boxes without flow | Coherent train and serve path | Clear state, timing, version and dependency boundaries | Compares architectures and migration/evolution paths |
| ML judgment | Model-name dumping | Reasonable model family | Complexity justified by data/constraints and baseline | Identifies non-model bottlenecks and evidence-driven escalation |
| Production engineering | Ignores serving/deployment | Basic service/pipeline | Freshness, rollout, fallback, monitoring, cost | Multi-region/tenant/migration/incident and ownership reasoning |
| Experimentation | “A/B test it” | Basic treatment/control | Integrity, guardrails, ramp and rollback | Interference, long-term effects, safety and decision limits |
| Reliability and evolution | Happy path only | One fallback and monitoring plan | Multi-layer monitoring, diagnosis, retraining policy | Feedback loops, abuse, compatibility, operational governance |
| Risk and responsibility | Generic disclaimer | Names relevant risk | Ties harm to controls/review/appeal | Anticipates conflicting risks, auditability and policy evolution |
| Communication | Unstructured component list | Understandable sequence | Assumptions and trade-offs remain visible | Adapts depth, handles challenge, and closes with decisions |

Problem dossiers can mark dimensions as gating or de-emphasized, but must explain why.

## 7.10 Role and level overlays

These are Engineering Foundry preparation profiles, not universal employer ladders.

- **Entry / SDE I / entry ML:** coherent simple end-to-end design; formulation, data, labels, basic metric, leakage avoidance, one serving path, one fallback.
- **SDE II / mid-level:** point-in-time correctness, batch/stream distinctions, deployment, monitoring, cost, delayed labels, alternatives, and failure handling.
- **Senior+:** ambiguous framing, system boundaries, migration/evolution, multi-region or tenant concerns where relevant, organizational ownership, long-term effects, auditability, and cost-risk trade-offs.
- **SWE-ML:** high production depth across concepts 11–19, while retaining correct ML formulation/evaluation.
- **MLE:** balanced depth across the complete lifecycle.
- **Applied Scientist:** stronger formulation, modeling judgment, metrics, experimentation, uncertainty, and enough production detail to keep the proposal realistic.

Senior depth must appear as expandable extensions inside canonical pages, not as duplicate “senior versions.”

## 7.11 Required reusable visuals

Prioritize visuals where timing, flow, or coupled trade-offs matter:

- Offline versus online path.
- Point-in-time feature/label timeline.
- Exposure and label-delay timeline.
- Retrieval → ranking → reranking funnel.
- Threshold/action-band simulator.
- Temporal split / rolling-origin simulator.
- Feature-store offline/online materialization.
- Model rollout: shadow versus canary versus experiment.
- Four-layer monitoring dashboard and diagnosis exercise.
- Feedback-loop diagram.
- Latency-throughput-cost serving simulator.
- RAG ingestion/query pipelines with permissions and injection boundary.
- Forecast distribution → operational decision.
- Model/index compatibility rollout.

Any 2D embedding visual must say that it is an illustration or projection of a higher-dimensional representation.

## 7.12 ML content exclusions

Do not build:

- Thirty to fifty shallow pages differentiated only by product noun.
- Company-branded “correct current architectures.”
- A golden-diagram checker.
- Opaque readiness numbers or chances of passing.
- A university-style derivation-heavy syllabus as the main path.
- A mandatory feature store, vector database, GPU, Kafka, or deep model in every answer.
- Vendor documentation rewritten as curriculum.
- Safety/fairness as a single late disclaimer.
- Claims about current model context limits, API prices, or vendor capabilities without a verification date.
- Automated legal/compliance conclusions.

## 7.13 ML Design acceptance criteria

A release is complete only when:

- The twenty concepts are represented once each without semantic duplicates.
- The thirteen required dossiers are distinct and depth-reviewed.
- DECIDE appears consistently but never as a rigid script.
- Every dossier includes baseline, data/labels, metrics, offline and online paths, rollout, monitoring, failure mode, alternative, and Senior extension.
- Search/recommendation/fraud/forecasting/RAG use task-specific data and metrics.
- No page asserts one universal best model, database, vector store, or architecture.
- Guided, untimed, and timed practice have honest evidence labels.
- Saved attempts are private and excluded from analytics.
- The rubric is visible and descriptive.
- Role/level overlays are labeled as EF profiles.
- Required concept/dossier/practice/glossary/rubric routes are discoverable and linkable.
- Every substantive factual claim has an appropriate source class and review date.
- All active routes pass content, link, accessibility, responsive, and feature tests.

# 8. DSA and Coding Interview specification

## 8.1 Product purpose

Engineering Foundry DSA is not an attempt to outnumber LeetCode. Its purpose is:

> Teach the algorithm, teach the learner to recognize when it applies, and teach the learner to perform the solution clearly under interview conditions.

The target loop is:

```text
learn invariant
→ recognize from an unlabeled prompt
→ clarify
→ state brute force
→ derive a plan
→ implement
→ test aloud
→ analyze complexity
→ handle a follow-up
→ record error and review
```

The strongest product progression is:

```text
pattern mastery
→ company context
→ timed interview behavior
→ structured feedback
→ scheduled review
```

Solved count is activity, not mastery.

## 8.2 Required information architecture

Maintain or evolve toward:

```text
/dsa
/dsa/start-here/**
/dsa/patterns
/dsa/topics or canonical topic routes
/dsa/questions
/dsa/questions/[question]
/dsa/roadmap
/dsa/roadmaps/[role]/[duration]
/dsa/study-plans
/dsa/languages
/dsa/languages/[language]
/dsa/companies
/dsa/companies/[company]
/dsa/practice
/dsa/interview-strategy
```

The landing page must provide:

- Start path by baseline and target level.
- A finite curated core rather than an overwhelming catalog.
- Pattern index and topic dependency map.
- Python and Java interview-language entries.
- Study-plan and level-roadmap entries.
- Public practice and private progress boundaries.
- Company context labeled by evidence quality.
- A useful anonymous path.
- Continue-learning state without claiming mastery.

## 8.3 Core pattern catalog

Use the existing curated catalog as the canonical pattern index. Every card must show the mental model, recognition clues, common mistakes, and recoverable practice link whose count matches actual results.

| Pattern | Recognition signals | Frequent mistakes | Representative use |
| --- | --- | --- | --- |
| Frequency Map / Hashing | Counts, grouping, membership, complement lookup. | Wrong update order; stale zero counts; hashability/mutability assumptions. | Pairs, duplicates, grouping, frequencies. |
| Two Pointers | Sorted input, pair constraints, in-place compaction, converging boundaries. | Moving both without proof; duplicate handling; invalid invariant. | Pair search, partition, container/range. |
| Sliding Window | Longest/shortest/count over a contiguous range with incremental state. | Shrink once instead of while; wrong left boundary; non-monotonic constraint. | Substrings, subarrays, frequency windows. |
| Prefix Sum | Repeated range aggregate or balance condition. | Missing zero prefix; off-by-one subtraction; overflow. | Range sum, subarray count, equilibrium. |
| Binary Search | Ordered domain or monotonic feasibility predicate. | Inconsistent interval convention; overflow; unproven monotonicity. | Search, first/last, answer-space. |
| Stack | Nested structure, unresolved prior items, matching, expression state. | Empty access; storing value instead of index; wrong pop condition. | Parentheses, parsing, undo, traversal. |
| Fast & Slow Pointers | Linked structure, cycle, midpoint, repeated-state process. | Comparing values rather than identity; unsafe dereference. | Cycle detection, linked-list midpoint. |
| BFS | Minimum unweighted steps, levels, nearest target, spreading process. | Marking visited too late; level bookkeeping; huge queue. | Graphs, grids, shortest unweighted path. |
| DFS | Components, path existence, subtree aggregation, exhaustive branch. | Missing visited; recursion depth; mutation not restored. | Trees, graphs, grids, components. |
| Topological Sort | Prerequisites and directed dependency order. | Not detecting incomplete order/cycle; wrong edge direction. | Course/build/dependency scheduling. |
| Union Find | Repeated connectivity and component merges. | Incorrect rank/size; no path compression; cannot handle deletions naively. | Connectivity, redundant edge, clustering. |
| Backtracking | Generate valid combinations under constraints. | Failure to restore; duplicates; weak pruning; global-state leakage. | Permutations, combinations, board search. |
| Heap Selection | Top-k, next-priority, streaming rank, merge sorted inputs. | Wrong heap direction; unbounded heap; comparator errors. | Kth/top-k, schedulers, median/merge. |
| Trie | Prefix branching, dictionary search, lexical candidate generation. | No terminal marker; memory blow-up; unnecessary use. | Autocomplete, word dictionary, prefix queries. |
| 1D Dynamic Programming | Linear state with overlapping subproblems. | Wrong base cases/order; overwriting needed state; no recurrence. | Take/skip, paths, subsequences. |
| 2D Dynamic Programming | Two changing dimensions or paired prefixes. | Bad initialization; unnecessary matrix; state does not encode enough. | Grid, sequence alignment, capacity/index. |
| Merge Intervals | Ranges, overlaps, scheduling and coverage. | Wrong endpoint convention; sorting key; only adjacent originals. | Merge/insert, meeting schedules, coverage. |
| Monotonic Stack / Queue | Nearest greater/smaller or window extrema under order. | Wrong monotonic direction; value/index confusion; equality handling. | Histogram, next greater, sliding max. |
| Greedy | Local choice supported by invariant or exchange argument. | No correctness argument; wrong sort criterion; hidden future dependency. | Intervals, reachability, scheduling. |
| Bit Manipulation | Parity, masks, compact subset state, XOR identities. | Signed shift, precedence, width assumptions, unreadable trick. | Unique values, flags, subsets, arithmetic. |

### Pattern lesson contract

A full pattern lesson must include:

1. Problem shape before pattern name.
2. Recognition clues and anti-clues.
3. Invariant.
4. Brute-force baseline.
5. Derivation of the improved approach.
6. Language-neutral pseudocode.
7. Python and Java implementations or deep links to language templates.
8. Complexity with assumptions.
9. Visual state trace where it explains the invariant.
10. Common wrong approaches.
11. Edge cases.
12. Interview narration examples.
13. One labeled worked problem.
14. One unlabeled recognition exercise.
15. One transfer problem.
16. Follow-up variations.
17. Error-log prompts.
18. Related patterns and decision boundary.

Do not imply that keyword matching alone identifies a pattern. The user must learn why the invariant fits.

## 8.4 Topic and prerequisite sequence

Recommended dependency order:

```text
complexity + arrays/strings + hashing
    ↓
two pointers + sliding window + prefix sums
    ↓
stacks/queues + binary search + linked lists
    ↓
trees + BFS/DFS + heaps
    ↓
intervals + backtracking + tries + union-find
    ↓
graphs/topological order/shortest paths
    ↓
greedy + 1D DP + 2D DP
    ↓
advanced data structures and production extensions
```

Core topic pages should cover:

- Arrays and strings.
- Hash maps and sets.
- Sorting.
- Linked lists.
- Stacks and queues.
- Binary search.
- Trees and binary search trees.
- Heaps and priority queues.
- Graph representation and traversal.
- Topological ordering.
- Union-find.
- Backtracking.
- Tries.
- Greedy reasoning.
- Dynamic programming.
- Intervals and sweep-line foundations.
- Bit manipulation.
- Matrix/grid traversal.
- Shortest paths and weighted graphs as advanced core.
- Advanced structures only when they unlock relevant transfer.

Every topic page should connect:

```text
concept
→ recognition
→ implementation options
→ representative problems
→ interview behavior
→ review state
```

## 8.5 Foundry 75 contract

The finite core list must be curated, licensed/linked safely, and versioned.

Selection principles:

- Covers all core patterns without overweighting one family.
- Includes enough Easy problems to establish templates but centers interview-relevant Medium transfer.
- Uses Hard problems sparingly for important state/invariant lessons.
- Avoids duplicates whose only difference is surface story.
- Mixes public external links and genuinely original EF prompts.
- Does not reproduce copyrighted problem statements.
- Records source, external URL, verification status/date, free-access status, topic, pattern, role relevance, and rationale.
- Company association is separate metadata with provenance; no invented frequency.
- Removal does not erase user history; catalog versions remain traceable.

Each question record should support:

```text
id
slug
title
source class
external URL or original prompt
difficulty
topics
patterns
roadmap stage
priority
status
verification
company associations with provenance
interview behavior focus
follow-up variants
```

## 8.6 Question experience

A question page should help a candidate practice the interview, not merely open an external link.

Required public content:

- Title and provenance.
- Difficulty/topic/pattern metadata.
- Why the question belongs.
- Recognition prompt that can be hidden until attempted.
- Clarifying questions to consider.
- Brute-force checkpoint.
- Complexity target.
- Test-case prompts.
- Follow-up variants.
- External problem link or EF-original prompt.
- Clear statement when the full prompt is hosted elsewhere.

Authenticated optional state:

- Status: not started / attempted / solved / review.
- Confidence.
- Bookmark.
- Notes.
- Attempts.
- Last reviewed and next review.
- Application context.
- Timed-mode evidence.
- Hints used.
- Self-reflection.

No private code, notes, or reflections may enter analytics.

## 8.7 Coding interview execution framework

Teach a flexible sequence:

1. Listen and restate.
2. Clarify only constraints that change the solution.
3. Work one concrete example.
4. State brute force and its limitation.
5. Identify the invariant/data structure.
6. Describe the plan and complexity.
7. Confirm or proceed.
8. Implement in coherent units.
9. Narrate meaningful state changes, not every keystroke.
10. Test normal, boundary, adversarial, and bug-prone cases.
11. Correct errors openly.
12. State final complexity and follow-up direction.

Examples must be original and should model useful speech:

- “The condition concerns a contiguous range, and I can add and remove its state incrementally, so I would test a sliding-window invariant.”
- “I’m using a half-open interval `[lo, hi)`; every update will preserve that convention.”
- “This fails when the first node is already the answer. I’ll repair the initialization rather than patch that case.”
- “Each element enters and leaves the deque once, so the total work is linear.”

Do not enforce excessive narration, fixed phrases, or asking permission before every line.

## 8.8 Practice modes

### Learn

- Topic/pattern is visible.
- Worked example and visualization available.
- Not strong readiness evidence.

### Recognition drill

- Topic/pattern label hidden.
- User chooses an approach and explains clues/anti-clues.
- Feedback focuses on reasoning, not only final label.

### Untimed solve

- Normal independent problem solving.
- Optional checkpoints and hints.
- Reflection after attempt.

### Timed interview mode

- Configurable duration based on actual context, not universal claim.
- Prompt and permitted references are explicit.
- Captures clarification, plan-before-code, completion, tests, complexity, hints, and recovery.
- Timer can be disabled/extended for accessibility.
- Does not create a pass probability.

### Mixed/unseen set

- Removes topic labels.
- Samples across patterns with prior-exposure controls.
- Better transfer evidence than repeating familiar problems.

### Review queue

- Driven by errors, elapsed time, confidence, and retrieval history.
- Does not become a punitive streak.
- Missed days cause reprioritization, not backlog doubling.

## 8.9 DSA evidence and rubric

Use descriptive, inspectable dimensions:

- Problem recognition.
- Problem framing and clarification.
- Brute-force reasoning.
- Algorithm/data-structure choice.
- Correctness.
- Implementation fluency.
- Complexity analysis.
- Testing and edge cases.
- Communication.
- Hint dependence.
- Error recovery.
- Transfer to unseen problems.

The simplified interview-facing rubric may group them into:

1. Communication.
2. Problem solving.
3. Technical implementation.
4. Testing and validation.

Never let completion marks alone produce “100% ready.” Repeated/familiar success must be distinguishable from unseen transfer.

## 8.10 DSA by language

Language guides are **interview operating manuals**, not general programming courses.

Every published language page must include:

- Version/runtime note and last review date.
- Value/reference/mutability/equality model.
- Core syntax used in interviews.
- Container decision table and real operation costs.
- Sorting and comparator behavior.
- Queue/deque, heap, set/map, and binary-search utilities.
- Numeric, string, recursion, and overflow hazards.
- Node/graph representations.
- Pattern templates.
- Debugging checklist.
- “What interviewers may ask about this language” without pretending universal policy.
- Exercises that predict output, trace state, repair a bug, choose a container, and solve a transfer problem.
- Code verified in the pinned runtime/toolchain.
- Mobile-readable code and touch targets.

Target modules:

| Module | Required content | Target status |
| --- | --- | --- |
| Shared: Interview-language operating model | How the runtime represents values, mutability/identity, function calls, copying, equality, ordering, overflow and recursion. | Every published language |
| Shared: Input and output templates | Parse common arrays, strings, matrices, graphs, and custom nodes without platform-specific ceremony. | Every published language |
| Shared: Complexity by real operation | Document expected complexity and hidden costs for containers, slicing/copying, strings, sorting, hashing and allocation. | Every published language |
| Python: Objects, references, mutability and copying | Aliasing, shallow/deep copies, immutable keys, default-argument hazards, scope and closures. | V1 published |
| Python: Core syntax for interviews | Iteration, enumerate, zip, unpacking, comprehensions, generators where useful, sorting keys and lambdas. | V1 published |
| Python: List, tuple, string, dict and set | Operation costs, insertion order, hashability, membership, slicing and mutation. | V1 published |
| Python: collections | `deque`, `Counter`, `defaultdict`, named/simple records where appropriate. | V1 published |
| Python: heapq, bisect and ordering | Min-heap, portable max-heap technique, tuple priority, stable tie-breakers, binary insertion/search. | V1 published |
| Python: Trees, graphs and recursion | Adjacency representation, iterative alternatives, recursion depth, visited state, nested helper scope. | V1 published |
| Python: Numeric and string pitfalls | Floor division, modulo, infinities, Unicode assumptions, immutable string construction. | V1 published |
| Python: Pattern templates | Hashing, two pointers, window, binary search, BFS/DFS, heap, backtracking, DP and DSU. | V1 published |
| Java: Values, references, equality and mutability | Primitive/reference semantics, `==` versus `equals`, `hashCode`, records/classes and defensive copying. | V1 published |
| Java: Arrays, strings and builders | Primitive arrays, `Arrays`, `String`, `StringBuilder`, char/code-point caveats and conversion cost. | V1 published |
| Java: Collections selection | `ArrayList`, `HashMap`, `HashSet`, `ArrayDeque`, `TreeMap`, `TreeSet`, linked structures and operation costs. | V1 published |
| Java: PriorityQueue and comparators | Comparator correctness, overflow-safe comparisons, min/max heaps, composite keys and stable tie-breaking. | V1 published |
| Java: Generics and boxing | Primitive boxing costs, generic arrays, wildcard avoidance under interview pressure, null handling. | V1 published |
| Java: Numeric safety | `int` versus `long`, overflow, `Math`, division, modulo and sentinel values. | V1 published |
| Java: Trees, graphs and recursion | Node classes/records, adjacency lists, iterative traversal, stack depth, visited collections. | V1 published |
| Java: Pattern templates | Hashing, pointers, window, binary search, BFS/DFS, heap, backtracking, DP and DSU. | V1 published |
| JavaScript / TypeScript: Runtime and equality | Primitives/objects, references, strict equality, truthiness, null/undefined, mutation and copying. | P1 research-backed implementation |
| JavaScript / TypeScript: Number and integer safety | IEEE-754 `number`, `Number.MAX_SAFE_INTEGER`, `BigInt`, comparisons and serialization limitations. | P1 |
| JavaScript / TypeScript: Arrays, strings, Map and Set | Operation costs, sparse arrays, sorting comparator, Unicode/code points, object-key pitfalls. | P1 |
| JavaScript / TypeScript: Queue, heap and data-structure gaps | Avoid `shift` for large queues; index-based queues; implement/test a compact heap; typed structures. | P1 |
| JavaScript / TypeScript: Functions, closures and recursion | Lexical scope, arrow/function differences where relevant, recursion limits and iterative alternatives. | P1 |
| JavaScript / TypeScript: TypeScript interview ergonomics | Useful type aliases/interfaces/generics without boilerplate; compile-safe templates. | P1 |
| JavaScript / TypeScript: Pattern templates | Hashing, pointers, window, binary search, BFS/DFS, heap, backtracking, DP and DSU. | P1 |
| C++ interview guide | Modern STL, value/reference semantics, RAII, iterators, comparators, overflow, ownership and templates. | P2 unless explicitly prioritized |
| Go interview guide | Slices/maps, value/reference-like semantics, runes/bytes, heap/interface ergonomics, queues and recursion. | P2 unless explicitly prioritized |

### Python page principles

- Teach a portable interview subset before version-specific conveniences.
- Explain references, mutability, aliasing, copying, hashability, and default argument pitfalls.
- Prefer `collections.deque` for queues.
- Cover `Counter`, `defaultdict`, `heapq`, `bisect`, tuple ordering, sorting keys, `enumerate`, `zip`, and comprehensions.
- Explain list/string slicing costs and immutable string construction.
- Explain recursion depth and iterative alternatives.
- Demonstrate when a compact idiom improves speed and when it damages explainability.
- Visualize invariants such as pointer/window movement, heap order, BFS frontier, recursion tree, memo hits, DP dependencies, and DSU compression.
- End each visual lesson with an unfamiliar problem solved without the visualizer.

### Java page principles

- Teach `==` versus `equals`, `hashCode`, primitive/reference semantics, and mutation.
- Cover `ArrayList`, `HashMap`, `HashSet`, `ArrayDeque`, `PriorityQueue`, `TreeMap`, `TreeSet`, arrays and `StringBuilder`.
- Avoid `Stack` when `ArrayDeque` is the appropriate stack/queue.
- Explain comparator overflow and use comparison methods safely.
- Make `int` versus `long` decisions visible.
- Explain boxing, generics, null handling, and recursive stack limits at interview depth.
- Keep class/record boilerplate minimal but type-correct.
- Compile all templates and fixtures in CI when the JDK is available; CI must not silently skip a required published-language compiler forever.

### JavaScript / TypeScript page principles

- Teach strict equality, truthiness, references, mutation, spread/shallow copying, `Map`, `Set`, arrays and strings.
- Explicitly cover IEEE-754 number semantics, safe integer range, `BigInt`, and sorting comparator requirements.
- Do not recommend repeated `Array.shift()` for large BFS queues; use an index-based queue or verified queue abstraction.
- Supply a small tested heap because the standard library lacks one.
- Explain Unicode code points versus UTF-16 code units where it changes string algorithms.
- Use TypeScript where type information improves correctness, but do not bury algorithms under types.
- Parse/execute fixtures using the actual supported Node/TypeScript toolchain before publishing.

## 8.11 Company context

Company DSA pages can show:

- Official format/language/tool guidance.
- Candidate-reported categories tied to role, region, date, and source.
- EF-recommended general preparation.
- User-confirmed private interview information.

They must not show:

- Invented frequency percentages.
- Company tags without provenance.
- Exact confidential prompts copied from reports.
- A claim that every team/level uses the same question mix.
- “Most asked” labels without a defensible dated dataset.

## 8.12 DSA visuals

Use deterministic traces. High-value visual states include:

- Pointer movement and invariant region.
- Sliding window add/remove state.
- Binary-search interval convention.
- Stack of unresolved candidates.
- BFS frontier and visited timing.
- DFS recursion/iterative stack.
- Heap push/pop and top-k boundary.
- Union-find parent compression.
- Backtracking choose/explore/undo.
- DP state dependency and memory compression.
- Trie prefix traversal.
- Monotonic stack candidate elimination.
- Complexity counters.

The visualizer must explain **why the algorithm works**, not just highlight executed lines.

## 8.13 DSA exclusions

Do not build:

- A scraped LeetCode corpus.
- Copies of proprietary statements, editorials, or solution diagrams.
- A fake company-frequency database.
- A solved-count-only readiness score.
- A requirement to grind arbitrary quantities.
- AI hints before the user has formed a plan, unless Guided mode is selected.
- Arbitrary untrusted code execution as part of this content goal.
- Automatic personality or confidence judgments from voice/video.
- A new general programming course inside each language guide.

## 8.14 DSA acceptance criteria

- The pattern index, question filters, global search, and card counts agree.
- Direct URLs and Back/Forward restore visible filter state without remount/focus loss.
- Every pattern with a practice CTA returns exactly the advertised active set.
- Every published question has valid provenance and a recoverable destination.
- Python and Java guides pass code/runtime fixtures and mobile typography/touch audits.
- JavaScript/TypeScript remains clearly unavailable until its reviewed curriculum and runtime fixtures pass.
- Anonymous users can learn and practice meaningfully.
- Signed-in progress is private, durable, and not interpreted as mastery.
- Timed and mixed-set modes record evidence provenance and prior exposure.
- Company associations retain source/date/role/region context.
- All pages expose useful next actions and return paths to the Playbook.

# 9. Behavioral Interview specification

## 9.1 Product purpose

Behavioral preparation is **evidence preparation**, not memorization of polished speeches.

The canonical workflow is:

```text
build truthful canonical stories
→ inspect coverage
→ map stories to questions
→ create concise and standard variants
→ face adaptive follow-ups
→ self-evaluate
→ update the canonical story or choose better evidence
```

STAR is an organizing aid, not the scoring model. CAR, SAR, SOAR, and a natural evidence arc are valid when they improve clarity. The product evaluates answer evidence, not personality.

## 9.2 Information architecture

Evolve without unnecessary top-level overload toward:

```text
/behavioral
/behavioral/learn
/behavioral/questions
/behavioral/questions/[question]
/behavioral/stories
/behavioral/stories/[story]
/behavioral/practice
/behavioral/workspace
/behavioral/review
```

Not every route needs equal navigation weight.

Recommended primary navigation:

- **Learn**
- **Questions**
- **Stories**
- **Practice**
- **Workspace / Review** when signed in

Questions and Stories are the content/evidence units. Workspace is a combined operational view, not a duplicate curriculum.

Anonymous users must be able to learn, browse the curated question taxonomy, and use local practice. Authenticated users receive durable story, mapping, variant, reflection, and application-context state.

## 9.3 Launch curriculum

Target approximately sixteen substantial lessons rather than many overlapping tips.

| # | Lesson | Learning objective | Level | Required example/exercise | Asset |
| --- | --- | --- | --- | --- | --- |
| 1 | What behavioral interviews evaluate | Understand job-relevant competency evidence and structured interviewing; reject vague culture-fit mythology. | Foundation | Examples of observable behavior versus personality judgments. | Text + evidence-layer diagram |
| 2 | Evidence, not opinions or hypotheticals | Use specific past events and distinguish fact, interpretation, team action, and personal action. | Foundation | Convert a generic claim into a concrete evidence thread. | Annotated comparison |
| 3 | Response frameworks without rigid scripts | Use STAR, CAR, SAR, SOAR, or a natural evidence arc; framework supports clarity but is not the rubric. | Foundation | Same story in concise natural form and explicit framework view. | Framework comparison |
| 4 | Build a canonical story record | Capture stable facts once before adapting an answer. | Foundation | Event, constraints, ownership, decisions, actions, outcome, evidence, reflection. | Story worksheet |
| 5 | Choose stories and build coverage | Prioritize breadth across competencies, situations, scope, and reuse risk instead of an arbitrary story count. | Foundation | Coverage map identifies three delivery stories but no conflict/failure evidence. | Interactive coverage matrix |
| 6 | Personal ownership within team work | Explain what the team did and what the candidate personally decided, executed, influenced, or learned. | Foundation | Rewrite an answer dominated by 'we'. | Annotated answer |
| 7 | Technical depth for a non-identical audience | Explain architecture, constraints, and technical choices at the depth needed to establish judgment without drowning the story. | Intermediate | Cache migration incident explained to a mixed interviewer. | Depth slider/comparison |
| 8 | Impact without invented metrics | Use quantitative, qualitative, operational, risk, customer, and learning evidence honestly; separate causation from contribution. | Intermediate | Reliability improvement where exact revenue impact is unavailable. | Evidence ladder |
| 9 | Decision-making, alternatives, and trade-offs | Show information available at the time, alternatives considered, decision criteria, and adaptation after new evidence. | Intermediate | Sync versus async processing under burst risk. | Decision table |
| 10 | Conflict, disagreement, and influence | Demonstrate productive disagreement, listening, changed minds, escalation judgment, and influence without requiring victory. | Intermediate | Hybrid solution after two valid concerns. | Annotated dialogue |
| 11 | Failure, mistakes, incidents, and learning | Own a real error, explain causes and consequences, show recovery and durable prevention without self-destruction or blame. | Intermediate | Mixed-version serialization failure and rollout improvements. | Incident timeline |
| 12 | Ambiguity, priorities, and deadlines | Expose how the candidate frames unknowns, chooses what not to do, manages risk, and updates the plan. | Intermediate | Competing launch and reliability commitments. | Prioritization exercise |
| 13 | Leadership, mentoring, feedback, and raising standards | Show leverage through others, coaching, process/quality improvements, and durable mechanisms at role-appropriate scope. | Advanced | Leadership without title at a small team. | Scope comparison |
| 14 | Career narrative and common conversational questions | Prepare truthful, bounded answers for tell-me-about-yourself, why company, strengths/weaknesses, gaps, layoffs, short tenures, and transitions. | Foundation → Intermediate | 90-second career narrative with role-specific bridge. | Builder + examples |
| 15 | Follow-ups, project deep dives, and consistency | Handle ownership, alternatives, metrics, counterfactuals, technical depth, learning, and inconsistencies without changing facts. | Advanced | Adaptive probe tree generated from story gaps. | Follow-up drill |
| 16 | Seniority, role, company modifiers, and self-review | Calibrate evidence by scope, ambiguity, consequences, influence, and leverage; apply company/role context only with provenance. | Advanced | Same incident assessed for SDE II versus Senior. | Rubric + level overlay |

## 9.4 Question catalog and taxonomy

Preserve and audit the existing approximately 48-question catalog. Do not replace it with a newly invented generic list merely because a specification names categories.

Every question must have:

- Stable ID and slug.
- Canonical wording plus optional safe variants.
- Competency/category tags.
- Story-category compatibility.
- Level relevance.
- Role relevance.
- Follow-up families.
- Guidance and common failure modes.
- Company modifier references only where sourced.
- Privacy/confidentiality warning where relevant.
- Status and editorial review date.
- No duplicate whose only difference is superficial wording.

The taxonomy must cover:

| Question / story family | Coverage |
| --- | --- |
| Accomplishment and impact | Delivery, initiative, meaningful result, technical achievement. |
| Ownership and initiative | Unassigned problems, end-to-end responsibility, follow-through. |
| Technical judgment | Architecture choice, trade-off, build/buy, migration, quality or reliability. |
| Failure and learning | Mistake, missed signal, poor decision, unsuccessful project, corrective action. |
| Incident and recovery | Production issue, diagnosis, mitigation, communication, prevention. |
| Conflict and disagreement | Peer/manager/product disagreement, listening, evidence, resolution. |
| Influence without authority | Alignment, decision facilitation, cross-team adoption, stakeholder change. |
| Ambiguity and incomplete information | Framing, assumptions, experiments, updating after evidence. |
| Prioritization and deadlines | Trade-offs, scope cuts, sequencing, risk, competing work. |
| Customer or user impact | Need discovery, support, harm prevention, outcome and caveat. |
| Cross-team collaboration | Dependencies, interfaces, coordination, shared ownership. |
| Mentoring and development | Teaching, feedback, delegation, growth and multiplying others. |
| Process and engineering quality | Standards, testing, observability, tooling, operational leverage. |
| Receiving or giving feedback | Openness, specificity, behavior change, difficult conversation. |
| Changed mind / evidence-driven pivot | Assumption invalidated, new information, adaptation. |
| Security, privacy, safety, or ethics | Risk identification, escalation, trade-off and responsible action. |
| Leadership beyond assignment | Direction, coordination, durable mechanisms, organization-scale leverage. |
| Career narrative | Motivation, transitions, gaps, layoffs, short tenure and role fit. |
| Why company / role | Current, evidence-based motivation tied to role; no generic flattery. |
| Strengths and development areas | Specific evidence and current improvement behavior. |

Catalog audit rules:

- Distinguish a true duplicate from a different evidence target.
- Conflict is not identical to influence.
- Failure is not identical to receiving feedback.
- Ambiguity is not identical to prioritization.
- Incident response is not identical to a generic technical accomplishment.
- Project deep dive can reuse a story but requires deeper technical and decision probes.
- “Tell me about yourself,” “Why this company?”, gaps/layoffs, strengths, and weaknesses need conversational guidance but should not be treated as past-behavior evidence in exactly the same way.
- Company principle mappings are modifiers, not new duplicate question banks.

## 9.5 Canonical Story schema

The Story is the source of truth. Answer variants derive from it; variants must never invent or silently contradict facts.

| Field group | Required meaning |
| --- | --- |
| Identity | Stable story ID, title, dates/period, role, organization/context, confidentiality status. |
| Situation and stakes | Trigger, affected users/systems/people, why it mattered, known constraints. |
| Responsibility | Assigned responsibility, self-initiated responsibility, decision authority, team roles. |
| Canonical facts | Only facts that must remain consistent across every answer variant. |
| Technical context | System, scale, architecture, dependencies and failure conditions needed to understand judgment. |
| Alternatives | Options considered, advocates, constraints, evidence and rejected alternatives. |
| Decision criteria | What information was available, what mattered, and why the chosen path was reasonable then. |
| Personal actions | Specific decisions, implementation, communication, influence, escalation and coordination. |
| Team actions | What collaborators did; keep separate from personal contribution. |
| Obstacles and adaptation | Surprises, disagreement, failure, feedback, changed assumptions, and course corrections. |
| Outcome | Immediate result, downstream result, unresolved result, and adverse effects. |
| Evidence | Metric, observation, artifact, customer feedback, operational evidence, or honest qualitative support. |
| Causality caveat | What the candidate can and cannot attribute to their own actions. |
| Reflection | What was learned, what changed later, and what the candidate would do differently. |
| Durable mechanism | Tests, runbooks, process, architecture, mentoring, standards or follow-up that outlasted the event. |
| Competency mappings | Question families and competencies the story can credibly support. |
| Reuse risk | How often it is used; which other evidence areas remain uncovered. |
| Variants | Concise, standard, deep-dive, and question-specific emphasis derived from canonical facts. |

### Story coverage model

Do not require one universal number of stories. Evaluate coverage across:

- Competency breadth.
- Situation breadth.
- Technical versus interpersonal evidence.
- Success and failure.
- Individual execution and influence through others.
- Customer, operational, quality, and learning outcomes.
- Role/seniority scope.
- Freshness.
- Confidentiality readiness.
- Follow-up depth.
- Reuse concentration.

A coverage view should say things such as:

- “Strong delivery and incident evidence; no clear conflict example.”
- “One story is mapped to nine questions; prepare a second independent example.”
- “Senior target: ownership is clear, but organization-level influence remains untested.”

It must not say “You are 83% behaviorally ready.”

## 9.6 Answer construction

Use this natural evidence arc:

```text
orient the interviewer
→ establish stakes and responsibility
→ explain pivotal reasoning and personal actions
→ state outcome and evidence
→ reflect where relevant
→ stop and allow follow-up
```

### Variants

- **Concise:** recruiter screen, first pass, or time-limited answer; preserves core evidence.
- **Standard:** normal behavioral answer with decision rationale and result.
- **Deep dive:** project, technical decision, incident, Senior/Staff follow-up.
- **Question-specific emphasis:** same canonical event, different truthful emphasis.
- **Company-modified:** changes likely probes/emphasis only where evidence supports it; never changes facts.

Each variant must retain:

- Event identity.
- Personal role.
- Consequential decision/action.
- Real outcome.
- Any material adverse fact.
- Metric source/limits.
- Confidentiality boundary.

Consistency tests should flag facts that appear in a variant but not canonical facts, conflicting metrics/dates/roles, and stories whose variants tell materially different realities.

## 9.7 Follow-up system

Follow-ups should be generated from evidence gaps, not a fixed script.

Probe families:

- Clarification and timeline.
- Personal ownership.
- Alternatives and why.
- Information available at the time.
- Technical detail.
- Stakeholders and disagreement.
- Measurement/evidence.
- Causality and limits.
- Risk and failure mode.
- Counterfactual: what would change the decision?
- Scale and durability.
- Learning and later behavior.
- Level/scope.
- Confidentiality.
- Consistency with another answer.

Adaptive rule examples:

- When impact is clear, ask how it was measured or what else contributed.
- When ownership is vague, ask what the candidate personally decided or did.
- When a Senior answer shows only one-service scope, ask whether the mechanism changed a wider practice.
- When the answer already explains the result, do not repeat “What was the result?”
- When technical detail overwhelms the competency, redirect to the consequential decision.
- When a candidate changes their mind, treat that as potential judgment evidence rather than weakness.

## 9.8 Evaluation rubric

Use descriptive bands and dimension-level evidence.

Required dimensions:

| Dimension | Weak evidence | Acceptable | Strong | Exceptional |
| --- | --- | --- | --- | --- |
| Relevance | Does not answer target | Related event | Direct evidence | Direct evidence plus nuanced boundary |
| Specificity | Generic claims | One concrete event | Clear timeline/actions | Precise evidence without unnecessary detail |
| Ownership | Team-only “we” | Personal contribution visible | Decisions and accountability clear | Creates leverage while crediting others |
| Judgment | Decision unexplained | Basic reason | Alternatives, constraints, trade-offs | Updates intelligently; anticipates second-order effects |
| Technical understanding | Jargon or absent | Understandable basics | Mechanism and failure clear | Adapts depth and connects technical/product consequences |
| Outcome and evidence | Vague success | Honest outcome | Supported impact and caveat | Multiple evidence types; causal limits explicit |
| Learning | Generic lesson | Specific reflection | Behavior/system changed | Durable mechanism and transfer |
| Communication | Hard to follow | Coherent | Concise, natural, probe-ready | Adapts in dialogue without losing facts |
| Follow-up depth | Facts collapse | Answers basic probe | Handles ownership/why/result | Handles counterfactual, risk, scale, disagreement |
| Level/scope | Below target evidence | Plausible target scope | Strong target evidence | Broader durable leverage appropriate to context |
| Integrity | Embellished/confidential | Safe and truthful | Limits and team credit explicit | Resolves sensitive ambiguity responsibly |

Do not infer honesty, personality, culture fit, accent quality, emotion, confidence, eye contact, “executive presence,” or hire probability.

### Seniority calibration

- **Entry:** credible ownership at available scope, learning, collaboration, technical fundamentals, and honesty about limited authority.
- **SDE II:** end-to-end delivery, independent judgment, incidents, trade-offs, cross-functional work, and durable service/team improvements.
- **Senior:** ambiguous consequential problems, architecture/risk, cross-team influence, prioritization, mentoring, standards, and leverage through systems/people.
- **Staff+:** organizational problem framing, strategy/roadmaps, multi-team mechanisms, long-term trade-offs, sponsorship and durable technical direction. Do not require a management title.

Scope is relative. A small-company story can demonstrate Senior evidence when ambiguity, consequences, leverage, and durable effect are substantial.

## 9.9 Practice architecture

### Question practice

- User selects or receives a question.
- They choose a story or discover that coverage is missing.
- They create a concise/standard answer from canonical facts.
- They self-check before feedback.
- They receive one to three actionable next steps.

### Follow-up drill

- Starts after an initial answer.
- Selects one highest-value gap at a time.
- Maintains canonical facts.
- Supports text-first interaction.
- Allows “I do not know / cannot share that detail.”
- Ends with a consistency and evidence summary.

### Themed drill

Examples:

- Conflict and influence.
- Failure and learning.
- Ambiguity/prioritization.
- Project technical depth.
- Leadership/mentoring.
- Career narrative.
- Values/ethical judgment.

### Behavioral mock defaults

Defaults are practice configurations, not universal company claims:

- Concise screen: roughly 15–20 minutes, two or three primary prompts.
- Single-question stress test: roughly 5–8 minutes with two to four adaptive probes.
- Standard round: roughly 40–50 minutes, about three evidence threads.
- Senior deep dive: roughly 45–55 minutes, fewer anchors with deeper probes.
- Themed round: roughly 25–40 minutes.
- Company-configured round: only when sourced; otherwise label generic with company emphasis.

The timer must be optional/adjustable. Interruption is used to redirect an overly long setup, clarify an important claim, or preserve time—not to create hostility.

## 9.10 Self-review and feedback order

Before AI or system feedback, ask:

1. Did I answer the question?
2. Can the listener tell what I personally owned?
3. Did I explain why I made consequential choices?
4. Did I state the actual outcome without overclaiming?
5. Could I answer two deeper probes without changing facts?
6. Did I identify real learning when relevant?
7. Did I protect confidential information?
8. What would I change on the next attempt?

Then present:

```text
candidate reflection
→ observable story/transcript evidence
→ deterministic findings
→ heuristic questions
→ model-assisted observations
→ one to three next actions
```

Feedback taxonomy:

- **Deterministic:** missing fields, inconsistent metrics, answer length, duplicate mappings, confidential-field status, source freshness.
- **Heuristic question:** high “we” usage, long setup, story overuse, metric exists only in variant, blaming language. Phrase as a question, not a verdict.
- **Model-assisted:** relevance, clarity, decision rationale, technical explanation, reflection, likely follow-up, possible scope mismatch. Label uncertainty.
- **Human/editorial:** rubric definitions, published examples, company claims, disputed feedback.

No screen should dump a wall of generic red warnings.

## 9.11 Audio, video, accessibility, and privacy

V1 is text-first.

Optional voice recording may support self-listening and transcript review only when:

- Explicitly enabled.
- Recording state is obvious.
- Retention is opt-in and bounded.
- Deletion/export behavior is clear.
- Transcript and audio are private.
- Feedback avoids accent, emotion, personality, eye-contact, deception, and confidence scoring.
- Filler-word counts are not treated as readiness.
- Users have a fully equivalent text path.

Video analysis is not required and should remain excluded absent a strong, privacy-safe, accessibility-reviewed use case.

All story, answer, transcript, feedback, application, and reflection content is private and excluded from analytics.

## 9.12 Company modifiers

Company-specific behavioral guidance must use the Company Guide evidence model.

Permitted:

- Current official values/principles.
- Official interview guidance.
- Recruiter/interviewer commentary labeled as such.
- Candidate-reported observations with role/region/date.
- EF preparation inference clearly labeled.
- Story-category and follow-up emphasis.

Forbidden:

- Hidden scoring-policy claims.
- Rumored exact questions presented as official.
- Universal process claims from one report.
- Company-value keyword stuffing.
- Telling a candidate to distort a story to mimic a value.

Company modifier data should include:

```text
company
last verified
claim-level source class
role / level / region / program applicability
behavioral placement
competency emphasis
story-category mapping
follow-up emphasis
confidence
uncertainty note
sources
```

## 9.13 Behavioral exclusions

Do not build:

- A story generator that invents events or metrics.
- A “culture fit” or personality score.
- Hire/no-hire or pass probability.
- Accent, eye contact, face, emotion, deception, confidence, or filler-word scoring.
- Mandatory voice or camera.
- A universal required story count.
- A rigid STAR ratio.
- Polished scripts that suppress truthful follow-up depth.
- Public sharing of private stories by default.
- Company-specific claims without source/date/applicability.
- Management-only examples as the default for Senior ICs.
- Examples that unfairly assume big-company scale.
- An answer whose verbosity increases merely because target level increases.

## 9.14 Behavioral acceptance criteria

- Existing question catalog is audited rather than replaced.
- Sixteen-lesson curriculum is represented without duplication.
- Canonical Story facts drive variants and follow-ups.
- Story coverage is descriptive and inspectable.
- STAR/CAR/SAR/SOAR are supported without becoming the rubric.
- Concise and standard variants remain fact-consistent.
- Follow-ups adapt to missing evidence.
- Entry, mid, Senior, Staff+, international, small-company, and IC contexts are supported.
- Text-only usage is complete.
- Private content is excluded from analytics.
- No unsupported behavioral or hiring inference appears.
- Browser Back/Forward restores question/filter/practice state without remount or stale controls.
- Every practice outcome has a useful next action and can return evidence to the Playbook.

# 10. Interview Playbook specification

## 10.1 Permanent purpose

The Interview Playbook is Engineering Foundry’s **interview-preparation control plane**.

It owns:

- Context.
- Prioritization.
- Sequencing.
- State transitions.
- Uncertainty.
- Cross-section orchestration.
- Round execution.
- Final-week and interview-day support.
- Mock prescriptions and evidence consumption.
- Between-round recovery.
- Debrief and next-step transitions.

It does not own the complete DSA, System Design, ML Design, LLD, Behavioral, Company Guide, Mock, Interview Experience, Application, Calendar, or Salary curriculum.

A feature belongs in the Playbook when it requires two or more of:

- Interview lifecycle state.
- Coordination across preparation domains.
- Application/company/round context.
- Time-to-interview.
- Selection of the next activity.
- Transition between learning, simulation, execution, debrief, and outcome.
- Evidence produced elsewhere.

## 10.2 Continuous user model

```text
tell EF what you are preparing for
→ show known / reported / unknown
→ assess only the evidence that matters
→ recommend one defensible next action
→ deep-link to the canonical specialist action
→ receive normalized evidence
→ update priorities
→ rehearse when useful
→ enter final-week / interview-day mode
→ debrief
→ continue with next round, next application, or Salary Negotiation
```

The Playbook must also work when there is no interview, no company, or no known round structure.

## 10.3 Page and module catalog

| Page / module | Purpose | Audience | Inputs | Output | Type | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| Playbook Start | Explain control-plane role and route into no-interview, scheduled-interview, imminent, or debrief mode. | Everyone | Optional role, level, interview status | One next entry action | Hybrid | V1 |
| General Interview Loop Guide | Explain common round families and real variation without claiming one universal loop. | New candidates | None | Loop taxonomy + uncertainty guidance | Static | V1 |
| Context Setup | Capture role, level, company, date, rounds, hours, language and constraints. | Personalized users | User/app data | Preparation context | Private personalized | V1 |
| Diagnostic Entry | Select the minimum evidence needed before planning; allow skip when urgent. | All personalized users | Context + existing evidence | Diagnostic tasks or explicit unknowns | Private personalized | V1 |
| General Preparation Plan | Coordinate preparation without a specific application. | No-interview users | Role/level/time/evidence | Ordered cross-section actions | Private personalized | V1 |
| Application Preparation Workspace | Operational home for a real interview process. | Scheduled candidates | Application + rounds + evidence | Loop, next action, plan, state | Private personalized | V1 |
| Loop Map | Display confirmed, expected, completed, scheduled, superseded and unknown stages. | Active applicants | Rounds + provenance | Source-aware timeline | Hybrid/private | V1 |
| Uncertain Loop Module | Show known/likely/unknown and recruiter questions without fabricating certainty. | Unknown-round users | Available sources | Fallback preparation + questions | Hybrid | V1 |
| Interview Types Index | Navigate round-execution guidance by round type. | Everyone | Optional context | Round guide links | Hybrid | V1 |
| Round Execution Dossier | Teach what to do during a round; link to specialist learning. | Round-targeted users | Round + optional level/company/duration | Execution flow, recovery, quick reference | Hybrid | V1 core types |
| Company Modifier Panel | Overlay verified company facts and observations. | Company-targeted | Company/role/level/region | Sourced modifiers and uncertainty | Hybrid | V1 priority companies |
| Next Action Engine | Choose one defensible highest-value action and explain why. | Personalized users | Context + evidence + time | Action/rationale/alternative | Private personalized | V1 |
| Final Week | Reduce novelty, target gaps, rehearse, and prepare logistics. | ≤7 days | Schedule + evidence | Tapered action plan | Private personalized | V1 |
| Interview Day | Provide concise verified schedule, logistics, integrity and recovery support. | Day-of users | Application schedule | Checklists/contingencies | Private personalized | V1 |
| Between-Round Recovery | Reset attention and capture only urgent facts before next round. | Multi-round loop | Completed/next round | Brief recovery protocol | Private personalized | V1 |
| Debrief | Separate facts, interpretation and learning after each round/loop. | Post-round | Round context | Private evidence + next action | Private personalized | V1 |
| Recruiter Follow-up | Use promised timelines and current instructions before general conventions. | Waiting users | Recruiter timeline/status | Optional message templates | Private/hybrid | V1 |
| Outcome Transition | Handle advanced, rejected, withdrawn and offer states. | Post-decision | Application outcome | Reprioritization or salary handoff | Private personalized | V1 |
| Source Methodology | Explain official, reported, EF and user-confirmed evidence. | Everyone | None | Public trust policy | Static | V1 |
| Portfolio View | Deduplicate common capability work across multiple applications while preserving modifiers/deadlines. | Multi-application users | Several applications | Shared plan + separate overlays | Private personalized | P1 strong |

## 10.4 Context model

Minimum user-controlled inputs:

- Preparation mode: no interview / scheduled / tomorrow / between rounds / debrief.
- Role family and target level.
- Company, optionally unknown.
- Interview date/time/time zone.
- Known round types, order, duration, modality, and status.
- Source of each round fact: user-confirmed, recruiter, official, candidate-reported, EF assumption.
- Coding language.
- Available preparation capacity and fixed constraints.
- Existing section progress and evidence.
- Multiple applications.
- User overrides: skip, pin, reduce, reschedule, correct assumption.

Do not require exhaustive onboarding before showing value. Emergency/imminent mode must be directly accessible.

## 10.5 Loop and uncertainty model

Every stage must be one of:

- Confirmed by candidate/recruiter.
- Officially described for applicable role/program.
- Candidate-reported pattern.
- EF general assumption.
- Unknown.
- Scheduled.
- Completed.
- Cancelled.
- Superseded.
- Not applicable.

Unknown is a valid first-class state.

The uncertain-loop panel must show:

1. What is known.
2. What is likely but not confirmed, with source/confidence.
3. What is unknown.
4. What to ask the recruiter.
5. Transferable fallback preparation.
6. Why the product is not asserting an exact loop.

When sources conflict:

- Current recruiter/candidate-confirmed process governs the private application.
- Official information outranks candidate reports for formal policy.
- Candidate reports remain visible as variation evidence.
- Conflicting official sources remain visible until resolved.
- The Playbook does not silently invent an answer.

## 10.6 Diagnostic model

The diagnostic is progressive, skippable, and evidence-seeking.

Potential dimensions:

- Coding recognition/problem solving.
- Coding correctness.
- Testing/edge cases.
- Coding communication.
- Practical coding/debugging/code review.
- System Design.
- ML Design where relevant.
- Low-Level Design.
- Behavioral story coverage.
- Behavioral delivery/follow-up.
- Project deep dive.
- Company-specific process knowledge.
- Mock/interview-like performance.
- Logistics and tool readiness.

For each dimension, store:

```text
relevance to current target
evidence source
evidence date
task/content fingerprint
fresh/repeated status
conditions
deterministic observations
human judgment
AI-assisted judgment
self-report
confidence
untested areas
next useful evidence
```

Diagnostic behavior:

- Reuse recent representative evidence.
- Do not retest strong fresh evidence solely to fill a dashboard.
- Distinguish lesson completion from demonstration.
- Distinguish familiar from unseen tasks.
- Ask fewer questions when the interview is imminent.
- Let the user correct bad assumptions.
- Explain why each diagnostic action is requested.
- Stop when the next action is already clear.

## 10.7 Readiness representation

Do not use one overall percentage, pass chance, offer probability, or XP total.

Show:

- **Plan progress:** what actions are complete.
- **Evidence coverage:** which relevant dimensions have recent representative evidence.
- **Preparation state:** normal / final week / interview day / between rounds / debrief.
- **Dimension status:** strong evidence / usable evidence / limited evidence / no recent evidence / not relevant.
- **Uncertainty:** why the status has its confidence.
- **Next evidence:** what activity could clarify the gap.

A user must be able to inspect “Why does Engineering Foundry think this?”

Never infer:

- Employer decision.
- Hidden hiring bar.
- Personality/culture fit.
- Level outcome from sparse activity.
- Capability from content completion alone.
- Failure from rejection.
- Success from offer.
- Readiness from raw solved count or time.

## 10.8 Adaptive planning rules

Planner principles:

1. Prioritize only relevant dimensions.
2. Respect prerequisites.
3. Prefer the smallest activity that can improve or clarify the highest-value gap.
4. Balance learning, retrieval, practice, simulation, and rest rather than only assigning more questions.
5. Use representative/fresh tasks for readiness evidence.
6. Use worked/guided examples for learning, not readiness.
7. Interleave where it improves transfer without creating confusion.
8. Schedule review based on errors and evidence decay, not streak pressure.
9. Deduplicate shared work across applications.
10. Keep company modifiers separate from transferable preparation.
11. Recalculate when date, round, company, availability, or evidence changes.
12. Missed days drop low-value work; they do not create a punishment backlog.
13. As the interview approaches, reduce novelty and increase retrieval, rehearsal, and logistics.
14. Explain every adaptation.
15. Always offer a user override.

Every next-action card must contain:

```text
Action
Why now
Target dimension
Expected evidence or result
Time category: short / medium / long
Deep link to exact configuration
Alternative
Source/context modifier
Return protocol
```

No action exists merely because content exists.

## 10.9 Time-horizon behavior

| Horizon / state | Primary behavior | Avoid |
| --- | --- | --- |
| No scheduled interview | Durable fundamentals, diagnostic sampling, spaced review, occasional representative mocks, optional company exploration. | Fake urgency, invented company loop, intense daily grind. |
| 90+ days | Build prerequisites and depth; interleave learning and practice; infrequent baseline mocks; sustainable workload. | Front-loading repeated mocks; memorizing company questions. |
| 60 days | Core curriculum plus targeted weaknesses, regular retrieval, first interview-like mocks after foundations. | Same plan as 30 days with twice as many questions. |
| 30 days | Prioritize likely round families and missing evidence; targeted learning; weekly mocks; error-driven review. | Attempting every curriculum page. |
| 7 days | Gap triage, one or two high-value simulations, review known material, environment/logistics, taper novelty. | Major new curriculum, backlog doubling, repeated low-value mocks. |
| 3 days | Confirmed format, critical gaps only, short rehearsal, logistics, sleep/time protection, contingency readiness. | Learning many new topics; score-chasing. |
| 1 day | Verify schedule/tools/rules, light retrieval, one brief confidence-building rehearsal if useful, stop heavy work. | Full loop, exhausting grind, medical/wellness claims. |
| Interview morning | Schedule/time zone, equipment/travel, contact, permitted references, calm concise reminders. | Last-minute diagnostic or large practice set. |
| 30–60 minutes before | Open correct environment, materials and contact; one-page execution reminders; no self-scoring. | Novel questions or doom-scrolling reports. |
| Between rounds | Hydrate/eat as personally appropriate without medical claims; reset; verify next round; note only urgent facts. | Replaying/diagnosing prior round in depth. |
| Immediately after round | Record facts, broad categories, hints, technical failures and next schedule; separate feelings. | Publishing exact confidential prompt. |
| After full loop | Private structured debrief, error log, transferable next actions, optional appropriate thank-you. | Predicting outcome or assigning blame. |
| Waiting for decision | Use recruiter-promised timeline, continue other priorities, follow up after stated boundary. | Universal exact-day chasing rule. |

Arbitrary-date plans interpolate by prerequisites, relevance, evidence, workload, and final-week boundary. They are not a compressed or expanded fixed question count.

## 10.10 Round taxonomy and execution dossiers

| Round type | Playbook execution focus | Canonical specialist owner |
| --- | --- | --- |
| Recruiter / initial screen | Career narrative, motivation, availability, process clarification, concise evidence. | Behavioral + company guide |
| Online assessment | Instructions, integrity, environment, timing, independent execution, recovery. | DSA / role-specific assessment |
| Take-home | Scope, assumptions, code quality, documentation, tests, permitted tools, time-boxing and submission. | Practical coding / LLD / role domain |
| Algorithmic coding | Clarify, derive, implement, test, communicate, handle hints and follow-ups. | DSA |
| Practical coding / implementation | Read codebase/API, make production-like change, test, reason about maintainability. | Practical engineering / DSA as needed |
| Debugging | Reproduce, isolate, form hypotheses, inspect evidence, repair root cause, validate regressions. | Core engineering / systems |
| Code review | Correctness, risk, clarity, security, tests, maintainability, respectful prioritization. | Core engineering |
| Frontend / UI coding | State/data flow, accessibility, browser behavior, testing, performance, product trade-offs. | Frontend specialty |
| System Design | Clarify, estimate, APIs/data, high-level architecture, bottlenecks, trade-offs, reliability and evolution. | System Design |
| Machine Learning System Design | DECIDE, data/labels, evaluation, architecture, serving, rollout, monitoring and risk. | ML Design |
| Low-Level Design / OOD | Use cases, domain model, responsibilities, interfaces, invariants, flows, change and testing. | Low-Level Design |
| Behavioral / values | Select truthful evidence, answer naturally, sustain follow-up depth and preserve facts. | Behavioral |
| Hiring manager / project deep dive | Career motivation, project architecture, personal judgment, trade-offs, influence, outcomes. | Behavioral + technical depth |
| Technical presentation | Audience, narrative, evidence, visual clarity, questions, trade-offs and time control. | Role-specific; P2 if content incomplete |
| Domain knowledge | Apply role-relevant fundamentals and explain assumptions; avoid pretending universal scope. | Specialist curricula |
| Mixed / full loop | Transitions, fatigue, context switching, delayed feedback and recovery across rounds. | Mock Lab + Playbook |

Every round dossier must include:

- What this round is intended to expose, stated as general guidance unless sourced.
- What commonly varies.
- Before-round setup.
- Opening and format clarification.
- Execution flow.
- Time-management guidance as adaptable ranges.
- Communication checkpoints.
- Hint/redirection handling.
- Error recovery.
- Running-short-on-time protocol.
- Partial completion protocol.
- Closing behavior.
- Specialist deep links.
- Level overlays.
- Company modifiers with provenance.
- Accessibility/accommodation considerations.
- Integrity/permitted-tool reminder.
- Contingency actions.
- Post-round evidence fields.
- Source date and methodology.

Do not publish minute-by-minute universal scoring formulas.

## 10.11 Mock integration

The Playbook decides:

- Whether a mock is valuable now.
- Objective: diagnosis, targeted practice, readiness check, or rehearsal.
- Target round.
- Scope: single round, mini-loop, full loop.
- Fidelity.
- Evaluator.
- Duration basis.
- Environment and permitted references.
- Hint/interruption policy.
- Company/role/level modifiers.
- Evidence dimensions.
- Prior-exposure exclusions.
- Accessibility settings.

This becomes a **Mock Prescription**.

The Mock Lab returns a **Mock Evidence Summary** containing:

- Session/content fingerprint.
- Conditions and fidelity.
- Evaluator type.
- Fresh versus repeated prompt.
- Completion/validity.
- Deterministic observations.
- Structured human judgment if any.
- AI-assisted judgment separately labeled.
- Self-report.
- Hints/redirections.
- Technical failures.
- Fatigue/interruption context.
- Dimension-level confidence.
- Remediation tags.
- Recording/transcript reference only when retained by choice.

The Playbook never treats a single mock as ground truth.

## 10.12 Final-week and interview-day system

### Seven days

- Confirm schedule, time zone, modality, round labels, permitted tools/references, and recruiter contact.
- Review sourced company modifiers.
- Identify only critical evidence gaps.
- Run one or two representative simulations when useful.
- Remediate specific gaps.
- Taper new content toward the end.
- Prepare equipment/travel/backup plan.
- Surface accommodation/contact guidance without legal or medical adjudication.

### Three days

- Freeze broad curriculum expansion.
- Review known error patterns and story/architecture quick references.
- Run a short targeted rehearsal only if it will change behavior.
- Verify environment.
- Prepare questions and logistics.
- Protect against overloading the schedule.

### Day before

- Confirm exact time zone and invitation.
- Check tools, device, internet/backup, location/travel, access and contact.
- Review concise execution reminders.
- Stop heavy novel practice.
- Do not provide universal sleep, food, hydration, breathing, or medical prescriptions.

### Interview morning / pre-round

- Show next round, start time, modality and contact.
- Show permitted-tool/integrity reminder.
- Show one-page execution framework.
- Offer equipment check.
- Hide low-value dashboards and scores.
- Do not ask the candidate to diagnose readiness.

### Between rounds

- Verify next round/time.
- Encourage attention reset.
- Capture only urgent factual notes.
- Do not replay or score the previous round.
- Route technical failures or concerning behavior to a factual private note and recruiter/contact path.

## 10.13 Technical and difficult-interaction contingencies

| Event | Product response |
| --- | --- |
| Internet/computer failure | Use prepared backup where available; notify the stored contact; preserve facts. |
| Platform/coding environment failure | Tell interviewer; follow their alternative; record technical issue separately from capability. |
| Missing invite/time-zone conflict | Stop guessing; verify recruiter/application record and contact recruiting. |
| Late interviewer/schedule delay | Follow employer instructions and confirm revised timing; no universal exact wait rule. |
| Unexpected round/interviewer | Clarify format; use nearest execution framework; preserve uncertainty. |
| Onsite travel disruption | Notify recruiting early with factual updated status. |
| Illness/emergency/reschedule | Contact recruiting; do not decide whether the reason is medically or legally sufficient. |
| Hostile/dismissive interaction | Stay task-focused where possible; record facts afterward; route to appropriate contact. |
| Potential discrimination/accommodation concern | Do not make a legal determination; preserve facts and direct to recruiter/accommodation/candidate channel and current authoritative resources. |
| Rule/tool conflict | Ask for clarification; current assessment instruction governs; do not assume AI/tool permission. |

## 10.14 Debrief

The private debrief is not a public Interview Experience submission.

Capture separately:

**Facts**

- Round type and context.
- Broad problem or competency category.
- What was completed.
- Objective errors or technical failures.
- Hints/redirections.
- Scheduled next step.

**Interpretation**

- What felt strong/weak.
- Confidence and uncertainty.
- What the candidate would change.

**Learning**

- Error-log entry.
- Specialist practice link.
- Whether evidence changes.
- Next action.

**Confidentiality**

- Category-level notes.
- No automatic publication.
- No prompt reconstruction.
- No raw private note in analytics.

After:

- **Advancement:** add confirmed round and reprioritize.
- **Rejection:** preserve transferable evidence; do not invent cause or downgrade everything.
- **Offer:** primary action becomes Salary Negotiation; preserve other active applications.
- **Withdrawal:** archive cleanly and retain reusable learning.

## 10.15 Recruiter follow-up

Priority order:

```text
recruiter-promised timeline
→ official current company instruction
→ application-specific context
→ general professional convention
```

Provide optional editable templates for:

- Confirming schedule/details.
- Asking format/permitted-tool clarification.
- Rescheduling.
- Reporting technical issue.
- Thanking/reconnecting where appropriate.
- Requesting an update after the stated timeline.

Do not automate repeated chasing. Thank-you messaging is optional and not scored.

## 10.16 Integrity

Permanent policy:

- Follow actual assessment rules.
- Preparation use of AI does not imply live-interview permission.
- Never infer permission for code assistants, external repositories, hidden devices, other people, or generated answers.
- No hidden live-answer assistant.
- No proprietary question reconstruction.
- Private debrief and public Experience are distinct.
- Candidate reports never override direct recruiter instructions for that candidate.

## 10.17 Playbook exclusions

Do not build:

- Pass/offer probabilities.
- One global readiness score.
- Plans driven by arbitrary problem counts.
- Burnout-inducing backlog recovery.
- Mandatory diagnostic before urgent help.
- Duplicate specialist curriculum.
- Company process claims copied into generic prose.
- Hostile/extreme-stress simulation.
- Real-time covert interview assistance.
- Medical treatment guidance.
- Jurisdiction-free legal conclusions.
- Automatic publishing of debriefs.
- A planner that cannot explain itself.
- A home dashboard crowded with every possible metric.

## 10.18 Playbook acceptance criteria

- No-interview, known-loop, unknown-loop, tomorrow, multi-application, between-round, advancement, rejection, and offer journeys work.
- One defensible next action is always visible or the product explains why no action is needed.
- Every action deep-links to an exact specialist task and accepts return evidence.
- Plans preserve history through changes and rescheduling.
- Company facts retain source/date/applicability/confidence.
- Unknown remains visible.
- Plan progress, evidence coverage, and preparation state remain separate.
- Back/Forward restores visible diagnostic/planning state.
- Final-week/day interfaces reduce cognitive load.
- Debrief remains private and abstracted.
- Offer transitions to Salary Negotiation.
- No unsupported hiring prediction, hidden assistant, or proprietary prompt collection exists.

# 11. Mock Interview Practice Lab specification

## 11.1 Boundary

The Mock Lab conducts simulation. The Playbook decides whether simulation is useful, configures it, and consumes the evidence.

The Mock Lab owns:

- Session setup.
- Prompt delivery.
- Interviewer interaction.
- Follow-ups and redirection.
- Timer and environment.
- Hints according to policy.
- Round transitions.
- Session events.
- Candidate reflection.
- Evaluator input.
- Evidence summary.
- Optional recording/transcript controls.

It does not own the full underlying curricula, application tracker, company truth, global preparation plan, or hiring prediction.

## 11.2 Simulation taxonomy

Model simulations on independent axes:

- **Learning stage:** guided → rehearsal → assessment-like.
- **Scope:** single round → mini-loop → full loop.
- **Evaluator:** solo → AI → peer → calibrated human/coach.
- **Fidelity:** low → moderate → interview-like → company-shaped.

| Format | Definition | Best use | Evidence value |
| --- | --- | --- | --- |
| Guided practice | Pauses, explanations, generous hints, restart allowed. | First exposure to interview execution. | None / very low |
| Untimed independent practice | Ordinary independent work without interviewer interaction. | Build underlying skill; usually owned by specialist section. | Not mock evidence |
| Timed solo rehearsal | Fixed time and realistic tools, no interactive evaluator. | Pacing and environment familiarity. | Low |
| AI-led single-round mock | Structured script, follow-ups, redirection and explicit hint policy. | Scalable execution practice. | Low–moderate; AI judgment labeled |
| Peer-led structured mock | Human peer follows supplied script and rubric. | Interactive communication and collaborative dynamics. | Moderate when rubric/conditions known |
| Coach/expert-led mock | Experienced human evaluator with structured rubric. | Nuanced feedback and advanced practice. | Potentially stronger, never ground truth |
| Company-shaped round | Verified company/role modifiers applied to any evaluator mode. | Near-interview rehearsal. | Depends on source/evaluator |
| Mini-loop | Several rounds with transitions and delayed overall feedback. | Context switching and recovery. | Moderate |
| Full-loop simulation | Ordered round set with breaks and realistic transition rules. | End-to-end rehearsal. | High contextual value, not hiring prediction |

## 11.3 Session configuration

Required:

- Target round.
- Objective.
- Scope.
- Duration and source of duration assumption.
- Prompt/scenario fingerprint.
- Prior exposure.
- Evaluator type.
- Fidelity.
- Company/role/level modifiers with provenance.
- Environment.
- Permitted references/tools.
- Hint policy.
- Interruption/redirection policy.
- Accessibility settings.
- Evidence dimensions.
- Privacy/retention choices.

The user must be able to run a useful generic simulation when company data is unknown.

## 11.4 Interviewer behavior

A structured mock interviewer:

- Asks one primary prompt at a time.
- Allows initial framing.
- Probes the highest-value unresolved evidence gap.
- Redirects excessive setup or irrelevant depth.
- Challenges assumptions respectfully.
- Supplies hints only under configured policy.
- Records that a hint occurred.
- Adapts follow-up depth by level and observed evidence.
- Can end or move on when enough evidence exists.
- Does not create hostility for entertainment.
- Does not invent company-specific secret rubrics.
- Does not repeatedly ask a question already answered.
- Never helps a user cheat in a real interview.

## 11.5 Prompt and scenario governance

- Use original, licensed, or safely linked prompts.
- Version prompts and scenario fingerprints.
- Keep company-shaped constraints separate from canonical prompt.
- Exclude prompts previously seen when fresh evidence is required.
- Mark repeated prompts as practice, not fresh readiness.
- Do not reconstruct exact questions from candidate reports.
- Human-review scripts and rubrics before treating them as canonical.
- Ensure accessibility and alternative modality.

## 11.6 Evidence Summary

Return:

```text
session ID
content fingerprint/version
target round and dimensions
simulation conditions
evaluator/provenance
fresh or repeated
valid / interrupted / technical failure
deterministic events
structured human observations
AI-assisted observations
candidate self-report
hints/redirections
completion and partial work
technical/platform issues
dimension-level confidence
remediation tags
specialist deep links
recording/transcript references if retained
```

No single aggregate score is required. Evidence from AI, peer, human, and self-report must remain visually distinguishable.

## 11.7 Candidate reflection

Before evaluator feedback:

- What did I understand correctly?
- Where did I hesitate or change direction?
- What hint or redirection mattered?
- What did I complete and validate?
- What would I change?
- Which evidence feels uncertain?
- Was the session representative?
- Did a platform or accessibility issue affect it?

## 11.8 Feedback

Feedback must be:

- Tied to observable session evidence.
- Dimension-specific.
- Uncertain where interpretation is uncertain.
- Limited to one to three next actions.
- Mapped to canonical specialist content.
- Clear about fresh/repeated and assisted/unassisted performance.
- Free of personality, accent, emotion, eye contact, attractiveness, deception, or culture-fit inference.

## 11.9 Recording and transcript

Optional only.

- Explicit recording indicator.
- Consent before capture.
- Separate retention choice.
- Clear storage location and duration.
- Export/delete.
- No training use by default.
- No analytics ingestion.
- Text-only equivalent.
- No default indefinite retention.
- No face/emotion/personality analysis.

## 11.10 Full-loop behavior

A full loop must model:

- Confirmed or explicitly assumed round order.
- Transition/break state.
- Context switching.
- Delayed overall feedback where configured.
- Technical failure handling.
- Fatigue/interruption context.
- Round-level and loop-level evidence.
- Ability to stop safely.
- Company-shaped mode only when evidence supports the loop.
- No claim that matching the simulation means the actual company process will match.

## 11.11 Mock exclusions

Do not build:

- “82% chance of passing.”
- Hire/no-hire.
- One global mock score.
- Mock leaderboards.
- Streak pressure.
- Same-question rematch as new readiness.
- Extreme stress, hostile interviewer, abuse, or arbitrary interruptions.
- Deliberately shortened unrealistic limits.
- Mandatory voice/camera.
- Face, eye-contact, accent, filler-word, personality, confidence, or deception scoring.
- Unverified company-loop generator.
- Proprietary question bank from reports.
- Automatic training on recordings.
- Endless generic AI feedback.
- Specialist curricula duplicated inside debrief.

## 11.12 Mock acceptance criteria

- Guided, solo, AI, peer, human, company-shaped, mini-loop, and full-loop labels are semantically honest.
- Evaluator provenance is never lost.
- Fresh/repeated and assisted/unassisted conditions are recorded.
- A technical failure cannot reduce capability evidence without an explicit reason.
- Accessibility controls can extend/disable timing and provide text-equivalent use.
- Private session content is excluded from analytics.
- Back/Forward and reload behavior preserve only the state intended by the selected privacy/persistence mode.
- Evidence returns to the Playbook and deep-links to remediation.

# 12. Company Interview Guide specification

## 12.1 Purpose

Company Guides provide **source-aware modifiers**, not rumor collections and not replicas of general curricula.

A guide should answer:

- What does the company officially say?
- What have candidates reported, with context?
- What does Engineering Foundry recommend as transferable preparation?
- What is known, uncertain, stale, or role-dependent?
- Which exact canonical learning/practice actions are relevant?
- What should the candidate confirm with the recruiter?

## 12.2 Evidence classes

Use these labels consistently:

| Class | Meaning | Allowed use |
| --- | --- | --- |
| Official | Current company careers, hiring, culture, role, interview or candidate material | Definitive only within its documented scope |
| Recruiter / interviewer commentary | First-party employee guidance not framed as formal policy | Explanatory evidence; not universal rule |
| Candidate-reported | A person’s own interview observation | Tie to role, level, region, date and “may vary” |
| Secondary synthesis | Credible former-interviewer or editorial synthesis | Corroboration; weaker than current first-party |
| Engineering Foundry inference | Preparation recommendation derived from evidence | Display as advice, never hidden scoring policy |
| Candidate-confirmed private | Recruiter/invite/process information for this user | Governs their application; remains private |

Confidence applies claim by claim.

## 12.3 Company coverage

| Company | Target status | Evidence posture |
| --- | --- | --- |
| Amazon | P0 / current mature | Strong first-party interview and Leadership Principles material; level-specific distinctions must retain source dates. |
| Google | P0 / current mature | Use current candidate guidance and role-specific evidence; separate Googliness/leadership synthesis from hidden scoring claims. |
| Meta | P0 / current mature | Role/level and changing interview formats require freshness; candidate reports remain observations. |
| Walmart Global Tech | P0 / current mature | Be conservative where first-party process detail is limited; preserve general versus company-specific boundary. |
| Microsoft | P0 priority | Official competency and interview resources; process varies by role. |
| NVIDIA | P0 priority | Role/domain variation is significant; avoid one universal loop. |
| OpenAI | P0 priority | Current official interview guide, values and role materials; fast-moving and role-specific. |
| Anthropic | P0 priority | Current careers principles and mission/safety context; do not force safety language into unrelated stories. |
| Atlassian | P0 priority | Official values/interview information and role variation; freshness required. |
| Uber | P0 priority | General engineering preparation plus sourced role/level/process observations. |
| Apple | P1 expansion | Team and role variation; avoid universal behavioral/process claims. |
| Salesforce | P1 expansion | Use current official values/candidate material and sourced process observations. |
| IBM | P1 expansion | Role/client/project context varies; maintain cautious confidence. |
| Netflix | P1 expansion | Culture material is rich but should not be converted into a secret interview rubric. |
| Stripe | P1 expansion | Strong engineering role expectations; process details require current evidence. |
| Adobe | P1 expansion | Official hiring-stage information varies by role; label applicability. |
| JPMorgan Chase | P1 expansion | Program, geography and role variation; legal/financial-employer claims need current official sources. |

The P0 priority list is Amazon, Google, Meta, Walmart, Microsoft, NVIDIA, OpenAI, Anthropic, Atlassian, and Uber. Do not delay a stable public release merely to fill all seventeen with weak content. Neutral hubs are preferable to unsupported process claims.

## 12.4 Guide sections

Each complete guide should contain, where evidence exists:

1. Guide identity, last verified date, overall caveat.
2. Official preparation/candidate guidance.
3. Role/program applicability.
4. Process overview with uncertainty.
5. Coding/algorithmic preparation.
6. Practical coding, debugging, code review, frontend, or domain sections only when relevant.
7. System Design.
8. Low-Level Design.
9. ML Design only when role/process evidence supports it.
10. Behavioral/values.
11. Project/hiring-manager deep dive.
12. Level mappings and non-equivalence caveat.
13. General preparation sequence.
14. Approved related Interview Experiences.
15. Source list.
16. What to confirm with recruiting.
17. Freshness/conflict notice.
18. Deep links to exact EF practice.
19. Clear non-affiliation statement.

A missing section must not be padded with generic prose. Say “not established from current sources” and route to transferable preparation.

## 12.5 Claim schema

| Field | Contract |
| --- | --- |
| claim_id | Stable identifier. |
| company_slug | Canonical company. |
| section | Overview, process, coding, practical/LLD, System Design, ML Design, Behavioral, levels, logistics, source. |
| claim_text | Atomic publishable statement. |
| source_class | official / recruiter-commentary / candidate-reported / secondary-synthesis / EF-inference / candidate-confirmed-private. |
| source_title and URL | Direct source reference; never copied prose. |
| source_published_at | Date where available. |
| verified_at | Engineering Foundry review date. |
| applicability | Role, level, program, region, team, stage and modality. |
| confidence | high / medium-high / medium / cautious. |
| volatility | stable / periodic / fast-moving. |
| expires_or_review_by | Editorial freshness trigger. |
| conflict_group | Links claims that conflict or supersede one another. |
| superseded_by | Replacement claim/source. |
| display_label | User-facing evidence label. |
| editorial_note | Limits, uncertainty and inference rationale. |

## 12.6 Process model

Do not store “the company loop” as one timeless string.

A process observation should support:

```text
company
role family
job title / level where known
program
region
team where known
date
stage type
order if known
duration if sourced
modality
source class
confidence
verification date
```

A private candidate-confirmed loop can supersede generic expectations for that application without rewriting the public guide.

## 12.7 Level model

Engineering Foundry uses:

- Entry / SDE I.
- Mid / SDE II.
- Senior.
- Staff+.
- Management where separately supported.

Company titles are contextual. Never assert exact equivalence without strong evidence.

Level guidance should explain evidence expectations:

- Entry: fundamentals, learning, ownership at available scope.
- Mid: independent end-to-end execution and trade-offs.
- Senior: ambiguous architecture/risk/influence and durable mechanisms.
- Staff+: organizational technical direction and leverage.
- Management: people leadership, hiring/development, team health, delegation and organization—not merely “larger IC stories.”

## 12.8 Role overlays

Apply only when supported:

- Backend/generalist.
- Frontend.
- Mobile.
- Infrastructure/SRE/platform.
- ML/SWE-ML/Applied Scientist.
- Data.
- Security.
- Embedded/systems.
- TPM/program.
- Engineering management.

Do not invent a role overlay from the company’s brand.

## 12.9 User experience

The guide must visually separate:

- Official source.
- Candidate-reported.
- EF recommendation.
- Candidate-confirmed private process.

Each volatile claim should expose:

- Source.
- Applicability.
- Last verified.
- Confidence.
- “May vary” where appropriate.

Company cards and pages must not show fake readiness, unsupported weighting, or source-free “most asked” topics.

Deep links should open exact actions, for example:

- A role/level/configured DSA set.
- A particular System Design practice mode.
- Behavioral story category practice.
- Relevant round dossier.
- Company-scoped approved Experience directory.
- Application loop setup.

## 12.10 Behavioral company modifiers

Permitted outputs:

- Current public principles/values.
- Where behavioral or values evaluation appears if documented.
- Candidate-reported placement where not official.
- Story categories worth preparing.
- Likely follow-up themes inferred from role/principle evidence and labeled EF inference.
- Entry/mid/Senior emphasis.
- “Why company?” evidence prompts.

Do not claim a company secretly scores an internal rubric.

## 12.11 Freshness workflow

- Fast-moving interview/process/tool facts: review at least quarterly or sooner when source changes.
- Values/principles and official candidate guides: recheck on scheduled review and source change.
- Candidate reports: retain interview/report date; never silently refresh.
- Job postings: snapshots support only the role/time observed.
- Broken or materially changed source: mark needs review; do not hide age.
- Conflicting official information: display conflict and ask candidate to confirm.
- Stale claims can degrade to cautious/unpublished without deleting history.

An admin freshness queue should show company, claim, source, last checked, review-by date, status, and action.

## 12.12 Company Guide exclusions

Do not:

- Scrape and republish Glassdoor, LeetCode, Blind, or paywalled content.
- Reconstruct proprietary questions.
- Infer frequencies from tiny samples.
- Present candidate reports as policy.
- Use numerical weighting such as “40% DSA” without a defensible current dataset.
- Claim one team’s loop is universal.
- Hide source date.
- Build branded golden architectures.
- Publish recruiter/private user information.
- Create fake reports or test users to make pages look active.

## 12.13 Company Guide acceptance criteria

- Ten priority companies have either sourced complete guides or honest neutral hubs; unsupported sections remain absent.
- Every factual process claim has source class, applicability, date and confidence.
- Official, reported, EF and private layers are distinct.
- Private candidate-confirmed process overrides generic planning only for that application.
- Company guide to exact practice handoffs are public-safe when accounts are disabled.
- Related public experiences are approved and consented only.
- Stale/conflicting sources enter a review state.
- Mobile, keyboard, text resize, source links, noindex/metadata and empty states pass.

# 13. Interview Experiences specification

## 13.1 Purpose

Interview Experiences is a genuine, moderated, freshness-aware contributor directory.

It is not:

- A scraped review aggregator.
- A proprietary question bank.
- A place for fake launch activity.
- A replacement for official Company Guides.
- A private Playbook debrief.
- A venue for interviewer identities or confidential links.

Published reports focus on high-level process, round type, topic families, timing, broad context, and preparation lessons.

## 13.2 Public versus private model

**Public**

- Approved.
- Publication consent true.
- Safe fields only.
- Optional anonymous or chosen username identity.
- Report/interview date and context.
- “May vary” and non-affiliation.
- Correction/removal path.
- Company-scoped and filterable directory.
- No fake counts.

**Private/authenticated**

- Create.
- Preview.
- Save draft.
- Submit.
- Edit permitted states.
- Withdraw.
- Delete permitted states.
- View moderator note.
- Choose identity and publication consent.
- Own reports only, protected by actor-derived RLS/RPC boundaries.

Public anonymous reads must use an anon-key client independent of the accounts feature flag. Mutation and owned-record reads remain authenticated.

## 13.3 Lifecycle

| Status | Meaning | Public? |
| --- | --- | --- |
| draft | Private, editable by author. | No |
| submitted | Awaiting moderation; author may withdraw. | No |
| needs_changes | Moderator requests revision; author can edit. | No |
| approved | Eligible for publication only when publication consent remains true. | Yes |
| rejected | Not publishable; author may view/delete as policy permits. | No |
| archived | Previously approved or retained but removed from current public directory. | No |
| withdrawn | Author removed from review/publication. | No |

Transitions must be explicit and tested. Approval without publication consent must never expose a report.

## 13.4 Submission fields

Allowed structured fields:

- Company name, canonicalized when recognized.
- Role title.
- Level.
- Country or broad region, not precise location.
- Interview month/date at a privacy-appropriate granularity.
- High-level summary.
- Preparation lessons.
- One or more round types.
- Topic families.
- Broad process notes.
- Public identity choice.
- Publication consent.
- Author-controlled correction/withdrawal.
- Moderation status and review note.

Forbidden or actively discouraged:

- Exact proprietary question wording.
- Interviewer names/contact details.
- Candidate personal identifiers.
- Private links, credentials, take-home code, assessment screenshots.
- Defamatory speculation.
- Fabricated outcome or process.
- Employer confidential information.
- Compensation details unless a separately scoped, safe product requires them.
- Copied text from another platform.

## 13.5 Moderation

Moderation checks:

1. Contributor consent.
2. Ownership/originality.
3. Exact-question or assessment leakage.
4. Personal information.
5. Confidential/company information.
6. Harassment/defamation.
7. Usefulness and clarity.
8. Company/role/date/context.
9. Source/identity status.
10. Duplicate or coordinated spam.
11. Staleness/correction.
12. Whether abstraction can preserve value safely.

Moderator actions:

- Approve.
- Request changes with private note.
- Reject.
- Archive/remove.
- Correct safe metadata with audit trail where policy allows.
- Respond to removal/correction request.
- Escalate abuse/security/legal concern.

Admin access is least-privilege and audited.

## 13.6 Directory

Filters may include:

- Company.
- Role family/title.
- Level.
- Broad region.
- Date/recency.
- Round type.
- Topic family.
- Identity visibility.
- Status is never user-selectable publicly; only approved/consented is queried.

Company handoffs use dedicated company routes where possible. A selected company with zero reports must show a company-specific empty state, not unrelated reports.

Counts describe exactly what is counted, such as “3 approved reports matching these filters.” Do not show active-user, acceptance, interview-success, or company-frequency conclusions.

## 13.7 Freshness and corrections

- Display interview month/date where safe.
- State that processes vary.
- Let contributors and affected parties request correction/removal.
- Archive reports that become inaccurate, unsafe, withdrawn, or superseded.
- Do not rewrite the original report silently.
- Preserve moderation/audit history privately.
- A report is evidence of one experience, not a statement of current policy.
- Company Guide synthesis may consume reports only with correct source label.

## 13.8 Privacy and analytics

Analytics can record fixed, allowlisted events such as directory viewed, filter changed, submission started, and submission completed with safe categorical properties.

Never include:

- Summary.
- Preparation lessons.
- Exact company free text before canonicalization unless explicitly allowed and proven safe.
- Role text.
- Region text.
- Date.
- Round notes.
- Topic free text.
- Report ID if treated as private/unpublished.
- Moderator note.
- Author identity.
- Draft content.

## 13.9 Experience acceptance criteria

- Public reads work with accounts disabled when public Supabase configuration exists.
- Public reports are request-time or bounded-revalidated and not frozen indefinitely at deployment.
- Public predicates always require approved + publication consent.
- Author writes use controlled authenticated boundaries.
- Recognized companies are canonicalized at the server trust boundary.
- Unknown company input remains honest user text and is moderated.
- Company-scoped routes never leak unrelated reports.
- Lifecycle transitions and RLS are qualified with two users.
- No scraped/copied/fabricated/test-user report is published.
- Empty state is honest.
- Correction, removal, archive and abuse paths exist.
- Private Playbook debrief never auto-publishes.

# 14. Low-Level Design and Low-Level Systems specification

## 14.1 Product boundary

**Low-Level Design (LLD)** is object/domain design for software interviews.

It is separate from:

- High-level distributed System Design.
- DSA problem solving.
- A design-pattern encyclopedia.
- Low-Level Systems/C++/OS interviews.
- Production implementation of an entire distributed service.

The LLD interview loop is:

```text
clarify use cases
→ identify domain concepts
→ assign responsibilities
→ define relationships/interfaces
→ model state and invariants
→ walk representative flows
→ address concurrency where relevant
→ test
→ evolve one requirement
```

## 14.2 Information architecture

```text
/low-level-design
/low-level-design/lessons/[slug]
/low-level-design/practice
/low-level-design/practice/[slug]
/low-level-design/rubric
```

Optional future:

```text
/low-level-systems
/low-level-systems/[topic]
/low-level-systems/practice
```

Do not mix the two tracks under an ambiguous “low level” label.

## 14.3 Required LLD lessons

| # | Lesson | Objective | Required flow | Common failure |
| --- | --- | --- | --- | --- |
| 1 | LLD interview approach | Clarify use cases, constraints and evaluation before naming classes. | Requirements → domain → responsibilities → interfaces → state/invariants → flows → change/testing. | Starting with patterns/classes before behavior. |
| 2 | Requirements and use cases | Identify actors, commands, queries, workflows, constraints, out-of-scope behavior and quality attributes. | Parking/elevator/notification use-case boundaries. | Treating every possible feature as required. |
| 3 | Domain modeling | Choose entities, values, identities, aggregates and relationships that reflect business rules. | Reservation, parking spot, ticket, vehicle as distinct concepts. | One giant object or database-shaped domain. |
| 4 | Responsibilities and ownership | Place behavior and state where invariants can be protected. | Who creates, mutates, authorizes and observes each state. | Anemic data bags or god services. |
| 5 | Relationships and interfaces | Use composition, inheritance, protocols/interfaces and dependency direction deliberately. | Payment provider port, repository abstraction, strategy boundary. | Pattern/inheritance for its own sake. |
| 6 | State, invariants and lifecycle | Model state machines, transitions, illegal states, idempotency and concurrency-sensitive invariants. | Reservation pending → confirmed → cancelled/expired. | Boolean soup and unguarded transitions. |
| 7 | Patterns as tools | Apply Strategy, Factory, Observer, State, Adapter, Command, Repository and similar patterns only when a change force justifies them. | Notification channels and payment providers. | Pattern catalog memorization. |
| 8 | Concurrency, testability and evolution | Address races where relevant, isolate dependencies, test behavior, and evolve requirements without redesigning everything. | Two users reserving one resource; new channel/provider. | Adding locks everywhere or ignoring race entirely. |

## 14.4 LLD lesson contract

Every lesson must contain:

- Interview decision/problem.
- Mental model.
- Use cases and non-goals.
- Domain example.
- Bad design and why it fails.
- Better design with responsibility and invariant reasoning.
- Interface/code sketch in at least one language where useful.
- Pattern only after the change force appears.
- Representative flow.
- Test cases.
- Evolution follow-up.
- Concurrency note where relevant.
- Boundary to System Design.
- Entry/mid/Senior expectations.
- Practice handoff.

## 14.5 Practice designs

Target at least six original, differentiated prompts. Eight candidates are listed so the repository can choose the strongest reviewed set.

| Practice design | Core learning | Scope guard |
| --- | --- | --- |
| Parking allocation system | Resource types, entry/exit, ticket, availability, pricing boundary, concurrency. | Do not overbuild a city-wide distributed platform. |
| Elevator dispatch | Requests, car state, scheduling strategy, safety/state transitions, simulation. | Separate LLD dispatch policy from real control-system certification. |
| Notification orchestrator | Channels, preferences, templates, providers, retry/idempotency, rate limit. | Patterns must reflect provider/channel change forces. |
| Reservation / booking system | Inventory hold, expiration, confirmation, cancellation and race conditions. | Use state/invariant modeling; high-level storage scaling is secondary. |
| Vending machine or kiosk | State machine, inventory, payment, change/refund, hardware boundary. | Useful foundation; avoid trivial class diagram only. |
| Board game / turn-based engine | Rules, turns, players, actions, validation, extensibility and testing. | Keep UI/networking outside core unless asked. |
| Splitwise-style expense ledger | Users/groups/expenses/splits, validation, balance derivation and settlement views. | Do not confuse derived balance with mutable source of truth. |
| Rate-limited job scheduler | Jobs, triggers, states, policies, retries, cancellation and execution interfaces. | Bridge to System Design only after a coherent object model. |

Every practice dossier requires:

1. Prompt and scope.
2. Clarifying questions.
3. Use cases.
4. Functional/non-functional constraints relevant at object level.
5. Domain model.
6. Responsibilities.
7. Interfaces.
8. State and invariants.
9. Representative sequence/flow.
10. Error handling.
11. Concurrency issue where natural.
12. Testing strategy.
13. Requirement-change follow-ups.
14. Multiple defensible alternatives.
15. Rubric.
16. No golden class diagram.

## 14.6 LLD rubric

Dimensions:

- Requirement and scope control.
- Domain modeling.
- Responsibility/ownership.
- Interface and dependency design.
- State/invariant correctness.
- Representative-flow validation.
- Appropriate pattern use.
- Concurrency judgment.
- Error/idempotency handling.
- Testability.
- Extensibility/evolution.
- Communication and trade-offs.

Senior candidates should discuss change forces, failure boundaries, ownership, concurrency, operational implications, and evolution. They are not expected merely to produce more classes.

## 14.7 Progress and practice

- Anonymous lesson completion can be browser-local and honestly labeled.
- Authenticated progress may be durable.
- Practice can be Guided, Independent, and Timed.
- Self-review comes before model-assisted feedback.
- No opaque score or “correct UML.”
- Attempt data is private and excluded from analytics.
- The Playbook deep-link configures round, level, company modifier, and mode.

## 14.8 Low-Level Systems future track

This track is separately authorized only when product scope explicitly includes systems, embedded, performance, or C++ interviews.

| Area | Required coverage |
| --- | --- |
| Memory and representation | Stack/heap, object layout, alignment, pointers/references, ownership, lifetime, fragmentation. |
| Modern C++ ownership | RAII, value semantics, move, `unique_ptr`, `shared_ptr`, weak ownership, containers/iterators. |
| Concurrency | Threads, mutexes, condition variables, atomics, memory ordering, data races, deadlocks, false sharing. |
| Operating systems | Processes/threads, virtual memory, syscalls, files, scheduling, IPC, signals, synchronization. |
| Networking internals | Sockets, TCP/UDP behavior, blocking/nonblocking I/O, event loops, buffers, backpressure. |
| Performance | Cache locality, allocations, branch prediction, profiling, measurement, latency tails. |
| Debugging | Core dumps, sanitizers, tracing, deadlocks, memory corruption, race diagnosis. |
| Embedded/firmware | Fixed-width values, `volatile`, memory-mapped I/O, interrupts, bounded memory, state machines, UART/I²C/SPI. |
| Low-latency/HFT extensions | Allocation avoidance, lock contention, atomics, Linux/runtime behavior, deterministic latency. |

Low-Level Systems should combine:

- A normal DSA baseline.
- Language/runtime depth.
- Memory/ownership.
- Concurrency.
- OS/networking.
- Performance and debugging.
- Role-specific embedded or low-latency overlays.

It must not glorify manual memory management. Modern C++ should teach RAII and standard-library ownership. Specialist community anecdotes may identify pain points but do not establish universal frequency.

## 14.9 LLD exclusions

Do not:

- Start with a catalog of Gang of Four patterns.
- Force every design into microservices/databases.
- Treat UML notation precision as the main skill.
- Offer one golden class diagram.
- Mix distributed capacity planning into every LLD prompt.
- Call pointers/OS questions “LLD.”
- Add an evaluator that claims employer-level correctness.
- Store private design attempts in analytics.
- Add arbitrary code execution merely to animate diagrams.

## 14.10 LLD acceptance criteria

- Eight core lesson themes are covered without duplication.
- At least six original practice designs are published and differentiated.
- Every design protects invariants and walks a representative flow.
- Patterns appear only with a justified change force.
- Concurrency is addressed where relevant, not everywhere.
- Tests and requirement evolution appear on every practice page.
- Boundary to System Design and Low-Level Systems is explicit.
- Anonymous and authenticated progress behave as documented.
- Mobile diagrams/code and keyboard use pass.

# 15. Salary Negotiation specification

## 15.1 Purpose

Salary Negotiation is a post-offer decision and communication section. It teaches the complete package and truthful negotiation, not one base-salary number or a guaranteed tactic.

It is general education, not individualized legal, tax, securities, immigration, employment, or financial advice.

## 15.2 Information architecture

```text
/salary-negotiation
/salary-negotiation/[module]
/salary-negotiation#compare-offers
```

The Playbook hands off here after an offer. This section does not become part of active interview-preparation scoring.

## 15.3 Required modules

| # | Module | Required coverage | Product behavior |
| --- | --- | --- | --- |
| 1 | Compensation package anatomy | Base, bonus, sign-on, equity, benefits, retirement, relocation, severance, clawbacks and written terms. | Build a component inventory; distinguish guaranteed, target, contingent and estimated value. |
| 2 | Level, scope and compensation bands | Role scope, title, leveling, bands, location model and internal constraints. | Ask for level/scope clarity; do not invent market bands. |
| 3 | Timing and process | When to ask questions, clarify the offer, counter, request time, and close. | Use actual deadlines; no universal waiting trick. |
| 4 | Honest leverage and market research | Competing offers, current compensation, role fit, skills, alternatives, walk-away conditions and reservation-price privacy. | Ambitious request is fine; fabricated leverage is not. |
| 5 | Counters, low offers and scripts | Specific request, rationale, flexible components, recruiter constraints, final limits and relationship preservation. | Provide editable language; no guaranteed-outcome claim. |
| 6 | Startup equity and risk | Grant type, shares/options/RSUs, strike, vesting, exercise window, dilution, preference/valuation context, liquidity and taxes. | General education only; actual documents need qualified review. |
| 7 | Internal raises and promotions | Scope evidence, impact, level expectations, timing, manager process, written follow-up and alternatives. | Do not assume external-offer bluffing is safe. |
| 8 | Remote, geography and written terms | Location-based pay, currency, employment entity, remote expectations, relocation, repayment, IP/noncompete/confidentiality and offer documentation. | Jurisdiction and current written terms matter; avoid legal conclusions. |

## 15.4 Editorial principles

- Negotiate using true information.
- The candidate may keep their reservation price private.
- A request can be ambitious without being dishonest.
- Distinguish asking, anchoring, evidence, leverage, deadline, and walk-away condition.
- Recruiters may face real bands/policy constraints.
- Components can trade off.
- A final limit can be accepted, declined, or compared; do not teach harassment.
- No tactic guarantees improvement.
- Negotiation can sometimes create downside; state uncertainty without fearmongering.
- Use actual written terms.
- Market data is contextual, dated, and not a promise.
- Startup equity is uncertain and not equivalent to cash.
- Internal negotiation differs from a new-offer counter.
- Employment/legal issues depend on jurisdiction and contract.

## 15.5 Private offer comparison worksheet

Session-only input fields may include:

- Offer label.
- Company label.
- Role and level.
- Location/remote.
- Base.
- Target bonus and whether explicitly guaranteed.
- Sign-on.
- Other guaranteed compensation.
- Equity grant value entered by the user.
- Vesting period/schedule summary.
- Benefits and scope notes.
- Start date.
- Deadline.
- Risks/questions.
- Private draft message.

Math must remain transparent.

Example:

```text
first-year guaranteed cash
= base
+ sign-on
+ other explicitly guaranteed compensation
+ bonus only when explicitly guaranteed
```

Keep separate:

- Target bonus.
- Annualized entered equity.
- Benefits.
- subjective scope/team/growth/location factors.
- tax/liquidity/risk.

Annualized equity is only the user-entered grant value divided by the vesting period when applicable. It is not realized value, market prediction, tax estimate, or recommendation.

Privacy copy must state:

- Inputs stay in in-memory page state.
- EF does not transmit or store them.
- Refresh/close clears them.
- Copy writes only the assembled message to the user’s device clipboard.
- Clipboard failure is reported accessibly.
- When analytics is enabled/available, opening may emit a fixed value-free event.
- The event contains only an allowlisted categorical surface and no entries.

## 15.6 Message builder

Suggested structure:

1. Genuine enthusiasm.
2. Clarification or rationale.
3. Specific request.
4. Flexible alternative components.
5. Respectful closing.

Examples must be editable, original, truthful, and not falsely assert another offer or deadline.

Support situations:

- Standard counter.
- Low offer.
- No competing offer.
- Competing offer with permission-safe level of detail.
- Level mismatch.
- Sign-on/equity/base trade.
- Deadline extension request.
- Remote/geography question.
- Internal raise/promotion.
- Final-limit decision.

Do not auto-send email.

## 15.7 Startup equity

Required questions:

- What instrument?
- Number of shares/options/units and percentage on what denominator, if provided?
- Strike/exercise terms?
- Vesting and cliff?
- Expiration/exercise window?
- Latest valuation and its meaning/limits?
- Preferred versus common distinctions at general educational depth.
- Dilution.
- Liquidity/secondary/tender history without prediction.
- Repurchase/clawback/termination conditions.
- Tax/jurisdiction questions requiring qualified advice.
- What is in writing?

Do not calculate a false “expected value” without user-supplied assumptions and visible uncertainty.

## 15.8 Market and legal freshness

Any salary range, pay-transparency law, noncompete rule, tax treatment, securities rule, visa/employment implication, or jurisdiction-specific claim must:

- Be checked against current authoritative sources.
- Name jurisdiction.
- Show review date.
- Avoid individualized advice.
- Direct the user to appropriate professional review when material.

Do not build the product around volatile salary bands unless a maintained data contract exists.

## 15.9 Salary exclusions

Do not:

- Recommend fake offers, documents, recruiter claims, deadlines, or current salary.
- Teach one universal percentage increase.
- Promise that negotiation never harms an offer.
- Rank offers with one magic score.
- Treat equity as cash.
- Give legal/tax/immigration conclusions.
- Save sensitive offer inputs by default.
- Send entries to analytics.
- Auto-contact recruiters.
- Shame candidates for accepting or declining.
- Turn the section into a market-prediction product.

## 15.10 Salary acceptance criteria

- Eight modules exist and are cross-linked.
- Playbook offer state reaches this section.
- Worksheet math and assumptions are visible.
- All values remain session-only unless a future explicitly consented persistence product is separately approved.
- Clipboard and optional analytics behavior are accurately disclosed.
- No private entry appears in URL, logs, analytics, server actions, local storage, or cookies.
- Examples are truthful and editable.
- Startup equity contains uncertainty and professional-review boundaries.
- Jurisdiction-dependent content is dated and scoped.
- Mobile input, keyboard, errors/status, copy failure and text resize pass.

# 16. AI Basics / “AI for Noobs” specification

## 16.1 Product decision

Build this as a post-launch learning expansion, not a blocker for the interview-preparation v1.

Recommended placement:

```text
Learn → AI Basics
```

Landing identity:

> **AI for Noobs**
>
> AI explained visually. No jargon. No coding required.

The target is ordinary adults who use or encounter AI but do not understand it. The section succeeds only if nontechnical users can build accurate mental models and safer practical habits.

It must remain distinct from ML System Design. AI Basics explains modern AI to normal users; ML Design prepares technical candidates to design production ML systems.

## 16.2 Tier model

- **Beginner:** use and understand AI safely without coding.
- **Intermediate:** understand components and simple technical workflows.
- **Advanced:** design and evaluate practical AI applications; still not a frontier-model research syllabus.

Do not expose all tiers as one overwhelming page. Start with a short self-selection based on goals and confidence; no knowledge-shaming.

## 16.3 Beginner curriculum

Target eight core launch lessons plus two expansion lessons, each roughly one focused learning objective and one meaningful interaction.

| # | Lesson | Learning outcome | Exercise | Primary asset |
| --- | --- | --- | --- | --- |
| 1 | What AI is—and is not | AI systems perform learned or programmed tasks; avoid intelligence/personhood mythology. | Sort examples into rule, prediction, generation and ordinary software. | Concept map |
| 2 | AI, machine learning, generative AI and LLMs | Understand nesting/overlap without jargon. | Classify tools and explain what an LLM does. | Interactive family map |
| 3 | How ChatGPT-like systems generate text | Next-token prediction, probability, randomness and no hidden database of perfect answers. | Manipulate probabilities and temperature in Token Playground. | Signature Token Playground |
| 4 | What AI is good and bad at | Pattern-rich drafting/transformation versus truth, current facts, judgment and high-stakes decisions. | Choose safe use strategy for everyday tasks. | Task triage lab |
| 5 | How to write a useful prompt | Goal, context, constraints, examples, output format and iterative refinement. | Repair vague prompts in Prompt Lab. | Signature Prompt Lab |
| 6 | Why AI hallucinates | Plausible generation is not verified truth; confidence style is not evidence. | Break and verify an answer in Hallucination Lab. | Signature Hallucination Lab |
| 7 | How to verify AI output | Use primary sources, cross-checks, calculations, tests and uncertainty. | Verification checklist on a changing fact and a reasoning task. | Source-check exercise |
| 8 | Privacy and safe-to-paste decisions | Inputs may be stored/processed according to tool policy; classify sensitive data before sharing. | Redact or avoid example workplace/customer data. | Safe-to-paste exercise |
| 9 | Context, memory and instructions | Context windows, conversation state, saved memory and tool-specific differences. | Watch context fill and see dropped/competing instructions. | Context-window visual |
| 10 | Choosing tools and using AI at work | Use AI as a bounded assistant, review its work, follow employer rules, and keep human accountability. | Create a verify-and-review workflow. | Workflow builder |

### Beginner lesson contract

Each lesson should be understandable without prior technical vocabulary and contain:

1. One real question the learner has.
2. One plain-language mental model.
3. One visual or direct manipulation.
4. One misconception.
5. One everyday example.
6. One safe-use or verification behavior.
7. One tiny challenge.
8. One recap in the learner’s own words.
9. Next lesson.
10. Sources/freshness only where factual claims require them.

Define a term when first used; do not replace the term with an inaccurate analogy forever.

## 16.4 Signature interactions

### Token Playground

Allow the learner to:

- See a short context.
- Inspect a small set of possible next tokens.
- Change probabilities/temperature through a simplified pedagogical simulation.
- Generate several continuations.
- Observe that plausible continuations differ.
- Understand that the visual is illustrative, not the exact hidden state of a commercial model.
- Connect next-token behavior to fluency and hallucination.

### Prompt Lab

Teach:

```text
goal
+ relevant context
+ constraints
+ examples when useful
+ output format
+ review / iteration
```

Let the learner compare a vague prompt and an improved prompt, then edit one. Do not teach “magic prompt” folklore or universal incantations.

### Hallucination Lab

- Present an answer with a mix of plausible and verifiable claims.
- Ask which claims require verification.
- Let the learner inspect sources or discover missing support.
- Show that tone/confidence does not establish truth.
- Require a verification plan before revealing explanation.
- Use safe, original, non-high-stakes examples.

### Safe-to-Paste exercise

Classify:

- Public information.
- Personal information.
- Confidential workplace/customer data.
- Credentials/secrets.
- Health/legal/financial information.
- Content under another person’s control.
- Redacted/abstracted alternatives.

Do not claim every AI provider has the same retention or training policy. Teach users to inspect the actual tool and employer policy.

## 16.5 Intermediate curriculum

| Module | Required coverage |
| --- | --- |
| Tokens and context deeper dive | Tokenization, context budget, prompt/output trade-offs, long-context limits and current-tool variability. |
| Embeddings | Meaning-oriented vectors, similarity, projection caveat and uses. |
| Retrieval and RAG | Ingest, chunk, retrieve, construct context, generate, cite and evaluate. |
| Tool/function calling | Structured outputs, schema validation, permissions, failures and retries. |
| Agents and workflows | Bounded planning/tool use/state, autonomy trade-offs, approval points and loops. |
| APIs and automation | Requests, authentication concepts, rate limits, cost, errors and safe integration. |
| Model choice | Quality, latency, cost, privacy, modality, context and reliability trade-offs. |
| Evaluation | Test sets, criteria, regression checks, human review, groundedness and failure analysis. |

## 16.6 Advanced curriculum

| Module | Required coverage |
| --- | --- |
| Production RAG | Permissions, index lifecycle, hybrid retrieval, reranking, evaluation, injection and monitoring. |
| Agent engineering | State, memory, planning, HITL, idempotency, tool contracts, observability and bounded autonomy. |
| Evals and quality systems | Datasets, judges, rubrics, disagreement, regression, online monitoring and audit. |
| Fine-tuning and adaptation | When prompting/RAG/tools are insufficient; data/label quality, evaluation and rollback. |
| Serving, cost and latency | Caching, batching, context cost, model routing, fallbacks, rate limits and budgets. |
| Security and responsible AI | Prompt injection, data leakage, excessive agency, permissions, abuse, human review and governance. |
| Multimodal systems | Text/image/audio inputs, grounding, privacy and evaluation; no deep specialty unless demanded. |
| Operations and versioning | Prompt/model/index/tool versions, traces, incident response and change control. |

Advanced does not mean:

- Train a frontier model.
- Derive every transformer equation.
- Master CUDA/distributed training.
- Build unrestricted autonomous agents.
- Learn every framework.

Those are separate specializations.

## 16.7 Teaching principles

- Visualize invisible state and flow.
- Let the learner manipulate before reading a long explanation.
- Use tiny examples.
- Prefer one concept per interaction.
- Label simulations as simulations.
- Show failure and uncertainty.
- Connect every concept to a useful action.
- Avoid anthropomorphism.
- Avoid fear-based or hype-based language.
- Explain current product-specific facts with dates.
- Use primary sources for provider policies and technical facts.
- Never imply that an AI answer is safe because it cites something.
- Keep workplace and personal privacy visible.
- Require human review for consequential use.
- Support text, keyboard, reduced motion, and screen-reader alternatives.

## 16.8 Progress and measurement

Progress should answer:

```text
clicked
→ interacted
→ explained/answered
→ applied safe behavior
→ continued
→ returned
```

Useful section metrics:

- Lesson start/completion.
- Interaction completion.
- Pre/post understanding check where honestly designed.
- Next-lesson continuation.
- Seven-day return.
- Safe-use exercise completion.
- Drop-off and error rate.

Do not optimize only for time on page, total page count, badge count, or daily streak.

Segment outcomes by self-described confidence only with consent and without judgment:

- I avoid technical topics.
- I use AI but do not understand it.
- I am comfortable with technology.
- I am an engineer.

If only engineers succeed, the section has missed its target.

## 16.9 AI Basics route model

```text
/ai-basics
/ai-basics/beginner
/ai-basics/beginner/[lesson]
/ai-basics/intermediate
/ai-basics/intermediate/[lesson]
/ai-basics/advanced
/ai-basics/advanced/[lesson]
/ai-basics/playgrounds/tokens
/ai-basics/playgrounds/prompts
/ai-basics/playgrounds/hallucinations
/ai-basics/playgrounds/privacy
```

Do not add a top-level navigation tab before real usage supports that weight.

## 16.10 AI Basics exclusions

Do not:

- Copy another course.
- Market it as a complete AI degree.
- Claim commercial-model internals that are not public.
- Teach provider-specific limits/prices without date.
- Anthropomorphize the model.
- Present prompting as guaranteed control.
- Encourage pasting confidential material.
- Add certificates/badges before learning behavior is proven.
- Build a huge video library before the visual/interactivity thesis is validated.
- Add community Q&A without moderation density.
- Add a broad code sandbox to Beginner.
- Add autonomous-agent workflows before permissions/evals/HITL.
- Present a demo output as ground truth.

## 16.11 AI for Kids

AI for Kids is **not authorized** by this master goal.

It requires a separate product and safety plan covering:

- Exact age ranges.
- Child-appropriate pedagogy.
- Parent/guardian involvement and consent.
- Privacy and data minimization.
- Jurisdictional child-safety/legal review.
- Moderation.
- Advertising and commercial boundaries.
- School/classroom use.
- Accessibility.
- Crisis/harm content.
- Evaluation.

Do not create routes, copy, accounts, or analytics for children from this document.

## 16.12 AI Basics acceptance criteria

Before release:

- Product scope and audience are approved.
- Beginner curriculum and signature interactions are reviewed.
- Simulations are labeled and technically honest.
- No coding is required for Beginner.
- Privacy and verification are core lessons.
- Mobile, text resize, keyboard, screen reader and reduced-motion equivalents pass.
- No current-provider fact is undated.
- Analytics contains no prompt text or personal input.
- The section remains under Learn until evidence supports stronger navigation prominence.

# 17. Visualization Lab specification

## 17.1 Purpose

The Visualization Lab is a curated learning tool. Its job is to make a spatial, temporal, state, or trade-off concept easier to understand.

It is not an arbitrary online code-execution product.

The strongest rule is:

> Build a custom visualization only when the behavior cannot be explained as effectively by clear prose, a table, or a static Mermaid diagram.

Most architecture content should use clear, maintainable diagrams. Invest in custom interaction where state movement is the lesson.

## 17.2 Safety boundary

Launch-compatible visualization uses:

- Pre-generated traces.
- Deterministic client-side state transitions.
- Bounded synthetic data.
- Predefined parameters.
- No arbitrary shell/system access.
- No untrusted code execution.
- No uploaded package installation.
- No network access from user code.
- No claims that a toy simulator reproduces production exactly.

An unrestricted multi-language code sandbox is a separate high-risk project.

## 17.3 Prioritized visuals

| Visualization | Learning state | Execution model | Priority |
| --- | --- | --- | --- |
| DSA pointer/window traces | Pointers, active region, invariant, counts and complexity. | Pre-generated or deterministic client trace | P1 curated |
| BFS/DFS/heap/DP/DSU traces | Frontier, stack, heap invariant, dependency graph, compression. | Deterministic | P1 curated |
| Consistent hashing | Ring placement, replication, node add/remove and movement. | Deterministic interactive | High-value |
| Token-bucket rate limiting | Tokens over time, bursts, refill and allow/reject. | Deterministic interactive | High-value |
| Cache stampede | Expiry, concurrent misses, locking/single-flight and stale-while-revalidate. | Deterministic timeline | High-value |
| Kafka-style partitions and consumers | Partition ownership, ordering, lag and rebalance. | Deterministic timeline | High-value |
| Replication lag and consistency | Write/read timelines and stale outcomes. | Deterministic | High-value |
| Fan-out strategies | Write/read amplification and celebrity/hot-key effects. | Deterministic scenario | P1 |
| Geospatial indexing | Cells/geohashes and candidate refinement. | Deterministic spatial | P1 |
| ML thresholds | Precision/recall/action queue/cost as threshold changes. | Synthetic pedagogical data | ML v1 |
| Temporal split and leakage | Random versus rolling validation; future feature leakage. | Synthetic time series | ML v1 |
| Serving latency/throughput/cost | Batching, queueing, hardware utilization and p99. | Synthetic queue model | ML P1 |
| RAG retrieval path | Chunking, retrieval, permissions, rerank, context and generation. | Deterministic document set | ML v1 |
| LLD state machine | Allowed/illegal transitions and representative flow. | Deterministic | P1 |
| AI Token Playground | Illustrative next-token probabilities and sampling. | Synthetic/illustrative | AI Basics P1 |

## 17.4 Common visual contract

Every visual must provide:

- Learning objective.
- Plain-text explanation.
- Start/reset.
- Step or play/pause where temporal.
- Keyboard operation.
- Visible focus.
- Reduced-motion behavior.
- Screen-reader equivalent or structured state table.
- Parameter bounds.
- Deterministic seed when randomness is simulated.
- Current state and invariant.
- Explanation of what changed.
- Why the state matters.
- Limitations.
- Link back to lesson/practice.
- Mobile layout without tiny controls or horizontal trapping.

Animations must not be the only information channel.

## 17.5 Trace schema

A reusable deterministic trace may contain:

```json
{
  "schema_version": 1,
  "trace_id": "stable-id",
  "content_version": "lesson-or-problem-version",
  "algorithm_or_system": "sliding-window",
  "inputs": {},
  "steps": [
    {
      "index": 0,
      "event": "expand-right",
      "state": {},
      "invariant": "window is currently valid",
      "explanation": "..."
    }
  ],
  "complexity_counters": {},
  "source": "Engineering Foundry original",
  "limitations": []
}
```

Validate trace schemas and content-version compatibility.

## 17.6 Visual exclusions

Do not:

- Animate every lesson.
- Build decorative moving diagrams.
- Require mouse dragging.
- Use color alone.
- Hide the actual rule.
- Present synthetic metrics as production data.
- Execute arbitrary code.
- Download/run user packages.
- Add a visual whose maintenance cost exceeds its learning value.
- Claim 2D embeddings are the actual complete space.
- Record private inputs in analytics.

## 17.7 Visualization acceptance criteria

- Every visual closes a named learning gap.
- A text/table alternative exists.
- Deterministic tests cover transitions and reset.
- Keyboard, focus, reduced motion and screen-reader output pass.
- Mobile controls meet touch-target and readability requirements.
- Trace/source/limitations are visible.
- Visual analytics contains interaction IDs, not user-entered content.

# 18. Supporting product and platform routes

These routes complete the journey and must follow the same trust, accessibility, and evidence standards.

| Surface | Purpose | Audience | Required contract |
| --- | --- | --- | --- |
| Homepage `/` | Explain product value, choose a track, continue recent work, show one primary next action. | Public with optional signed-in continuation | No fake activity; no dashboard clutter; core tracks visible; route health and mobile hero. |
| Prepare hub `/prepare` | Entry into context setup, general preparation, applications and Playbook. | Public orientation + private personalization | No dead account-only CTA; explain value before sign-in. |
| Resources `/resources` | Curated external and internal learning references with source/category/freshness. | Public | No link dump; broken-link audits; external trust/target attributes; not an affiliate directory unless disclosed. |
| Global search | Find lessons, patterns, questions, designs, companies, round guides and resources. | Public | Keyboard accessible; Escape returns focus; closed search never steals focus; URL/search results agree. |
| Community `/community` | Honest community pathways and moderation expectations. | Public | No fabricated member/activity counts; distinguish Discord from on-site community features. |
| Referrals `/referrals` | Private/local request and referrer toolkits; ethical communication. | Public/local | No matching/routing/guarantee; no employer-specific policy unless current official source; no private text analytics. |
| Challenges `/challenges` | Original practical engineering prompts and review frameworks. | Public with optional progress | Original/licensed only; clear scope/rubric; no fake company association. |
| Interview Tips `/interview-tips` | Public execution guidance and round index. | Public | Consistent with Playbook; no duplicate specialist curriculum; source methodology for volatile claims. |
| Applications `/applications/**` | Private pipeline, round tracking, status/history and application-specific preparation. | Authenticated private | Actor-derived access; RLS; no analytics content; export/delete; correct time zones. |
| Calendar `/calendar` | Private round events, reminders and external calendar exports. | Authenticated private | Time zone correctness; no duplicate scheduler truth; least-privilege worker; failure visibility. |
| Dashboard `/dashboard` | One current context, next action, upcoming interview and evidence continuation. | Authenticated private | No widget wall; no global readiness score; private data protected. |
| Onboarding `/onboarding` | Compact optional setup that demonstrates value and records explicit preferences. | Authenticated private | Skippable; no inferred preferences; deterministic routing; existing-account safe backfill. |
| Settings `/settings/**` | Account, preparation, interview, privacy/data and profile controls. | Authenticated private | Precedence clear; export/delete; auth-provider constraints; privacy copy accurate. |
| Authentication routes | Sign-in, sign-up, callback, recovery, account change. | Public/private boundary | Disabled-account behavior intentional; safe next path; no open redirect; SMTP/OAuth owner gates separate. |
| Profiles `/u/[username]` | Optional public identity with explicit visibility. | Public only when enabled/visible | No private progress/stories/applications; unavailable state honest; no indexing private profiles. |
| Feedback `/feedback` | Safe feedback intake with abuse controls and response expectations. | Public | No sensitive data request; WAF/rate-limit owner gate; contact fallback. |
| Admin `/admin/**` | Minimal moderation, freshness and operational health. | Privileged private | Least privilege; no public indexing; audit actions; server-side role check; no client-only guard. |
| About `/about` | Mission, scope, founder/product transparency and non-affiliation. | Public | No inflated adoption/impact claims. |
| FAQ `/faq` | Answer recurring product, privacy, evidence, account and content questions. | Public | No stale promises; link to canonical policies. |
| Contact `/contact` | Owned contact methods for correction, removal, abuse, security and general inquiry. | Public | Channels must work; do not promise unsupported response SLA. |
| Privacy `/privacy` | Accurate data inventory, purposes, retention, third parties, rights and contact. | Public legal policy | Qualified review owner gate; must match actual product; jurisdiction caveats. |
| Terms `/terms` | Use, content, accounts, acceptable behavior, IP, disclaimers and dispute terms. | Public legal policy | Qualified review owner gate; no copied terms; match actual features. |
| Robots/sitemap/metadata | Index public canonical content and exclude private/unsafe routes. | Public infrastructure | Canonical origin; no private route; no placeholder routes; social images and metadata assets. |
| Analytics and impact ledger | Measure useful actions and preserve objective historical evidence. | Internal/consented | No fake metrics; stable definitions; monthly exports; privacy guardrails; consent decision external. |

## 18.1 Homepage

The homepage should answer in one screen:

1. What is Engineering Foundry?
2. Who is it for?
3. What can I do now?
4. What should a returning user continue?

Required:

- Clear interview-preparation positioning.
- Core track selection: DSA, System Design, ML Design, Behavioral.
- Supporting tracks discoverable without overwhelming primary choice.
- Anonymous first useful action.
- Signed-in continue state when available.
- No fake user/activity numbers.
- No “AI-powered” headline unless a specific useful AI behavior is being described.
- One dominant action per state.
- Mobile and text-resize integrity.

## 18.2 Global search

Search indexes only publishable fields.

Result types:

- Lesson.
- Concept.
- Pattern.
- Question metadata.
- Design problem.
- Company.
- Round guide.
- Resource.
- Salary module.
- LLD practice.
- AI Basics lesson when released.

Requirements:

- Search dialog can open/close via keyboard.
- Escape closes only when open and restores focus to trigger.
- Closed search never captures Escape or steals focus.
- Result keyboard navigation and active-descendant semantics are correct.
- Query can be linked where useful.
- Search respects publication status/noindex.
- No private content.
- Type labels and destinations are clear.
- Empty state suggests actionable alternatives.
- Search is normalized consistently with destination filters.

## 18.3 Resources

Each external resource record includes:

```text
title
provider/author
type
topic
audience
description
URL
free/paid/variable where verified
source class
last verified
why EF recommends it
limitations
```

Do not assert current price without review date. Do not copy course material. Broken or redirected links enter review.

## 18.4 Referrals

The referral toolkit supports:

- Decide whether a request is appropriate.
- Research the role/company.
- Draft a concise truthful request.
- Supply a context packet.
- Follow up respectfully.
- Let a referrer decline.
- Referrer checklist for honest endorsement.
- Clear statement that no referral or response is guaranteed.
- Employer-policy links only from current official sources.
- Local/session-only draft unless an explicit private persistence feature is separately approved.

No marketplace, employee directory, paid referral, matching, mass outreach, or identity verification is implied.

## 18.5 Challenges

Challenges are original practical scenarios. Each includes:

- Context.
- Repository/system boundary.
- Requirements.
- Expected artifact.
- Time guidance as optional.
- Evaluation rubric.
- Hints.
- Solution summary after attempt.
- Privacy/integrity.
- No company attribution unless sourced.
- No hidden live assessment assistance.

## 18.6 Feedback and correction

Feedback categories:

- Content correction.
- Broken link.
- Accessibility.
- Privacy/security.
- Interview Experience correction/removal.
- Company-source issue.
- Product bug.
- General suggestion.

Never ask users to paste secrets, exact confidential questions, health/legal records, or private employer information.

## 18.7 Account-disabled public launch

When accounts are disabled:

- Public curricula, designs, resources, company guides, approved experiences, salary worksheet, referral builder and local practice remain useful as designed.
- Account-only CTAs either route to a clear unavailable state or use a public/local alternative.
- No CTA loops through sign-in and back to an unavailable route.
- Public pages do not initialize authenticated clients merely for optional features.
- Anonymous state is not mislabeled as saved to an account.
- Admin/private routes remain unavailable.
- Public data reads that are legitimately anonymous do not depend on the account flag.

## 18.8 Private platform

Authentication, applications, stories, attempts, plans, calendar, settings, profiles and admin must maintain:

- Server-side actor derivation.
- RLS and controlled RPC writes where intended.
- Cross-user isolation.
- CSRF/same-origin and redirect safety appropriate to framework.
- Pagination beyond backend default limits for exports.
- Complete account export or fail rather than truncate.
- Account deletion through server-only administrative boundary with cascades.
- Cache and revalidation that never crosses users.
- No private route indexing.
- No private content in error logs or analytics.
- Explicit retention/deletion.
- Safe recovery and email changes.
- Provider-specific owner gates before enabling production.

## 18.9 Analytics and impact evidence

Preferred product metrics:

- First useful action.
- Core track start.
- Lesson or practice completion.
- Continue-preparation use.
- Active plan adoption/continuation.
- Seven-day returning learner.
- Mock and reflection completion.
- Experience submission-to-approval conversion.
- Company guide → relevant practice conversion.
- Anonymous → account after value.
- Accessibility/mobile/error guardrails.
- Source freshness backlog.
- Moderation turnaround.
- Export/deletion success.
- Privacy/security incident count.

Do not optimize primarily for:

- Daily streak.
- Raw time on page.
- Total pages.
- Discord membership.
- Solved count.
- Total accounts.
- Vanity traffic without useful action.
- Fabricated testimonials or bot activity.

Impact records must preserve dated exports, metric definitions, releases, source history, authentic testimonials with permission, adoption evidence, and independent recognition. Never purchase or fabricate evidence.

# 19. Immediate repository and P1 defect backlog

This list is a starting audit, not permission to skip fresh repository discovery. Close proven defects before broad content expansion.

| Work item | Problem | Priority | Acceptance |
| --- | --- | --- | --- |
| Browser history synchronization | Behavioral and Mock Interview controls can drift from Back/Forward URL state. | P1 high | Controlled URL-to-state synchronization without query-keyed remounts; behavioral tests for direct link, typing/filtering, Back and Forward, focus retention. |
| DSA language mobile readability | Dense code/reference pages risk small typography, cramped tables and undersized touch controls. | P1 high | Rendered mobile audit; code horizontal behavior; minimum readable type; touch targets; no clipped controls; Python/Java critical flows. |
| Account-disabled private CTAs | Some public surfaces may still point into private workspaces when accounts are intentionally disabled. | P1 high | Central public-safe destination mapping or intentional unavailable state; route tests; no sign-in loop. |
| Desktop header Escape focus | Closing navigation/search should restore focus to the invoking control and closed layers must not capture Escape. | P1 high | Rendered keyboard test for search, menus and dialogs. |
| Rendered browser accessibility suite | Many current tests inspect source or static invariants rather than actual focus, landmark and responsive behavior. | P1 high | Add focused browser tests for navigation, search, forms, dialogs, filters, timers, errors/status and text resize. |
| Design-document synchronization | `.impeccable/design.json` may be stale relative to `DESIGN.md`. | P1 medium | Run the approved design-document workflow on a dedicated branch; review generated changes; no blind overwrite. |
| CI action deprecations | CodeQL and GitHub Actions annotations indicate future runtime/action deprecations. | P1 medium | Use official immutable updated action SHAs after Dependabot or explicit review; all checks green. |
| Content-source methodology UI | Some round dossiers and research-driven pages expose reviewed content without reader-facing source method. | P1 medium | Add source methodology metadata and page; no invented citation. |
| Research blueprint import | The repository has a gap inventory but not this full authoritative specification. | P1 blocker for large content expansion | Commit this document on a documentation-only branch; map it to repository state; do not implement generic filler. |
| Content manifest and coverage report | Route existence and content completeness are not centrally comparable. | P1 high | Machine-readable manifest with requirement IDs, status, source state, routes, owners, tests and generated coverage report. |
| Company freshness operations | Volatile claims require a durable review queue and dated source state. | P1 high | Claim-level freshness model, admin queue, stale behavior and tests; no fake complete status. |
| Research-backed System Design completion | Unpublished manifest topics and incomplete problem walkthroughs require approved writing. | P1 content | Implement against this document and source ledger; review technical correctness and originality. |
| Research-backed ML Design expansion | Current compact concepts/problems do not yet represent full 20-concept/13-dossier contract. | P1 content | Build route/manifest/content architecture and publish only reviewed entries. |
| Behavioral curriculum completion | Strong workspace exists; full 16-lesson curriculum and deeper follow-up/evaluation experience may be partial. | P1 content | Audit current state against Section 9; preserve 48-question catalog. |
| Playbook completion | Control-plane architecture exists but not every final-week/day/debrief/source/round contract may be complete. | P1 content/product | Audit against Section 10; no duplicate curricula or readiness score. |
| AI Basics product approval | Research exists but section is post-launch and no dedicated route is authorized yet. | Requires explicit product approval | Do not implement until founder approves placement/scope; then use Section 16. |

Rules:

- A failing canonical check is a defect until proven otherwise.
- Do not call a check “not applicable” when ordinary repository evolution breaks it.
- A local sandbox port restriction may be environmental only when the exact commit passes the pinned GitHub build.
- A source-string regression can supplement but not replace rendered/behavioral tests for focus, navigation, filters, history or forms.
- Do not combine all items into one pull request.

# 20. Requirement IDs, content manifest, and implementation truth

## 20.1 Requirement registry

Create a machine-readable manifest derived from this document. This document remains the human-readable product authority; the manifest records implementation truth.

| Requirement family | Area | Specification | Disposition | Completion meaning |
| --- | --- | --- | --- | --- |
| EF-GLOBAL | Global platform | Sections 0–5, 18–23 | Required | Cross-route UX, privacy, analytics, evidence, accessibility, testing. |
| EF-SD | System Design | Section 6 | Required content completion | 161-topic target map, canonical designs, framework, visuals, rubric. |
| EF-ML | ML Design | Section 7 | Required content completion | 20 concepts, 13 dossiers, DECIDE, practice/rubric/glossary. |
| EF-DSA | DSA | Section 8 | Required + P1 language expansion | Patterns, topics, Foundry 75, Python/Java, practice/evidence. |
| EF-BEH | Behavioral | Section 9 | Required content/product completion | 16 lessons, existing questions, stories, variants, probes, rubric. |
| EF-PLAY | Interview Playbook | Section 10 | Required product completion | Control plane, plans, round execution, final week/day, debrief. |
| EF-MOCK | Mock Lab | Section 11 | Required core; advanced evaluator deferred | Simulation modes, prescriptions, evidence, privacy. |
| EF-COMP | Company Guides | Section 12 | Required priority companies; honest neutral hubs permitted | Claim provenance, freshness, exact handoffs. |
| EF-EXP | Interview Experiences | Section 13 | Required product | Moderated approved/consented directory and lifecycle. |
| EF-LLD | Low-Level Design | Section 14 | Required core | 8 lessons, at least 6 original practices; Low-Level Systems separate. |
| EF-SAL | Salary Negotiation | Section 15 | Required core | 8 modules, private worksheet and truthful scripts. |
| EF-AIB | AI Basics | Section 16 | Post-launch / founder approval required | Beginner-first visual literacy; not an interview-v1 blocker. |
| EF-VIZ | Visualization Lab | Section 17 | Curated P1 | Deterministic visuals only where learning value is high. |
| EF-SUP | Supporting routes | Section 18 | Required | Homepage, search, resources, referrals, challenges, legal, platform. |
| EF-OPS | Autonomous delivery and release | Sections 20–25 | Required process | Manifest, PRs, reviews, validation and external gates. |

## 20.2 Required manifest fields

Recommended location:

```text
docs/product-blueprint/content-manifest.json
```

Recommended schema:

```json
{
  "schema_version": 1,
  "blueprint_version": "1.0",
  "generated_or_reviewed_at": "ISO-8601",
  "repository_sha": "full evaluated commit SHA",
  "requirements": [
    {
      "id": "EF-ML-CONCEPT-01",
      "section": "ml-design",
      "kind": "concept",
      "title": "Product Problem Formulation & Baselines",
      "priority": "required",
      "status": "partial",
      "research_status": "approved",
      "publication_status": "unpublished",
      "routes": ["/ml-design/core-concepts/problem-formulation"],
      "source_ledger_ids": ["SRC-ML-GOOGLE-FRAMING"],
      "prerequisite_ids": [],
      "code_paths": [],
      "content_paths": [],
      "visual_ids": [],
      "test_commands": [],
      "acceptance_criteria": [
        "Defines whether ML is necessary",
        "Includes a non-ML baseline",
        "Connects user decision to prediction unit"
      ],
      "known_gaps": [],
      "owner": null,
      "last_verified_at": null,
      "notes": null
    }
  ]
}
```

Allowed priority:

```text
required
p1
p2
requires-founder-approval
requires-new-research
external-owner-gate
excluded
```

Allowed implementation status:

```text
not-started
placeholder
partial
implemented-unverified
implemented
blocked
deferred
excluded
```

Allowed research status:

```text
approved
approved-needs-source-import
needs-current-verification
needs-research
not-applicable
```

Allowed publication status:

```text
unpublished
noindex-draft
published
stale-review
archived
```

## 20.3 Status rules

- Route exists + placeholder = `placeholder`, not `implemented`.
- Prose exists without source review = at most `partial`.
- Feature exists without behavior tests = `implemented-unverified`.
- A requirement is `implemented` only when its acceptance criteria and required tests pass.
- External production evidence never changes a repository feature status unless the manifest explicitly models both.
- A stale volatile source can move content to `stale-review` without deleting history.
- A deliberately unavailable route must be honest and noindex.
- “Coming soon” does not count as completion.
- A page with only generic definitions does not satisfy a detailed lesson requirement.
- A generated report must identify the exact commit used.
- `repository_sha` means the full commit actually evaluated; the manifest and generated coverage report must record the same value and validation must reject a mismatch.

## 20.4 Source ledger

Recommended:

```text
docs/product-blueprint/source-ledger.json
```

Fields:

```json
{
  "schema_version": 1,
  "generated_or_reviewed_at": "ISO-8601",
  "repository_sha": "full evaluated commit SHA",
  "sources": [
    {
      "id": "SRC-SD-REDIS-CACHE",
      "title": "Official source title",
      "publisher": "Publisher",
      "url": "https://...",
      "source_class": "official-documentation",
      "published_at": null,
      "verified_at": "2026-09-01",
      "volatility": "periodic",
      "applies_to": ["EF-SD-CACHE-01"],
      "claims_supported": [
        "Atomic statement or mechanism"
      ],
      "usage_limits": "Paraphrase; do not copy figures or prose",
      "notes": null
    }
  ]
}
```

The validator must reject duplicate source IDs, reverse links to unknown requirement IDs, manifest source references that do not resolve to one ledger record, and a ledger `repository_sha` that differs from the manifest or generated coverage report.

Source classes:

- standard / RFC.
- original paper.
- official documentation.
- first-party engineering/science.
- official company hiring/candidate.
- institutional/career center.
- candidate-reported.
- respected secondary synthesis.
- pedagogy/pain-point source.
- Engineering Foundry editorial inference.

## 20.5 Coverage report

Generate:

```text
docs/product-blueprint/generated/coverage.md
```

The report must be reproducible and show:

- The exact evaluated `repository_sha`, equal to the manifest and source ledger.
- Requirements by section/status.
- Published versus draft.
- Source-complete versus missing.
- Route mapping.
- Test mapping.
- Visual mapping.
- Stale items.
- Required blockers.
- Deferred/external counts separately.
- No inflated “overall completion percentage” unless it is explicitly a requirement-coverage statistic with denominator and not user readiness.

## 20.6 Content data contract

Prefer structured content modules or data records over enormous route components.

A concept/lesson record should support:

```text
id
slug
title
summary
status
priority
audience
level
learning objectives
prerequisites
mental model
sections
worked examples
decision rules
trade-offs
failures
exercises
interviewer probes
role/level overlays
related content
visual references
source claim references
review date
freshness
estimated effort/read time
```

An end-to-end design/practice record additionally supports:

```text
prompt
clarification dimensions
requirements
capacity/scale
API/data or ML objective
reference architecture
alternatives
failure scenarios
rollout
monitoring
rubric
follow-ups
variants
```

## 20.7 Content rendering architecture

- Route code should be thin.
- Data/content schema should reject malformed references.
- Renderers support progressive disclosure and semantic headings.
- Avoid hand-built one-off markup for every lesson when a meaningful shared schema exists.
- Do not force genuinely different content into identical empty sections.
- Links are validated.
- Content IDs remain stable.
- Renames preserve redirects/history.
- Publication status drives sitemap/search/noindex.
- Source and freshness metadata are visible where meaningful.
- Generated static pages and dynamic data pages use explicit freshness behavior.

# 21. Autonomous Codex delivery protocol

This section turns the document into one durable Codex Goal.

## 21.1 Goal instruction

The lead Codex agent must:

> Continue through discovery, planning, implementation, review, validation, pull requests, and verified merges until every requirement marked **Required** in this document is implemented or is explicitly and correctly reclassified through a reviewed product decision. Do not stop after one task, one section, or one pull request.

This is one goal, not one giant change set.

## 21.2 Mandatory initial state handling

At the beginning of every resumed Goal session:

1. Identify repository path.
2. Read applicable `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, launch/readiness docs, and this document.
3. Fetch/prune origin.
4. Inspect `main`, current branch, open PRs, checks, recent commits, worktrees and uncommitted changes.
5. Do not discard unfamiliar work.
6. Confirm pinned toolchain.
7. Reconcile stale PR descriptions and documentation.
8. Build or refresh the requirement coverage report.
9. Choose the highest-priority unblocked batch.

Completed predecessor integration:

- PRs `#35`, `#36`, and `#34` were independently reviewed, merged normally, and verified on main as recorded in Section 0.2.
- The blueprint remained isolated from those product and security pull requests.
- Re-fetch current main and GitHub state rather than treating the recorded integration SHAs as permanent branch tips.
- Commit this document through its existing dedicated documentation branch before creating manifest, source-ledger, or coverage-report implementation batches.

## 21.3 Recommended delivery sequence

The lead may adapt boundaries when repository reality justifies it, but must preserve reviewability and prerequisites.

| Order | Pull request / batch | Outcome | Boundary |
| --- | --- | --- | --- |
| 0 | Merge predecessor PRs | Completed: release-record, public-report privacy, and P1 handoff integration; main CI green. | No blueprint work mixed into predecessor PRs. |
| 1 | Commit master blueprint | Add this document through its dedicated documentation PR. | Documentation-only; no manifest or content implementation. |
| 2 | Implementation-truth audit | Map every requirement to current code/content/test/status; generated coverage report. | No invented completion; minimal code only for validator/report. |
| 3 | Cross-cutting P1 defects | History/focus/account-disabled/mobile/accessibility fixes from Section 19. | Small coherent defect PRs; do not mix curricula. |
| 4A | System Design architecture and manifest | Normalize routes/status/schema/source contracts before bulk writing. | Preserve existing published URLs; no shallow duplicate pages. |
| 4B | ML Design architecture and manifest | Introduce 20 concepts/13 dossier route/content contract, glossary/rubric/practice shells. | Publish only reviewed content; honest noindex status. |
| 5A | System Design foundations and networking | Publish source-reviewed P0 lessons and visuals. | One topic family per reviewable PR. |
| 5B | System Design data, cache and messaging | Publish source-reviewed mechanisms and failure exercises. | Primary docs; original diagrams. |
| 5C | System Design reliability, patterns and technology | Complete remaining required concept/deep-dive set. | No vendor tutorial or famous-diagram cloning. |
| 5D | System Design practice dossiers | Complete prioritized walkthroughs with framework/rubric/variants. | Canonical differentiated problems. |
| 6A | ML Core Concepts 1–10 | Formulation through calibration. | Source-reviewed, task-specific examples. |
| 6B | ML Core Concepts 11–20 | Pipelines through responsible ML. | Production lifecycle and cross-cutting risk. |
| 6C | ML product/trust/prediction dossiers | Recommendation, feed, search, autocomplete, ads, fraud, safety, ETA, forecasting. | Differentiated dominant challenges. |
| 6D | ML infrastructure/RAG dossiers and practice | Feature store, platform, inference, RAG, DECIDE/rubric/practice. | No golden architecture or opaque score. |
| 7A | Behavioral learning and story coverage | 16 lessons, story schema, question/catalog audit, coverage. | Preserve current 48-question IDs/history. |
| 7B | Behavioral practice and follow-ups | Variants, adaptive probes, self-review, rubric and company modifiers. | Text-first; no personality inference. |
| 8 | Playbook completion | Context, uncertainty, next actions, horizons, round dossiers, final week/day, debrief. | Control plane only; deep links to specialist sections. |
| 9 | Mock evidence and simulation completion | Prescription/evidence contracts, modes, reflection, fidelity and privacy. | No hire prediction; no mandatory media. |
| 10 | Company Guides and freshness | Priority-company sourced coverage, claim schema, admin freshness and handoffs. | Neutral hubs when evidence insufficient. |
| 11 | Interview Experiences polish | Moderation/freshness/correction/abuse/accessibility and tests. | No copied/fake reports. |
| 12 | LLD completion | 8 lessons, ≥6 original practices, rubric and progress. | Separate Low-Level Systems. |
| 13 | Salary completion | 8 modules, worksheet, scripts, legal/freshness and accessibility. | No private persistence. |
| 14 | Visualization curated batch | Implement only high-value deterministic visuals supporting published lessons. | No arbitrary execution. |
| 15 | AI Basics | Only after explicit founder approval; beginner curriculum and three signature labs. | Post-launch; not a blocker for core interview product. |
| 16 | Cross-section integration | Deep-link/return evidence, search, homepage, prepare hub, account-disabled paths. | No duplicated content. |
| 17 | Final content/UX/security audit | Rendered browser, mobile, keyboard, text resize, sources, private boundaries. | Independent review. |
| 18 | Release qualification | Create a new release candidate only after scope complete; record immutable evidence. | Hosted owner gates remain separate. |

Parallelize independent batches, but do not merge dependent content before the schema/routes it require are stable.

## 21.4 Agent roles

| Agent | Responsibility | Concurrency |
| --- | --- | --- |
| Lead/orchestrator | Repository state, plan, assignments, integration, Git, PRs, CI, final decisions. | One active. |
| Explorer | Read-only audit, route/data/test mapping, source gaps, overlap and risk. | Up to six in parallel. |
| Technical writer/research synthesizer | Draft original content from approved source ledger and this specification. | Disjoint topic/content files. |
| Feature worker | Implement route/component/data/test package. | Maximum four write agents; explicit files. |
| Source verifier | Check changing claims against primary sources and record date/applicability. | Read-only/source ledger writes assigned exclusively. |
| Accessibility reviewer | Rendered keyboard/focus/semantics/responsive/text resize/reduced motion. | Read-only until assigned repair. |
| Security/privacy reviewer | Trust boundaries, RLS, analytics, logging, public/private data. | Read-only until assigned repair. |
| Content integrity reviewer | Originality, claim support, duplication, level/audience, non-generic writing. | Read-only. |
| Test reviewer | Behavioral validity, false positives, canonical inventory and CI portability. | Read-only. |

## 21.5 File ownership

Before spawning write agents, publish an assignment table:

```text
work package
agent
base SHA
exclusive writable files/directories
files it may create
read-only dependencies
forbidden files
acceptance criteria
commands/tests
expected report
```

Rules:

1. Two active write agents never own the same file.
2. Shared files are reserved for the lead unless assigned to one agent only.
3. Workers do not perform Git operations.
4. Workers do not install dependencies unless explicitly authorized.
5. When a shared change is needed, worker returns an integration request.
6. The lead reviews every worker diff.
7. Unrelated edits are reverted before staging.
8. Use worktrees for branches/PRs that can proceed independently.
9. One worktree/branch belongs to one integration lead.
10. Never edit the same branch concurrently from unrelated worktrees.

Reserved by default:

```text
package.json
package-lock.json
.nvmrc
AGENTS.md
.github/**
.env*
app/layout.tsx
app/globals.css
global navigation/header/footer
central route/search/sitemap catalogs
shared analytics/privacy configuration
supabase/migrations/**
docs/releases/**
release-record and release-verification scripts
this master document
content manifest/source ledger schemas
```

The lead may assign one reserved file for a bounded task, but must serialize changes.

## 21.6 Discovery phase

For each batch, spawn read-only explorers for relevant dimensions:

- Product/route behavior.
- Content/research gap.
- Data/privacy/security.
- Accessibility/responsive.
- Test/CI.
- Source/freshness.
- Overlap with other sections.

Every finding contains:

```text
finding ID
severity/value
requirement ID
user impact
reproduction/evidence
exact files/routes
repository-fixable or external
proposed bounded repair
tests
overlap/dependency
uncertainty
```

Reconcile duplicate and contradictory findings before implementation.

## 21.7 Planning phase

Choose work only when:

- It closes a Required acceptance criterion or a proven blocker/high defect.
- Research decisions exist.
- File ownership can be isolated.
- Validation is meaningful.
- It does not require an external owner gate.
- It is not speculative P2 scope.
- It will not create shallow content solely to increase page count.

When research or sources are missing:

- Create/retain an honest manifest gap.
- Do not invent.
- Finish independent plumbing only when it will not predetermine an unresolved product decision.
- Record the smallest missing human/research input.

## 21.8 Source-verification phase

For changing or factual content:

1. Identify claim IDs before drafting.
2. Use the source hierarchy.
3. Search current primary/official sources.
4. Record title, URL, publisher, publication/update date, verification date, applicability and volatility.
5. Draft original prose.
6. Do not quote beyond what is necessary.
7. Do not copy diagrams.
8. Mark inference.
9. Review company/vendor/law/price/version/model claims for freshness.
10. Do not publish unsupported claims merely because they sound plausible.

A source verifier may block publication.

## 21.9 Implementation phase

Each worker:

- States ownership before editing.
- Reads the relevant section of this master goal.
- Reads existing code/content and source ledger.
- Implements the smallest coherent package.
- Uses existing architecture where sound.
- Adds or updates tests.
- Runs focused validation.
- Reports files, behavior, tests, sources, limitations and integration requests.
- Does not commit.

For content:

- Write for a real learner decision.
- Use concrete examples.
- Include failure and trade-off.
- Avoid generic definition/advantages/disadvantages boilerplate.
- Retain technical depth.
- Use progressive disclosure.
- Preserve content IDs/routes/history.
- Do not mark published until editorial/source/tests pass.

## 21.10 Review phase

After integration, use independent read-only reviewers:

1. Correctness and regressions.
2. Security/privacy/data boundaries.
3. Accessibility/responsive/interaction.
4. Test validity/CI portability.
5. Content originality, support, usefulness and overlap.
6. Source/freshness for volatile material.

Findings are Blocker / High / Medium / Low and cite exact files/sections.

- Repair all Blocker and High.
- Repair bounded Medium unless it creates disproportionate risk.
- Record accepted Low issues with rationale.
- Reviewers must not praise without checking.
- Lead cannot declare its own unreviewed work complete.

## 21.11 Validation phase

Use the pinned toolchain whenever available.

Run:

1. Focused tests.
2. Lint.
3. Typecheck.
4. Content/schema/source validators.
5. Public-link validation.
6. Relevant privacy/security tests.
7. Rendered browser tests for interactive changes.
8. Static qualification.
9. Database qualification when data behavior changes and at final qualification.
10. Production build/route smoke.
11. Release-record validation.
12. Launch-readiness validation.
13. `git diff --check`.
14. Secret/artifact scan.
15. GitHub PR checks.
16. Main-push checks after merge.

A test file must be wired into the canonical inventory. Do not leave manual-only regressions.

A local environmental failure may be reported separately only when:

- The exact error is captured.
- No source failure occurred before it.
- The exact commit passes the canonical pinned GitHub lane.
- No unsafe workaround is committed.

## 21.12 Git and pull-request phase

Only the lead agent may:

- Stage.
- Commit.
- Push.
- Create/update PR.
- Mark ready.
- Merge.

Rules:

- Branch from latest verified `main`.
- No force-push.
- No destructive reset of unfamiliar work.
- No history rewriting after review unless explicitly needed and safely coordinated.
- Commit logical units.
- Draft PR first.
- PR body names requirement IDs, scope, non-goals, private data, analytics, sources, tests, external gates.
- Wait for checks.
- Repair failures.
- Update body factually.
- Mark ready only after independent review and green checks.
- Merge through a normal repository-compatible strategy.
- Verify resulting main SHA and main CI.
- Do not delete source branch until verified.
- Continue to next batch.

Every PR must state:

1. Requirement/workstream.
2. Acceptance criterion closed.
3. What it deliberately does not build.
4. Private-data implications.
5. Analytics implications.
6. Source/provenance implications.
7. Tests and qualification.
8. Scope/prerequisite impact.
9. External gates unaffected.

## 21.13 Do-not-stop rule

Do not stop because:

- A batch merged.
- A PR is large.
- A first approach failed.
- One local command cannot bind a sandbox port.
- The repository is large.
- Context is long.
- A test revealed additional defects.
- A section already has routes.
- A page is “good enough” without meeting its acceptance criteria.

After each merge:

1. Re-fetch main.
2. Refresh manifest/coverage.
3. Re-rank remaining Required items.
4. Continue.

## 21.14 Permitted stop conditions

Stop only when:

1. All Required criteria are complete and final audit is clean; or
2. Remaining work is exclusively:
   - external owner gate;
   - founder/product approval;
   - missing credential;
   - paid-service decision;
   - legal review;
   - new research not represented here;
   - service outage/rate limit;
   - deliberately deferred P2/excluded scope.

Finish every independent unblocked task first.

A blocker report includes:

- Requirement ID.
- Exact blocker.
- Evidence.
- Work already completed.
- Why no safe default exists.
- Smallest human action needed.
- What can resume afterward.

## 21.15 Goal session checkpoint

At context/session boundaries, write a repository checkpoint file or issue/PR comment containing:

- Current main SHA.
- Active branches/PRs/checks.
- Completed requirement IDs.
- Open findings.
- Manifest diff.
- Next batch.
- Agent assignments.
- Validation status.
- External blockers.
- No private secrets.

The next Codex session reads it and resumes; it must not restart a broad audit from zero unless the repository materially changed.

# 22. Test, quality, and review requirements

## 22.1 Test pyramid for this product

| Layer | Covers | Required proof |
| --- | --- | --- |
| Unit / pure logic | Normalization, search, scoring-free evidence, planning rules, schema validation, math, trace transitions. | Behavior and edge cases; no source-text proxy when direct test possible. |
| Content schema | Required fields, IDs, relationships, prerequisites, sources, status, route uniqueness. | Malformed fixture failures and complete active content. |
| Content semantics | No placeholders, unsupported claims, duplicates, stale status, missing examples/failures/next actions. | Structured validators plus editorial review. |
| Route/link | Published route generation, redirects, internal links, external-link policies, search/sitemap/noindex. | No dead destination or accidental private route. |
| Component interaction | Filters, URL sync, dialogs, menus, forms, timers, copy, reset, Back/Forward. | Rendered browser tests; focus preserved. |
| Accessibility | Landmarks, headings, labels, descriptions, errors/status, focus order, keyboard, resize, reduced motion. | Automated checks plus manual representative audit. |
| Responsive | Mobile/desktop, code/tables/diagrams, touch targets, overflow, sticky regions. | Rendered viewport tests/screenshots where useful. |
| Privacy/analytics | No private fields in events/logs/URLs/storage; public/private route behavior. | Allowlist tests and adversarial payloads. |
| Authentication/authorization | Disabled accounts, actor derivation, RLS, RPC, roles, redirects, cache isolation. | Two-user and anonymous/authenticated tests. |
| Database | Migrations, constraints, policies, functions, indexes, lifecycle, deletion/export. | Clean reset, lint, pgTAP, local qualification. |
| Build | Pinned runtime, type compilation, static/dynamic route behavior, content generation. | Production build and route inventory. |
| Smoke | Representative public/private/unavailable routes, headers, contact and unknown routes. | Local and hosted modes separated. |
| Source/freshness | Required source IDs, date/applicability, stale behavior, broken links. | Validator + scheduled audit. |
| Release evidence | Candidate identity, immutable record/archive, descendant-safe validation, exact commands. | Release-record tests in attached and detached HEAD. |
| Security | Secrets, unsafe rendering, open redirects, injection, WAF/rate-limit boundaries, dependency/code scanning. | Static checks, CodeQL/dependency review, targeted tests. |

## 22.2 Canonical commands

At the time this document was prepared, the repository’s canonical final commands included:

```bash
npm ci
npm run lint
npm run typecheck
npm run qualify:static
npm run qualify:database
npm run qualify:production
npm run release:verify
npm run release:record -- validate
npm run test:v1-launch-readiness
git diff --check
```

The live package manifest and release-verification manifest are authoritative for exact current commands. Do not hard-code a stale duplicate inventory in CI. Every new `test:` script must enter the canonical static inventory unless it is explicitly part of another authoritative lane.

## 22.3 Behavioral test standard

Interactive behavior must be tested through the same production logic.

Bad:

- Test checks that a source file contains a string.
- Test reimplements a different search algorithm.
- Test assumes a local `main` branch.
- Test passes only in attached HEAD.
- Test asserts a visual class but not behavior.
- Test calls a helper never used by the actual component.

Good:

- Production component and test share a pure helper.
- Rendered browser verifies focus and URL state.
- Test uses full SHAs or remote-independent history.
- Detached-HEAD CI is exercised.
- Card count and destination result use the same query implementation.
- Public/private client behavior is tested with environment combinations.
- A malformed content fixture fails the real validator.

Source-text tests remain useful for architectural invariants that cannot be imported safely, but they must not masquerade as user behavior.

## 22.4 Accessibility audit

Representative critical flows require manual or rendered verification for:

- Keyboard-only navigation.
- Skip link.
- Header and menus.
- Search open, result navigation, close and focus restoration.
- Forms and validation.
- Modal/dialog focus trap and restoration.
- Details/disclosure controls.
- Filter changes and live result status.
- Timers.
- Copy actions and failure status.
- Dynamic route/state changes.
- 200% and 400% text zoom/reflow as applicable.
- Mobile touch target and spacing.
- Reduced motion.
- Screen-reader headings/landmarks/names/descriptions/status.
- Error identification.
- Color contrast and non-color cues.
- Code/table/diagram alternatives.

Target WCAG 2.2 AA, while treating conformance as an evidence-backed audit process rather than an automated-score claim.

## 22.5 Content quality audit

Every published lesson/dossier is reviewed for:

- Does it solve a real learner decision?
- Is the mental model accurate?
- Are prerequisites satisfied?
- Does it use the simplest baseline?
- Does it explain why the baseline stops working?
- Are mechanism and state flow clear?
- Are trade-offs conditional rather than balanced filler?
- Is at least one failure diagnosed?
- Is the example original and realistic?
- Does Senior depth reflect scope/judgment rather than verbosity?
- Does Entry guidance avoid assuming professional authority?
- Are international/small-company/nontraditional examples possible?
- Are sources authoritative and current enough?
- Is inference labeled?
- Is volatile information dated?
- Does the page avoid competitor wording/assets?
- Is the next action useful?
- Is the page redundant with another section?
- Does the interaction improve learning?
- Does the copy sound like a human expert rather than a generic template?

## 22.6 Security and privacy audit

Before each merge, inspect:

- Secrets and env files.
- Logs and errors.
- URL/query/referrer leakage.
- Analytics event/property allowlists.
- Private state persistence.
- Cross-user cache behavior.
- RLS/RPC/role checks.
- Public anon reads.
- Service-role confinement.
- Open redirects and unsafe `next`.
- Untrusted HTML/Markdown/diagram rendering.
- External links.
- File upload/download boundaries.
- Admin actions.
- Export completeness.
- Deletion/cascades.
- Dependencies.
- CI permissions.
- Worker/scheduler endpoints.
- Rate limit/WAF owner gates.

## 22.7 Performance audit

Do not optimize without evidence, but protect:

- Homepage and core landing load.
- Search index size.
- Huge client bundles from Mermaid or interactive labs.
- Static generation count/time.
- Dynamic public data routes.
- Image/font loading.
- Hydration on content-heavy pages.
- List filtering.
- Expensive content parsing.
- Database query filters/indexes.
- N+1 queries.
- Cache correctness.
- Accessibility under slow devices.
- Build reliability.

Use route-level bundle/build evidence where available. Vendor-specific performance thresholds require current tooling and live measurement.

## 22.8 Independent final audit

Before declaring a section complete, assign at least:

- One content/technical reviewer.
- One UX/accessibility reviewer.
- One test/security/privacy reviewer for interactive/private features.

Before final release, audit every major route family and compare the manifest against the actual repository.

No agent may mark its own unreviewed content “fully complete.”

# 23. Final Definition of Done

Codex may declare the repository goal complete only after all checks below are true.

## 23.1 Governance and implementation truth

- [ ] This master specification is committed on a dedicated documentation PR and merged.
- [ ] Machine-readable requirement manifest exists and validates.
- [ ] Source ledger exists and validates.
- [ ] Generated coverage report matches the exact final commit.
- [ ] Every Required requirement is `implemented`.
- [ ] No Required requirement remains `placeholder`, `partial`, `implemented-unverified`, or silently absent.
- [ ] Every deferred, excluded, research-blocked, founder-approval, and external-owner item is explicitly classified.
- [ ] Existing routes/content are mapped; no “route exists = done” shortcut.
- [ ] Every active content ID/route/source/test mapping is unique and stable.
- [ ] PR history states what each batch closed.

## 23.2 Candidate journey

- [ ] Anonymous user can understand the product and complete a useful first action.
- [ ] User can select DSA, System Design, ML Design, Behavioral, LLD, Salary, Company, Mock, or Playbook path without dead ends.
- [ ] Signed-in user can continue meaningful preparation.
- [ ] No-interview mode works.
- [ ] Known-loop mode works.
- [ ] Unknown-loop mode works.
- [ ] Interview-tomorrow mode works.
- [ ] Multiple-application mode avoids duplicated work.
- [ ] Specialist completion/evidence returns to the Playbook.
- [ ] Final-week and interview-day states reduce noise.
- [ ] Post-round debrief remains private.
- [ ] Advancement, rejection, withdrawal, and offer transitions work.
- [ ] Offer leads to Salary Negotiation.
- [ ] Account-disabled public launch retains useful public/local paths.

## 23.3 System Design

- [ ] Required IA and route hierarchy are discoverable.
- [ ] Framework teaches clarify → estimate → API/data → architecture → bottleneck/deep dive → reliability/evolution.
- [ ] Required topic map is represented without duplicates.
- [ ] Required source-reviewed P0/P1 concept lessons are published according to manifest.
- [ ] Required canonical design dossiers are published according to manifest.
- [ ] Every lesson includes decision, baseline, failure, trade-off, example, exercise, probes and sources.
- [ ] Every dossier includes requirements, estimates, APIs/data, architecture, alternatives, failures, operations and Senior extensions.
- [ ] Required high-value visuals exist; decorative visuals do not.
- [ ] Guided/independent/timed practice and private evidence are coherent.
- [ ] No famous diagram, vendor stack, or company architecture is presented as the one correct answer.

## 23.4 ML Design

- [ ] All twenty Core Concepts are represented once.
- [ ] All thirteen v1 Design Problems are complete and differentiated.
- [ ] DECIDE is implemented as a flexible framework.
- [ ] Master rubric and role/level overlays are visible and descriptive.
- [ ] Guided, untimed, and timed modes work.
- [ ] Saved attempts/reflection are private.
- [ ] Task-specific labels/metrics/splits/serving/monitoring appear.
- [ ] Responsible ML appears cross-cutting.
- [ ] No golden architecture, shallow duplicate catalog, or opaque readiness score exists.

## 23.5 DSA

- [ ] Core pattern and topic curriculum is complete according to manifest.
- [ ] Foundry 75 has safe provenance and versioning.
- [ ] Pattern counts and question destinations agree.
- [ ] Search and URL state work with direct links and Back/Forward.
- [ ] Python and Java guides are complete and code-verified.
- [ ] Published language guides pass mobile/touch/readability tests.
- [ ] Interview modes teach clarification, derivation, implementation, testing and follow-up.
- [ ] Evidence distinguishes familiar/repeated, guided/assisted and unseen/independent.
- [ ] Company metadata is sourced.
- [ ] No scraped question statements or solved-count mastery claim exists.

## 23.6 Behavioral

- [ ] Sixteen-lesson curriculum is represented.
- [ ] Existing question catalog is audited and stable.
- [ ] Canonical Story schema exists.
- [ ] Coverage is descriptive and not a universal story count.
- [ ] Variants preserve canonical facts.
- [ ] Follow-ups are adaptive.
- [ ] Self-review precedes feedback.
- [ ] Rubric is descriptive and level-calibrated.
- [ ] Text-only flow is complete.
- [ ] Company modifiers are sourced.
- [ ] No personality, accent, face, emotion, confidence, deception, culture-fit, hire or pass inference exists.

## 23.7 Playbook and Mocks

- [ ] Playbook remains a control plane, not a content duplicate.
- [ ] Context, uncertainty, diagnostic, next action, time horizons, round dossiers, final week/day, contingencies and debrief are complete.
- [ ] Every recommendation explains why.
- [ ] Plans adapt instead of multiplying arbitrary practice counts.
- [ ] Mock Prescription and Mock Evidence Summary contracts are implemented.
- [ ] Evaluator provenance and simulation conditions are retained.
- [ ] Full-loop simulation remains an honest rehearsal.
- [ ] No global readiness/pass probability or hidden live assistant exists.
- [ ] Recording/transcript use is optional, private and deletable.

## 23.8 Company Guides and Interview Experiences

- [ ] Priority Company Guides meet source/applicability/freshness requirements or show honest neutral gaps.
- [ ] Official, reported, EF and private layers are visually distinct.
- [ ] No unsupported weighting or universal loop.
- [ ] Approved public Experiences work with accounts disabled.
- [ ] Public reads are fresh enough by explicit route strategy.
- [ ] Submission/moderation/lifecycle/correction/removal work.
- [ ] Exact proprietary questions and personal/confidential information are excluded.
- [ ] No copied/fake/test-user activity.

## 23.9 LLD and Salary

- [ ] LLD has eight core lessons and at least six original practices.
- [ ] LLD teaches responsibility, state, invariants, flows, testing and evolution.
- [ ] Patterns are conditional tools.
- [ ] Low-Level Systems remains separate unless explicitly authorized.
- [ ] Salary has eight modules.
- [ ] Worksheet math/privacy/clipboard/optional analytics are accurate.
- [ ] No sensitive offer input leaves session state.
- [ ] No fabricated leverage, universal counter percentage, magic score or legal/tax prediction exists.

## 23.10 AI Basics and Visualization

- [ ] AI Basics remains deferred until founder approval; it is not accidentally counted as an interview-v1 blocker.
- [ ] When approved, Beginner lessons and signature Token/Prompt/Hallucination labs meet Section 16.
- [ ] AI for Kids remains excluded.
- [ ] Visualization Lab contains only justified deterministic/bounded experiences.
- [ ] Every visual has keyboard, reduced-motion and text/table equivalent.
- [ ] No arbitrary untrusted code execution is introduced.

## 23.11 Supporting product

- [ ] Homepage, Prepare, Resources, search, community, referrals, challenges, feedback, About, FAQ, Contact, Privacy and Terms are coherent and truthful.
- [ ] Global search is accessible and does not steal focus.
- [ ] Account-disabled CTAs are intentional.
- [ ] Private routes, admin and profiles respect visibility and authorization.
- [ ] Robots/sitemap/metadata contain no private or placeholder content.
- [ ] Analytics measures allowlisted useful actions without private content.
- [ ] Legal policies match actual behavior and await qualified external review where necessary.

## 23.12 Engineering quality

- [ ] Clean install under pinned Node/npm.
- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] All canonical static tests pass.
- [ ] Content/source/manifest validators pass.
- [ ] Public-link validation passes.
- [ ] Database reset/lint/pgTAP and qualification pass.
- [ ] Auth/RLS/two-user isolation pass.
- [ ] Production build passes in pinned CI.
- [ ] Local public-route smoke passes in a capable environment.
- [ ] Hosted smoke remains an external gate until actual deployment.
- [ ] Release-record validation passes in attached and detached HEAD and on descendants.
- [ ] Launch-readiness validation passes.
- [ ] Git diff checks pass.
- [ ] Dependency Review and CodeQL pass.
- [ ] Rendered-browser critical accessibility and history/focus flows pass.
- [ ] No secret, environment file, dependency directory, database, build output or temporary artifact is committed.
- [ ] No test is weakened to hide a defect.
- [ ] Final main-push CI passes.

## 23.13 Final independent review

- [ ] No blocker or high finding remains.
- [ ] Medium findings are fixed or documented with rationale and ownership.
- [ ] Source/freshness audit is complete.
- [ ] Content duplication audit is complete.
- [ ] Public/private data audit is complete.
- [ ] Accessibility representative audit is complete.
- [ ] Requirement coverage report has no unexplained Required gap.
- [ ] Final report accurately separates repository completion from hosted owner gates.

# 24. External owner gates and deliberate deferrals

These do not become “complete” through repository code alone.

## 24.1 Deployment and infrastructure owner gates

- Production hosting project configuration.
- Exact production deployment.
- DNS, TLS, canonical domain, redirects, CDN and HSTS.
- Hosted headers/CSP behavior.
- Production environment variables and secret custody.
- Hosted Supabase project identity.
- Backup/PITR and pre-migration backup.
- Production migration execution and recorded migration list.
- SMTP/recovery delivery.
- OAuth provider configuration.
- Scheduler/reminder worker credentials and external trigger.
- Alert routing, dashboards and rollback operation.
- WAF/edge abuse controls and production rate limiting.
- Operator/admin bootstrap.
- Production contact ownership.
- Real hosted two-user isolation.
- Production export/deletion exercise.
- Hosted public-route smoke.
- Production Lighthouse/Core Web Vitals.
- Real mobile/desktop/browser/screen-reader verification.
- Analytics consent decision and live PostHog project.
- Legal review of Privacy and Terms.

Repository work can prepare checklists, scripts and evidence templates. It cannot claim these gates passed without dated live evidence.

## 24.2 Human product gates

Require founder/product approval:

- AI Basics launch and navigation placement.
- Any paid feature.
- Peer matching or marketplace.
- Persistent salary data.
- Recording/transcript retention defaults.
- Human evaluator marketplace.
- New audience such as children.
- Employer-specific policy product.
- Any numerical readiness model.
- Public profile/social expansion.
- Referral marketplace/payments.
- Major navigation expansion.
- Blog/CMS.
- Arbitrary code execution.

## 24.3 Deliberately deferred or excluded

- AI for Kids.
- Hidden live interview assistant.
- Fake/test-user public activity.
- Scraped proprietary interview corpus.
- Peer matching before trust/safety/moderation design.
- Referral payments/marketplace.
- Universal company frequencies from weak data.
- Opaque pass/offer probability.
- Face/emotion/accent/deception analysis.
- Arbitrary code sandbox.
- Huge video library.
- Certificates/badges before learning value is proven.
- Social feed/leaderboard.
- General AI evaluator without validated rubric.
- Full Low-Level Systems track unless separately prioritized.
- Employer-policy/legal advice without current official review.
- Company-branded golden architecture.
- P2 specialist ML/DSA/Systems depth not required by the manifest.

## 24.4 Reclassification

A deferred item can become Required only through a reviewed product decision that records:

- Why.
- What it displaces or whether capacity changed.
- Research/source readiness.
- Privacy/security/legal impact.
- Data/analytics impact.
- Acceptance criteria.
- Owner.
- Milestone.
- Updated manifest and this master document.

Codex cannot promote scope merely because it can implement it.

# 25. Research registry, open decisions, and maintenance

## 25.1 Research artifacts synthesized

This master file incorporates the following completed research families. The original research files should be preserved when available, but Codex must not require chat history to understand the product decisions encoded here.

The titles below record synthesis inputs, not proof that each original artifact or its underlying source corpus is present in this repository. The first governance/coverage batch must record a stable artifact ID, repository path or external record, version or content hash, availability, approval status, and verification date for each artifact. Until that record exists, affected manifest rows may be at most `approved-needs-source-import`, `needs-current-verification`, or `needs-research`; they must not be marked `approved` merely because this synthesis names the artifact. Reconcile `docs/public-v1-content-gap-inventory.md` with those records in that batch. Implementation plumbing may proceed, but substantive curriculum drafting waits for this source-artifact gate.

| Area | Research artifact | Primary contribution |
| --- | --- | --- |
| Launch governance | Engineering Foundry v1 Launch Finish Plan | Product scope, operating model, P0/P1 boundaries, definition of done and metrics. |
| DSA | Engineering Foundry DSA for Interviews: Competitive Research and Product Design | Pattern mastery, interview behavior, company context, simulations, review and differentiation. |
| DSA | Engineering Foundry DSA Roadmaps for SDE I, SDE II, and SDE III+ | Role-level roadmaps, topic-page contract and production extensions. |
| DSA language | Engineering Foundry Python and Java DSA Language Pages | Shared language-page architecture plus Python and Java semantics, collections, templates, visualizations and practice. |
| DSA language | JavaScript DSA research phase requested for Engineering Foundry | JavaScript/TypeScript target curriculum; retain as an approved direction only after its full source artifact is imported and reviewed. |
| System Design | Engineering Foundry System Design Curriculum: Deep Research and Recommended Topic Map | Topic hierarchy, priorities, reusable primitives and problem catalog. |
| System Design | Engineering Foundry System Design Content Research Blueprint | Source hierarchy, editorial voice, page structure, visuals, examples and QA. |
| ML Design | Engineering Foundry ML Design Core Concepts Curriculum | Normalized production ML concepts, prerequisites, paths and terminology. |
| ML Design | Engineering Foundry ML Design: Recommendation and Ranking Systems | Retrieval/ranking, labels, metrics, feedback, serving and variants. |
| ML Design | Engineering Foundry ML Design Research: Search, Retrieval, Query Understanding, Autocomplete, and Advertising | Search/autocomplete/ads differentiation, metrics, labels and serving. |
| ML Design | Engineering Foundry ML Design: Trust, Prediction, Forecasting, and Decision Systems | Fraud, moderation, ETA, forecasting, labels, thresholds and HITL. |
| ML Design | Engineering Foundry ML Design: ML Infrastructure and Modern AI System Design | Feature stores, ML platforms, inference, vector search and RAG. |
| ML Design | Engineering Foundry ML Design: Final Synthesis, Quality Audit, and Implementation-Ready Content Specification | DECIDE, 20 concepts, 13 designs, rubrics, overlays, exclusions and QA. |
| Behavioral | Engineering Foundry Behavioral Interview Curriculum and Learning Architecture | Sixteen-lesson target and prerequisite architecture. |
| Behavioral | Engineering Foundry Behavioral Interview Story Bank, Answer Construction, and Annotated Examples | Canonical facts, story coverage, variants and truthful answer construction. |
| Behavioral | Engineering Foundry Behavioral Evaluation Rubrics and Seniority Calibration | Descriptive rubric, role scope, disagreement and calibration. |
| Behavioral | Engineering Foundry Behavioral Interview Company Guides: Evidence-Based Specification | Company values/behavioral modifiers with source classes. |
| Behavioral | Engineering Foundry Behavioral Practice, Follow-Ups, Mock Interviews, and Feedback UX | Practice modes, adaptive probes, mocks, media/privacy and feedback. |
| Behavioral | Engineering Foundry Behavioral Interview: Final Synthesis, Quality Audit, and Implementation Handoff | Normalized final architecture, risks and acceptance. |
| Playbook | Engineering Foundry Interview Playbook: Final Scope, Information Architecture, and Product Boundaries | Control-plane boundary and module ownership. |
| Playbook | Engineering Foundry Interview Playbook: Preparation Diagnostic, Readiness Model, and Adaptive Plan Generator | Evidence, planning rules, horizons and next actions. |
| Playbook | Engineering Foundry Interview Playbook: Round-by-Round Interview Execution Playbooks | Round taxonomy and execution dossiers. |
| Playbook | Engineering Foundry Interview Playbook: Mock Interviews, Full-Loop Simulations, and Readiness Evidence | Prescription/evidence contracts and fidelity. |
| Playbook | Engineering Foundry Interview Playbook: Final Week, Interview Day, Recovery, and Post-Interview Debrief | Final prep, contingencies, recovery, debrief and transitions. |
| Playbook | Engineering Foundry Interview Playbook — Final Synthesis and Quality Audit | Overlap audit, final candidate journey, trust and accessibility. |
| Company | Software-Engineering Interview Deep Research: priority companies | Amazon, Google, Meta, Walmart, Microsoft, NVIDIA, OpenAI, Anthropic, Atlassian, Uber and expansion candidates. |
| Low level | Low-Level Software Interview Preparation: Questions, Problem Sets, Resources, and Study Plans | Low-Level Systems/C++/OS/concurrency specialist boundary and curriculum. |
| Salary | Salary Negotiation: Research-Backed Website Section Blueprint | Eight-module curriculum, ethics, scripts, equity, legal/freshness and private worksheet. |
| AI Basics | AI for Noobs at Engineering Foundry: Research and MVP Recommendation | Audience, positioning, MVP and measurement. |
| AI Basics | AI for Noobs: Research-Backed Learning Strategy for Engineering Foundry | Beginner/intermediate/advanced learning architecture and signature interactions. |

The master document is a synthesis, not a license to copy underlying sources. Volatile facts still require current verification.

## 25.2 Open product decisions

These remain explicit:

1. Whether/when AI Basics is approved for implementation.
2. Whether JavaScript/TypeScript becomes the next DSA language after Python/Java.
3. Whether C++ belongs under DSA language, a Low-Level Systems track, or both with distinct scope.
4. Whether the Low-Level Systems track is strategically prioritized.
5. Which curated visualizations justify P1 effort.
6. Whether any audio recording ships and its retention defaults.
7. Whether authenticated peer/human mock evaluation is added.
8. Whether persistent salary comparison is ever justified.
9. Analytics consent and production project.
10. Production account enablement.
11. Legal review and jurisdictional scope.
12. Exact release milestone after content completion.
13. Whether all ten priority companies need complete guides before the next public release or some remain neutral hubs.
14. Whether a blog/CMS exists; current answer is no.
15. Whether a validated multidimensional evidence summary can ever support a carefully bounded aggregate; current answer is no aggregate score.

Codex records these as decisions needed. It does not answer them by coding.

## 25.3 Maintenance

Review this master file when:

- Product scope changes.
- A required section completes.
- Source policy changes.
- Route architecture materially changes.
- Privacy/analytics/storage behavior changes.
- A new audience or paid product is proposed.
- A final release begins.

Changes require a dedicated documentation review with:

- Rationale.
- Affected requirement IDs.
- Migration plan.
- Test impact.
- Source impact.
- Privacy/security impact.
- Deferred/replaced scope.

## 25.4 Glossary

| Term | Meaning |
| --- | --- |
| Acceptance criterion | Observable condition required before a requirement can be marked implemented. |
| Active content | Content published and discoverable; not merely present in a file. |
| Candidate-confirmed | Private process fact supplied through the candidate’s recruiter/invite or direct experience. |
| Canonical content | The one owning section/page/data record for a concept; other sections deep-link rather than duplicate. |
| Capability evidence | Observation from a task or interview-like activity that may support a skill dimension; never a hiring probability. |
| Content fingerprint | Stable prompt/content/version identifier used to detect repeats and trace evidence. |
| EF inference | Engineering Foundry product/editorial recommendation derived from evidence, visibly labeled as inference. |
| External owner gate | Production/legal/service action that repository code cannot prove complete. |
| Fresh evidence | Evidence from a representative task not previously seen or over-rehearsed under comparable conditions. |
| Guardrail | Metric, rule or check intended to prevent unacceptable harm/regression while optimizing another outcome. |
| Honest empty state | UI that accurately states no real records/content exist and provides a useful next action. |
| Implementation truth | What is actually present, tested and published in the live repository. |
| Noindex draft | Reachable editorial preview that must not be publicly indexed or represented as complete. |
| Normalized evidence | Structured output from a specialist practice surface that the Playbook can interpret with provenance. |
| Owner | Section or component responsible for canonical content/state. |
| Prerequisite | Knowledge or product state needed before the next item is pedagogically or technically useful. |
| Primary source | Standard, original paper, official documentation, first-party engineering, or official employer material. |
| Publication consent | Explicit permission to make a contributor report public; approval alone is insufficient. |
| Repeated evidence | Performance on a familiar prompt; useful for practice but weaker for transfer/readiness interpretation. |
| Research truth | The reviewed conclusion supported by the source corpus and recorded in this specification/source ledger. |
| Source class | Category describing authority and relationship of evidence. |
| Source freshness | Whether a claim remains sufficiently current for its volatility. |
| Specialist section | DSA, System Design, ML Design, LLD, Behavioral or another owner of underlying learning/practice. |
| Transfer | Ability to apply a mental model to a new or unlabeled problem rather than replay a memorized answer. |
| User readiness | Not a single numeric construct in Engineering Foundry; represented through relevant dimension evidence and uncertainty. |

# 26. Copy-paste Codex Goal launcher

After this file is committed to the repository, start Codex from the repository root with the following Goal:

```text
Read the complete master specification at:

  docs/product-blueprint/ENGINEERING_FOUNDRY_MASTER_CODEX_GOAL.md

Treat it as the authoritative Engineering Foundry product, content, quality,
and autonomous-delivery goal.

First verify live GitHub/repository state and confirm that the predecessor
integration recorded in Section 0.2 remains present on the latest green main.
Then create or refresh the machine-readable requirement manifest, source
ledger, and coverage report. Continue through small, reviewable pull requests
until every item marked Required satisfies its acceptance criteria and the
final Definition of Done is met.

Use real Codex subagents for independent discovery, source verification,
implementation, and review. Give every write agent exclusive file ownership.
Only the lead agent may stage, commit, push, update pull requests, mark them
ready, or merge. After every merge, verify main CI, refresh implementation
truth, select the next highest-priority unblocked requirement, and continue.

Do not substitute generic model knowledge for the research decisions in the
master specification. Verify changing factual claims from current primary or
official sources and record them in the source ledger. Do not invent content,
users, reports, metrics, company processes, interview questions, testimonials,
or production evidence.

Do not stop after one batch or one pull request. Stop only when the document's
Definition of Done is satisfied or all remaining work is explicitly classified
as an external owner gate, founder decision, missing credential, missing
approved research, or deliberate deferral. Finish all independent unblocked
work before stopping.

Do not deploy production, enable accounts or analytics, modify hosted services,
make legal decisions, create fake activity, scrape proprietary content, or
force-push.
```

## 26.1 Suggested repository destination

Commit this file as:

```text
docs/product-blueprint/ENGINEERING_FOUNDRY_MASTER_CODEX_GOAL.md
```

The generated requirement/source files described above belong beside it.

## 26.2 Final Codex report

At true completion, report:

- Original and final `main` SHA.
- Every branch and pull request.
- Every merged PR.
- Requirement manifest summary.
- Required items completed by section.
- Research/source imports and freshness review.
- Major content and product changes.
- Subagents and ownership.
- Tests added.
- Local and GitHub validation.
- Accessibility, privacy, security and content audit results.
- Environmental-only failures and canonical evidence.
- Confirmation that no test was weakened.
- Confirmation that no fabricated or proprietary content was introduced.
- Confirmation that no deployment/account/analytics/legal gate was falsely claimed.
- Remaining external gates.
- Remaining founder decisions.
- Remaining deliberate P2/excluded work.
- Evidence that no repository-fixable Required item remains.

---

**End of authoritative master goal.**
