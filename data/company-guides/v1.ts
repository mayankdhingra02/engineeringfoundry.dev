export type CanonicalCompanyLevel = "Entry" | "Mid" | "Senior" | "Staff+";
export type CompanyEvidenceKind = "official" | "candidate" | "recommendation";
export type CompanyClaimSourceClass = "official" | "recruiter-commentary" | "candidate-reported" | "secondary-synthesis" | "ef-inference";
export type CompanyClaimConfidence = "High" | "Medium-high" | "Medium" | "Cautious";
export type CompanyClaimVolatility = "stable" | "periodic" | "fast-moving";
export type CompanyClaimSection = "process" | "coding" | "design" | "behavioral" | "tools" | "logistics" | "role-applicability";

export type CompanyGuideSource = {
  id: string; title: string; url: string; kind: "official"; publishedAt: string | null; verifiedAt: string;
  confidence: CompanyClaimConfidence; applicability: string; volatility: CompanyClaimVolatility;
};

export type CompanyGuideClaim = {
  id: string; section: CompanyClaimSection; text: string; sourceClass: CompanyClaimSourceClass; sourceId: string;
  sourcePublishedAt: string | null; verifiedAt: string; applicability: string; confidence: CompanyClaimConfidence;
  volatility: CompanyClaimVolatility; reviewBy: string; conflictGroup: string | null; supersededBy: string | null;
  editorialStatus: "published" | "needs-review" | "conflicting";
  displayLabel: "Official source" | "Engineering Foundry inference"; editorialNote: string; mayVary: boolean;
};

export type CompanyGuideDomain = {
  id: "dsa" | "practical" | "lld" | "system-design" | "ml-design" | "behavioral"; title: string; summary: string;
  actionLabel: string; href: string; evidence: CompanyEvidenceKind; relevance: "core" | "role-dependent" | "evidence-limited";
};

export type CompanyGuideV1 = {
  slug: string; company: string; publicationKind: "sourced-guide" | "neutral-hub"; verifiedAt: string; overview: string;
  claims: CompanyGuideClaim[]; levelMappings: Array<{ level: CanonicalCompanyLevel; companyTitles: string; caveat: string }>;
  domains: CompanyGuideDomain[]; behavioralThemes: string[]; staffPlus: string[]; recommendations: string[];
  recruiterQuestions: string[]; sources: CompanyGuideSource[];
};

const verifiedAt = "2026-09-05";
const quarterlyReviewBy = "2026-12-04";

const canonicalLevels = () => (["Entry", "Mid", "Senior", "Staff+"] as const).map((level) => ({
  level,
  companyTitles: "Use the title and scope in the active job posting",
  caveat: "This preparation band is not a cross-company title equivalence or a hiring-level guarantee.",
}));

function domains(ml: CompanyGuideDomain["relevance"]): CompanyGuideDomain[] {
  return [
    { id: "dsa", title: "Coding / DSA", summary: "Practice data structures, algorithms, complexity, testing, and explanation without treating company tags as predicted questions.", actionLabel: "Start a recognition drill", href: "/dsa/practice?mode=recognition", evidence: "recommendation", relevance: "core" },
    { id: "practical", title: "Interview execution", summary: "Rehearse clarification, planning, implementation, validation, and recovery. The assigned assessment instructions govern tools and format.", actionLabel: "Open the algorithmic-coding dossier", href: "/interview-tips/rounds/algorithmic-coding", evidence: "recommendation", relevance: "core" },
    { id: "lld", title: "Low-Level Design", summary: "Practice responsibilities, interfaces, state, failure handling, and testability only when the role or recruiter context makes object design relevant.", actionLabel: "Choose an LLD exercise", href: "/low-level-design/practice", evidence: "recommendation", relevance: "role-dependent" },
    { id: "system-design", title: "System Design", summary: "Practice requirements, capacity, data, reliability, trade-offs, and evolution when the role calls for architecture depth.", actionLabel: "Choose a System Design problem", href: "/system-design/problems", evidence: "recommendation", relevance: "role-dependent" },
    { id: "ml-design", title: "ML System Design", summary: ml === "role-dependent" ? "Use ML Design only for ML, data, model, or infrastructure scope supported by the active role." : "This guide has no source for a universal ML Design requirement. Add this track only when the posting or recruiter confirms it.", actionLabel: "Browse ML Design problems", href: "/ml-design/problems", evidence: "recommendation", relevance: ml },
    { id: "behavioral", title: "Behavioral / values", summary: "Build truthful examples around decisions, collaboration, impact, feedback, and learning. Do not infer a hidden company rubric.", actionLabel: "Practice a behavioral prompt", href: "/behavioral/practice", evidence: "recommendation", relevance: "core" },
  ];
}

