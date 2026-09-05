import type { RoundExecutionGuideSlug } from "./round-execution";

export type InterviewPlaybookSource = Readonly<{
  id: string;
  title: string;
  publisher: string;
  href: string;
  sourceClass: string;
  verifiedAt: string;
  use: string;
}>;

export const INTERVIEW_PLAYBOOK_SOURCES: readonly InterviewPlaybookSource[] = [
  {
    id: "SRC-BEH-OPM-STRUCTURED",
    title: "Structured Interviews",
    publisher: "U.S. Office of Personnel Management",
    href: "https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/",
    sourceClass: "Government assessment guidance",
    verifiedAt: "2026-09-05",
    use: "Supports the distinction between a job-related competency, a prompt, observable evidence, and a consistent evaluation process. It does not define a private employer's process.",
  },
  {
    id: "SRC-BEH-OPM-GUIDE",
    title: "Structured Interview Guide",
    publisher: "U.S. Office of Personnel Management",
    href: "https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/guide/",
    sourceClass: "Government assessment guidance",
    verifiedAt: "2026-09-05",
    use: "Supports competency-linked questions, follow-up structure, and evidence-based evaluation. Candidate guidance remains an Engineering Foundry synthesis.",
  },
  {
    id: "SRC-COMP-MICROSOFT-OFFICIAL",
    title: "Technical interviewing",
    publisher: "Microsoft Careers",
    href: "https://careers.microsoft.com/v2/global/en/hiring-tips/technical-interviewing.html",
    sourceClass: "Official employer guidance",
    verifiedAt: "2026-09-05",
    use: "Provides one current employer example of clarifying, planning, coding, testing, and role-dependent technical coverage. Microsoft-specific timing and process claims are never generalized.",
  },
  {
    id: "SRC-COMP-AMAZON-OFFICIAL",
    title: "Software development interview topics",
    publisher: "Amazon Jobs",
    href: "https://www.amazon.jobs/content/en/how-we-hire/interview-prep/software-development-topics",
    sourceClass: "Official employer guidance",
    verifiedAt: "2026-09-05",
    use: "Provides a second employer-scoped example of technical and behavioral preparation. It is a modifier for applicable Amazon candidates, not a universal loop contract.",
  },
  {
    id: "SRC-PLAY-EEOC-ACCOMMODATION",
    title: "Reasonable accommodation and job applicants",
    publisher: "U.S. Equal Employment Opportunity Commission",
    href: "https://www.eeoc.gov/laws/guidance/enforcement-guidance-reasonable-accommodation-and-undue-hardship-under-ada#jobapplicants",
    sourceClass: "U.S. government legal guidance",
    verifiedAt: "2026-09-05",
    use: "Supports routing U.S. accommodation questions to the employer's candidate or accommodation channel. Engineering Foundry does not decide entitlement or offer jurisdiction-free legal advice.",
  },
  {
    id: "SRC-PLAY-MIT-PRESENTATION",
    title: "Structuring a Slide Presentation",
    publisher: "MIT NSE Communication Lab",
    href: "https://mitcommlab.mit.edu/nse/commkit/structuring-a-slide-presentation/",
    sourceClass: "University technical-communication guidance",
    verifiedAt: "2026-09-05",
    use: "Supports audience, purpose, central-message, evidence, structure, format, and question-planning guidance for the technical-presentation dossier.",
  },
  {
    id: "SRC-PLAY-YALE-AFTER-INTERVIEW",
    title: "After the Interview",
    publisher: "Yale Law School Career Development Office",
    href: "https://law.yale.edu/student-life/career-development/students/toolkit-student-job-seekers/interviewing/after-the-interview",
    sourceClass: "University career guidance",
    verifiedAt: "2026-09-05",
    use: "Supports prompt post-interview factual notes and preserving the employer's stated hiring timeline. Engineering Foundry keeps technical learning notes separate and private.",
  },
];

export const INTERVIEW_PLAYBOOK_SOURCE_BY_ID = new Map(
  INTERVIEW_PLAYBOOK_SOURCES.map((source) => [source.id, source]),
);

export type RoundExecutionClaimMapping = Readonly<{
  claimGroup: string;
  sourceIds: readonly string[];
  classification: "source-grounded" | "employer-example" | "editorial-synthesis";
  boundary: string;
}>;

const COMMON_ROUND_CLAIMS: readonly RoundExecutionClaimMapping[] = [
  {
    claimGroup: "Evaluation intent and observable evidence",
    sourceIds: ["SRC-BEH-OPM-STRUCTURED", "SRC-BEH-OPM-GUIDE"],
    classification: "source-grounded",
    boundary: "These sources explain structured, competency-linked assessment. They do not reveal a private employer's rubric or predict a hiring decision.",
  },
  {
    claimGroup: "Clarify, plan, execute, validate, and communicate",
    sourceIds: ["SRC-COMP-MICROSOFT-OFFICIAL", "SRC-COMP-AMAZON-OFFICIAL"],
    classification: "employer-example",
    boundary: "The sources are current employer examples. The reusable sequence is Engineering Foundry's reviewed synthesis; company-specific timing and format stay company-scoped.",
  },
  {
    claimGroup: "Recovery, partial completion, seniority overlays, and illustrative interactions",
    sourceIds: [],
    classification: "editorial-synthesis",
    boundary: "These are reviewed coaching frameworks and examples, not research findings, scoring rules, or claims about how every interviewer behaves.",
  },
  {
    claimGroup: "Accessibility and accommodation routing",
    sourceIds: ["SRC-PLAY-EEOC-ACCOMMODATION"],
    classification: "source-grounded",
    boundary: "The source is U.S.-specific. The dossier routes candidates to the employer's current channel and does not determine legal eligibility.",
  },
];

const TECHNICAL_PRESENTATION_CLAIMS: readonly RoundExecutionClaimMapping[] = [
  ...COMMON_ROUND_CLAIMS,
  {
    claimGroup: "Audience, purpose, central message, evidence, structure, and question planning",
    sourceIds: ["SRC-PLAY-MIT-PRESENTATION"],
    classification: "source-grounded",
    boundary: "MIT guidance anchors the communication method; the interview-specific execution and examples are Engineering Foundry synthesis and must yield to the actual assignment.",
  },
];

const DOSSIER_SLUGS: readonly RoundExecutionGuideSlug[] = [
  "algorithmic-coding",
  "practical-coding",
  "debugging",
  "code-review",
  "low-level-design",
  "system-design",
  "ml-system-design",
  "behavioral",
  "project-deep-dive",
];

export const ROUND_EXECUTION_CLAIMS_BY_SLUG: ReadonlyMap<RoundExecutionGuideSlug, readonly RoundExecutionClaimMapping[]> = new Map([
  ...DOSSIER_SLUGS.map((slug) => [slug, COMMON_ROUND_CLAIMS] as const),
  ["technical-presentation", TECHNICAL_PRESENTATION_CLAIMS],
]);

export function getRoundExecutionClaimMappings(slug: RoundExecutionGuideSlug) {
  return ROUND_EXECUTION_CLAIMS_BY_SLUG.get(slug) ?? [];
}

