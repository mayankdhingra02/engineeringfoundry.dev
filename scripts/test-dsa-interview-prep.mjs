import { readFileSync } from "node:fs";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };
const prohibit = (source, pattern, message) => { if (pattern.test(source)) failures.push(message); };

const curriculum = read("data/dsa/curriculum.ts");
for (const label of ["Start Here", "Company Tagged Questions", "DSA by Language", "Interview Roadmaps", "Interview Strategy"]) requireText(curriculum, `"${label}"`, `Curriculum is missing ${label}.`);
for (const route of ["/dsa/companies", "/dsa/roadmap", "/dsa/languages/choose-a-language", "/dsa/roadmaps", "problem-solving-framework"]) requireText(curriculum, route, `Curriculum is missing ${route}.`);

const questions = read("data/dsa/interview-prep.ts");
for (const field of ["frequency?:", "lastSeen?:", "roles?:", "isSample:", "sources:", "questionStatusById"]) requireText(questions, field, `Question/progress schema is missing ${field}.`);
requireText(questions, "Demonstration records only", "Sample company data lacks a code-level demonstration warning.");
prohibit(questions, /frequency:\s*"(?:Low|Medium|High)"/, "Sample data invents company question frequency.");
prohibit(questions, /lastSeen:\s*["']\d/, "Sample data invents last-seen dates.");

const browser = read("features/dsa/questions/question-browser.tsx");
const browserUrlState = read("lib/dsa/question-browser-url-state.ts");
for (const label of ["Company", "Difficulty", "Topics", "Source", "Search", "Rows per page"]) requireText(browser, `>${label}<`, `Question browser lacks a ${label} control.`);
for (const parameter of ["q", "company", "difficulty", "topic", "source", "page", "pageSize"]) requireText(browserUrlState, `singleValue(params, "${parameter}")`, `Question browser URL state lacks validated ${parameter} parsing.`);
for (const marker of ["QuestionStats", "TopicQuickFilters", "No questions match these filters", "useDeferredValue"]) requireText(browser, marker, `Question browser lacks ${marker}.`);
requireText(browserUrlState, "[25, 50, 100] as const", "Question browser URL state lacks the supported page sizes.");
requireText(browser, "Demo company tags", "Question browser does not visibly label demo company associations.");
for (const marker of ["More filters", "dsa-active-filters", "selectedCompanySlug", "filtered.slice(0, 4)"]) requireText(browser, marker, `Question browser lacks the Phase 3B progressive-disclosure behavior: ${marker}.`);

const table = read("features/dsa/questions/question-table.tsx");
for (const attribute of ['target="_blank"', 'rel="noopener noreferrer"', "<table", 'scope="col"', "/dsa/companies/"]) requireText(table, attribute, `Question table lacks ${attribute}.`);
prohibit(table, /frequency|lastSeen/i, "Question table exposes unverified frequency or last-seen claims.");

const database = read("data/dsa/question-database.ts");
for (const marker of ["activeQuestions", "sampleCompanyQuestions", "dsaInterviewQuestionDatabase", "metadata-only"]) requireText(database, marker, `Question database adapter lacks ${marker}.`);

const route = read("app/dsa/[...segments]/page.tsx");
for (const marker of ["export const dynamicParams = false", "generateStaticParams", "PythonDSAGuide", "RoadmapTimeline", "QuestionBrowser", "DSAWorkspacePageLayout", 'segments[0] === "questions"', 'segments[0] === "companies"']) requireText(route, marker, `DSA route architecture lacks ${marker}.`);

const sidebar = read("components/dsa-sidebar.tsx");
for (const marker of ["aria-expanded", "aria-controls", "sessionStorage", "useModalDrawer", 'role="dialog"', 'aria-modal="true"']) requireText(sidebar, marker, `DSA sidebar lacks ${marker}.`);

const drawerHook = read("hooks/use-modal-drawer.ts");
for (const marker of ["Escape", "Tab", 'document.body.style.overflow = "hidden"', "trigger?.focus()"])
  requireText(drawerHook, marker, `Shared modal drawer behavior lacks ${marker}.`);

const roadmap = read("data/dsa/roadmaps.ts");
for (const role of ["New Grad", "SDE I", "SDE II", "SDE III / Senior"]) requireText(roadmap, `"${role}"`, `Roadmap matrix lacks ${role}.`);
for (const duration of [30, 60, 90]) requireText(roadmap, String(duration), `Roadmap matrix lacks ${duration} days.`);
requireText(roadmap, 'status: durationDays === 60 && role.slug === "sde-2"', "SDE II 60-day example is not the sole published roadmap model.");

const css = read("app/globals.css");
for (const marker of [".dsa-browser-table", ".dsa-browser-stats", ".dsa-database-filters", ".dsa-company-directory-grid", "@media (max-width: 720px)", ".dsa-roadmap-timeline"]) requireText(css, marker, `Responsive DSA styling lacks ${marker}.`);

const workspace = read("app/dsa/page.tsx");
for (const marker of ["DSAWorkspaceSidebar", "DSAWorkspaceHeader", "QuestionBrowserPreview", "RoadmapPreview", "ReviewPreview"]) requireText(workspace, marker, `Compact DSA workspace lacks ${marker}.`);
prohibit(workspace, /CompanyQuickLinks|StudyPlanPreview/, "The DSA landing page restored duplicated company or study-plan entry blocks.");
prohibit(workspace, /DSAQuickStart/, "The removed DSA quick-start section returned to the workspace.");
prohibit(workspace, /PageHero|SectionHeading/, "DSA workspace regressed to the marketing-page shell.");
prohibit(workspace, /Continue DSA|Continue preparation/, "The DSA workspace fabricates continuation without persisted progress.");

const workspaceSidebar = read("components/dsa-workspace-sidebar.tsx");
for (const label of ["Practice", "Roadmap", "Review"]) requireText(workspaceSidebar, `label: "${label}"`, `Workspace navigation lacks the primary ${label} job.`);
for (const label of ["Company questions", "Study plans", "Topic map", "Pattern index", "Interview strategy"]) requireText(workspaceSidebar, `label: "${label}"`, `Workspace navigation lacks the subordinate ${label} route.`);
prohibit(workspaceSidebar, /label: "Company Tagged"/, "Workspace navigation duplicates the company filter with a separate Company Tagged item.");
for (const route of ['/dsa/companies', '/dsa/company-questions']) requireText(workspaceSidebar, `path.startsWith("${route}")`, `Practice navigation does not own ${route}.`);
const practiceIndex = workspaceSidebar.indexOf('label: "Practice"');
const roadmapIndex = workspaceSidebar.indexOf('label: "Roadmap"');
const reviewIndex = workspaceSidebar.indexOf('label: "Review"');
if (!(practiceIndex < roadmapIndex && roadmapIndex < reviewIndex)) failures.push("Workspace jobs must appear in Practice → Roadmap → Review order.");
for (const marker of ['role="dialog"', 'aria-modal="true"', "useModalDrawer", "aria-current="]) requireText(workspaceSidebar, marker, `Workspace sidebar lacks ${marker}.`);

const workspaceComponents = read("components/dsa-workspace.tsx");
for (const marker of ["Choose a roadmap for your level", "dsaRoadmapLevels", "Then choose your pace", "30 days for focus", "Review when you find a gap"]) requireText(workspaceComponents, marker, `DSA entry hierarchy lacks ${marker}.`);

const levelExperience = read("features/dsa/roadmap/level-roadmap-experience.tsx");
const nextUpIndex = levelExperience.indexOf("<RoadmapNextUp");
const curriculumIndex = levelExperience.indexOf('className="dsa-level-roadmap-curriculum"');
const supportingIndex = levelExperience.indexOf('className="dsa-roadmap-supporting-details"');
if (!(nextUpIndex > 0 && curriculumIndex > nextUpIndex && supportingIndex > curriculumIndex)) failures.push("Roadmap execution must precede progressively disclosed rationale and diagnostics.");

const studyPlanSelector = read("features/dsa/study-plans/study-plan-selector.tsx");
if (!(studyPlanSelector.indexOf("Target level") < studyPlanSelector.indexOf("Preparation time"))) failures.push("Study plan hierarchy must remain Role → preparation time.");
requireText(studyPlanSelector, "Choose the role first", "Study plan hierarchy is not explained in the UI.");

const preview = read("features/dsa/question-browser-preview.tsx");
for (const marker of ["QuestionBrowserPreviewCore", "/dsa/questions", "demonstration data"]) requireText(preview, marker, `Question preview lacks ${marker}.`);
prohibit(preview, /Frequently reported|frequency:\s*["']/, "Question preview fabricates frequency information.");

if (failures.length) {
  console.error(`DSA interview-preparation regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("DSA interview-preparation regression passed: shared database, canonical routes, URL filters, legal source links, data integrity, and responsive architecture hold.");