const official = (id: string, title: string, url: string, applicability: string, confidence: CompanyClaimConfidence = "High", volatility: CompanyClaimVolatility = "periodic"): CompanyGuideSource => ({
  id, title, url, kind: "official", publishedAt: null, verifiedAt, confidence, applicability, volatility,
});

function claim(input: Omit<CompanyGuideClaim, "sourcePublishedAt" | "verifiedAt" | "reviewBy" | "conflictGroup" | "supersededBy" | "editorialStatus" | "displayLabel"> & { reviewBy?: string }): CompanyGuideClaim {
  return { ...input, sourcePublishedAt: null, verifiedAt, reviewBy: input.reviewBy ?? quarterlyReviewBy, conflictGroup: null, supersededBy: null, editorialStatus: "published", displayLabel: input.sourceClass === "official" ? "Official source" : "Engineering Foundry inference" };
}

type GuideInput = Pick<CompanyGuideV1, "slug" | "company" | "publicationKind" | "overview" | "claims" | "behavioralThemes" | "recommendations" | "recruiterQuestions"> & { source: CompanyGuideSource; ml: CompanyGuideDomain["relevance"] };

function guide(input: GuideInput): CompanyGuideV1 {
  return { ...input, verifiedAt, sources: [input.source], domains: domains(input.ml), levelMappings: canonicalLevels(), staffPlus: ["Ambiguous system scope", "Architecture and risk judgment", "Cross-team influence", "Durable technical mechanisms"] };
}

export const priorityCompanyGuides: CompanyGuideV1[] = [
  guide({
    slug: "amazon", company: "Amazon", publicationKind: "sourced-guide", ml: "role-dependent",
    overview: "Use current official software-development guidance as a modifier, then let the active role and recruiter instructions decide the actual plan.",
    source: official("amazon-official", "Amazon software development interview topics", "https://www.amazon.jobs/content/en/how-we-hire/interview-prep/software-development-topics", "Software-development candidates; exact assessment and loop vary by role."),
    claims: [claim({ id: "COMP-AMAZON-TECHNICAL-PREP", section: "process", text: "Amazon directs software-development candidates to prepare for coding, system design, and behavioral discussion based on its Leadership Principles, while asking candidates to confirm likely subjects and skills with recruiting.", sourceClass: "official", sourceId: "amazon-official", applicability: "Software-development candidates; the active role and recruiter instructions control.", confidence: "High", volatility: "periodic", editorialNote: "This supports preparation categories, not a universal round count, order, duration, or question set.", mayVary: true })],
    behavioralThemes: ["Customer impact", "Ownership with evidence", "Trade-offs and outcomes", "Learning from a miss"],
    recommendations: ["Read the official preparation page for the active role.", "Pair one coding rehearsal with one design and one story rehearsal.", "Replace generic assumptions with recruiter-confirmed details."],
    recruiterQuestions: ["Which technical and behavioral areas apply to this role?", "What tools and references are permitted?", "Is a design round included, and at what scope?"],
  }),
  guide({
    slug: "google", company: "Google", publicationKind: "sourced-guide", ml: "role-dependent",
    overview: "This hub uses Google’s current technical virtual-interview resource for environment guidance and leaves loop structure to the invitation and recruiter.",
    source: official("google-official", "Google technical virtual interview candidate guide", "https://services.google.com/fh/files/misc/technical_virtual_interviews_candidate_resource.pdf", "Technical virtual interviews; the interview confirmation defines which tools apply."),
    claims: [claim({ id: "COMP-GOOGLE-VIRTUAL-TOOLS", section: "tools", text: "Google’s technical virtual-interview resource explains how candidates may use Google Drawings for design work and says pen and paper can be used after telling the interviewer.", sourceClass: "official", sourceId: "google-official", applicability: "Technical virtual interviews where the confirmation or interviewer uses these tools.", confidence: "High", volatility: "fast-moving", editorialNote: "The resource documents environment options, not a universal software-engineering loop or level mapping.", mayVary: true })],
    behavioralThemes: ["Collaboration", "Ambiguity", "Feedback", "Project judgment"],
    recommendations: ["Practice only in the environment named in the interview confirmation.", "Keep coding fluency in scope at every preparation band.", "Add design practice only when the role or recruiter context warrants it."],
    recruiterQuestions: ["Which shared tools will be used?", "May I use pen and paper or another accessible equivalent?", "Which interview areas are included for this role?"],
  }),
  guide({
    slug: "meta", company: "Meta", publicationKind: "neutral-hub", ml: "role-dependent",
    overview: "The current official source attached to this hub does not establish one public software-engineering loop. The guide stays neutral until role-specific evidence is available.",
    source: official("meta-official", "Meta Careers", "https://www.metacareers.com/", "General careers and role discovery; not a universal interview-process source.", "Cautious", "fast-moving"),
    claims: [claim({ id: "COMP-META-PROCESS-NOT-ESTABLISHED", section: "role-applicability", text: "The current official source reviewed for this guide does not establish a universal software-engineering interview sequence.", sourceClass: "ef-inference", sourceId: "meta-official", applicability: "Public Meta engineering preparation before role-specific instructions are available.", confidence: "Cautious", volatility: "fast-moving", editorialNote: "This is an explicit evidence limit, not a claim that every Meta process is the same or unknown to the candidate.", mayVary: true })],
    behavioralThemes: ["Execution", "Collaboration", "Impact", "Technical judgment"],
    recommendations: ["Use the exact posting to select specialist practice.", "Treat third-party process reports as context, never policy.", "Confirm the assessment format before rehearsing it."],
    recruiterQuestions: ["What is the confirmed round sequence for this application?", "Which engineering specialty and level expectations apply?", "What tools and references are permitted?"],
  }),
  guide({
    slug: "walmart", company: "Walmart", publicationKind: "neutral-hub", ml: "evidence-limited",
    overview: "Walmart’s general hiring material supports a cautious, role-specific hub; it does not establish a universal Global Tech interview loop.",
    source: official("walmart-official", "Walmart hiring process", "https://careers.walmart.com/us/en/home/resources/hiring-process", "General Walmart and Sam’s Club applicants; technical format and geography remain role-specific.", "Cautious", "fast-moving"),
    claims: [claim({ id: "COMP-WALMART-ASSESSMENT-VARIATION", section: "process", text: "Walmart’s general hiring guidance says some positions require assessments and that response timing varies with the position, location, and applicant volume.", sourceClass: "official", sourceId: "walmart-official", applicability: "General Walmart and Sam’s Club applications; it does not define a Global Tech interview loop.", confidence: "Medium", volatility: "fast-moving", editorialNote: "Use this only to preserve role and location variability; the active posting and recruiting contact control technical details.", mayVary: true })],
    behavioralThemes: ["Customer impact", "Collaboration", "Execution", "Ownership"],
    recommendations: ["Keep geography and organization visible in the plan.", "Use the current job posting as the role-scope source.", "Do not translate titles or loops across regions."],
    recruiterQuestions: ["Does this role include an assessment or technical exercise?", "Which region and organization’s process applies?", "Which technical domains should I prepare?"],
  }),
  guide({
    slug: "microsoft", company: "Microsoft", publicationKind: "sourced-guide", ml: "role-dependent",
    overview: "Microsoft’s current technical-interview page supplies a useful execution baseline while keeping technical areas role-dependent.",
    source: official("microsoft-official", "Microsoft technical interviewing", "https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing.html", "Technical roles; the relevant technical areas and recruiter instructions vary."),
    claims: [
      claim({ id: "COMP-MICROSOFT-ENGINEERING-LIFECYCLE", section: "process", text: "Microsoft’s technical-interview guidance says candidates are evaluated on problem solving, design, coding, and testing, alongside competency and resume discussion.", sourceClass: "official", sourceId: "microsoft-official", applicability: "Technical interviews; the areas emphasized depend on the role.", confidence: "High", volatility: "periodic", editorialNote: "These are published evaluation areas, not numerical weights or a guaranteed round sequence.", mayVary: true }),
      claim({ id: "COMP-MICROSOFT-CODING-EXECUTION", section: "coding", text: "The same guidance asks candidates to clarify ambiguity, plan before implementation, write non-pseudocode in a strong language, and test the completed solution.", sourceClass: "official", sourceId: "microsoft-official", applicability: "Microsoft technical coding interviews described by the current public guide.", confidence: "High", volatility: "periodic", editorialNote: "The assigned interview instructions govern the actual platform and timing.", mayVary: true }),
    ],
    behavioralThemes: ["Problem framing", "Customer perspective", "Learning", "Responsible decisions"],
    recommendations: ["Rehearse clarifying, planning, coding, and testing as one sequence.", "Use the strongest permitted language.", "Choose role-specific technical domains from the posting and recruiter guidance."],
    recruiterQuestions: ["Which technical-excellence areas apply to this role?", "Which coding tool and language constraints apply?", "Is an accommodation or platform alternative needed?"],
  }),
  guide({
    slug: "nvidia", company: "NVIDIA", publicationKind: "sourced-guide", ml: "role-dependent",
    overview: "NVIDIA’s current hiring page establishes a role-aware process boundary and concrete rules for technical exercises.",
    source: official("nvidia-official", "NVIDIA: How we hire", "https://www.nvidia.com/en-us/about-nvidia/careers/how-we-hire/", "Technical roles; team, discipline, and assessment format differ by job."),
    claims: [
      claim({ id: "COMP-NVIDIA-INTERVIEW-FORMAT", section: "process", text: "NVIDIA says candidates may meet hiring managers, team members, and employees from other groups, and that one-on-one, small-group, or panel interviews usually last 30–60 minutes.", sourceClass: "official", sourceId: "nvidia-official", applicability: "General NVIDIA interviewing; exact participants and format depend on the role.", confidence: "High", volatility: "fast-moving", editorialNote: "This is a range from the current public page, not a guaranteed schedule.", mayVary: true }),
      claim({ id: "COMP-NVIDIA-CODING-TOOLS", section: "tools", text: "NVIDIA says technical candidates may be asked to complete a coding exercise and that using unapproved outside tools during the interview can disqualify a candidacy.", sourceClass: "official", sourceId: "nvidia-official", applicability: "Technical roles when a coding exercise is assigned.", confidence: "High", volatility: "fast-moving", editorialNote: "Ask the recruiter which tools are approved for the assigned assessment.", mayVary: true }),
    ],
    behavioralThemes: ["Technical judgment", "Collaboration", "Learning", "Role depth"],
    recommendations: ["Separate general software preparation from GPU, systems, or ML depth.", "Practice in the assigned environment without unapproved tools.", "Use the role description to select specialist tracks."],
    recruiterQuestions: ["Will this role include a coding exercise?", "Which tools and references are approved?", "Which systems, GPU, or ML domains are in scope?"],
  }),
  guide({
    slug: "openai", company: "OpenAI", publicationKind: "sourced-guide", ml: "role-dependent",
    overview: "OpenAI’s current interview guide describes a team-dependent process, explicit tool rules, and the published engineering focus without implying one universal loop.",
    source: official("openai-official", "OpenAI interview guide", "https://openai.com/interview-guide/", "All roles; skills assessments and final interviews are team- and role-dependent.", "High", "fast-moving"),
    claims: [
      claim({ id: "COMP-OPENAI-SKILLS-ASSESSMENTS", section: "process", text: "OpenAI says skills assessments vary by team and may include pair coding, take-home projects, or technical tests, with preparation details supplied by recruiting.", sourceClass: "official", sourceId: "openai-official", applicability: "OpenAI applicants whose role advances to a skills assessment.", confidence: "High", volatility: "fast-moving", editorialNote: "The examples are possibilities, not a promised format for every role.", mayVary: true }),
      claim({ id: "COMP-OPENAI-ENGINEERING-FOCUS", section: "coding", text: "OpenAI says engineering interviews generally focus on solution design, code quality, performance, testing, communication, and collaboration.", sourceClass: "official", sourceId: "openai-official", applicability: "Engineering interviews; specialty depth remains role-specific.", confidence: "High", volatility: "fast-moving", editorialNote: "This supports preparation dimensions, not a hidden rubric or score.", mayVary: true }),
      claim({ id: "COMP-OPENAI-TOOL-RULES", section: "tools", text: "OpenAI says AI and other tool permissions differ by interview and that preparation materials identify what is allowed; candidates should ask recruiting when unsure.", sourceClass: "official", sourceId: "openai-official", applicability: "OpenAI interview stages with an assigned assessment environment.", confidence: "High", volatility: "fast-moving", editorialNote: "Preparation use of AI never establishes permission during an assessment.", mayVary: true }),
    ],
    behavioralThemes: ["Collaboration", "Communication", "Feedback", "Mission-grounded motivation"],
    recommendations: ["Read current work from the team you are meeting.", "Practice the assessment format supplied by recruiting.", "Select ML Design only when the role scope supports it."],
    recruiterQuestions: ["Which assessment format will this team use?", "Which AI or other tools are permitted at each stage?", "Which engineering dimensions should I expect to demonstrate?"],
  }),
  guide({
    slug: "anthropic", company: "Anthropic", publicationKind: "sourced-guide", ml: "role-dependent",
    overview: "Anthropic’s current careers page gives technical candidates a concrete environment baseline while keeping engineering, research, and ML scope distinct.",
    source: official("anthropic-official", "Anthropic careers and how we hire", "https://www.anthropic.com/careers", "Technical roles; engineering, research, and infrastructure scope differ.", "High", "fast-moving"),
    claims: [
      claim({ id: "COMP-ANTHROPIC-LIVE-CODING", section: "tools", text: "Anthropic says technical interviews use live coding tools such as Colab and CodeSignal, and that candidates can look things up while remaining fluent with basic syntax and standard libraries.", sourceClass: "official", sourceId: "anthropic-official", applicability: "Technical roles with programming-focused interviews.", confidence: "High", volatility: "fast-moving", editorialNote: "The current page names tools and lookup expectations; it does not make ML experience universal.", mayVary: true }),
      claim({ id: "COMP-ANTHROPIC-EXPERIENCE-MOTIVATION", section: "behavioral", text: "Anthropic says technical interviews also include discussion of the candidate’s experience and motivation.", sourceClass: "official", sourceId: "anthropic-official", applicability: "Technical applicants covered by the current careers guidance.", confidence: "High", volatility: "fast-moving", editorialNote: "Prepare truthful project evidence; this does not establish a culture-fit score.", mayVary: true }),
    ],
    behavioralThemes: ["Clarity", "Judgment", "Collaboration", "Genuine motivation"],
    recommendations: ["Practice live coding with standard-library fluency.", "Discuss your own work accurately and deeply.", "Add ML preparation only where the job scope makes it relevant."],
    recruiterQuestions: ["Which shared coding environment will be used?", "What lookup or tool use is permitted?", "How does this role divide engineering, research, and ML depth?"],
  }),
  guide({
    slug: "atlassian", company: "Atlassian", publicationKind: "sourced-guide", ml: "role-dependent",
    overview: "Atlassian’s current engineering handbook supports several explicit preparation modifiers while leaving exact role and location details visible as variable.",
    source: official("atlassian-official", "Atlassian engineering interview handbook", "https://www.atlassian.com/company/careers/resources/interviewing/engineering", "Engineering candidates; role and location can change the exact process.", "High", "fast-moving"),
    claims: [
      claim({ id: "COMP-ATLASSIAN-CODING", section: "coding", text: "Atlassian’s engineering handbook describes a coding stage with data-structures and code-design parts, with language choice and problem-solving approach emphasized.", sourceClass: "official", sourceId: "atlassian-official", applicability: "Engineering candidates covered by the current handbook.", confidence: "High", volatility: "fast-moving", editorialNote: "The handbook supplies a preparation model; the assigned role details still control.", mayVary: true }),
      claim({ id: "COMP-ATLASSIAN-SYSTEM-DESIGN", section: "design", text: "The handbook describes a 60-minute systems-design conversation focused on exploring constraints, trade-offs, collaborators, and technology choices.", sourceClass: "official", sourceId: "atlassian-official", applicability: "Engineering candidates assigned the systems-design stage.", confidence: "High", volatility: "fast-moving", editorialNote: "Do not assume every role receives the same design prompt or stage.", mayVary: true }),
      claim({ id: "COMP-ATLASSIAN-VALUES", section: "behavioral", text: "The handbook describes a distinct values interview and a final Hiring Committee review after interviewer feedback is consolidated.", sourceClass: "official", sourceId: "atlassian-official", applicability: "Engineering candidates covered by the current handbook; exact scheduling may vary.", confidence: "High", volatility: "fast-moving", editorialNote: "Published values are preparation context, not a secret scoring rubric.", mayVary: true }),
    ],
    behavioralThemes: ["Values through real decisions", "Project depth", "Collaboration", "Learning agility"],
    recommendations: ["Prepare one or two projects in depth.", "Practice clarifying and adapting to follow-up constraints.", "Use published values as prompts without forcing every story into a slogan."],
    recruiterQuestions: ["Which handbook stages apply to this role?", "Which coding and design tools will be used?", "Does role or location change the scheduled sequence?"],
  }),
  guide({
    slug: "uber", company: "Uber", publicationKind: "sourced-guide", ml: "role-dependent",
    overview: "Uber’s current candidate hub routes engineering candidates to role-specific guides instead of presenting one universal engineering process.",
    source: official("uber-official", "Uber: Get interview ready", "https://jobs.uber.com/en/get-interview-ready/", "Applicants; candidates should choose the guide matching their role family.", "High", "fast-moving"),
    claims: [claim({ id: "COMP-UBER-ROLE-GUIDES", section: "role-applicability", text: "Uber’s current candidate hub publishes separate interview guides for general engineering and specialties including data, frontend, iOS, management, production, ML/AI, and security.", sourceClass: "official", sourceId: "uber-official", applicability: "Uber applicants selecting preparation guidance for their role family.", confidence: "High", volatility: "fast-moving", editorialNote: "Use the exact specialty guide and recruiter instructions; this claim does not establish one shared loop.", mayVary: true })],
    behavioralThemes: ["Collaboration", "Operational judgment", "Customer impact", "Execution"],
    recommendations: ["Open the official guide matching the role family.", "Use System Design for backend or platform scope.", "Use ML Design only for ML/AI-oriented roles."],
    recruiterQuestions: ["Which published specialty guide matches this role?", "What round sequence is confirmed for this application?", "Which tools and technical domains are in scope?"],
  }),
];

export const priorityCompanyGuideBySlug = Object.fromEntries(priorityCompanyGuides.map((item) => [item.slug, item])) as Record<string, CompanyGuideV1>;
export const priorityCompanySlugs = priorityCompanyGuides.map((item) => item.slug);
