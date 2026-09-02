import { readFileSync } from "node:fs";

const failures = [];
const read = (file) => readFileSync(file, "utf8");
const requireText = (source, text, message) => { if (!source.includes(text)) failures.push(message); };
const prohibit = (source, pattern, message) => { if (pattern.test(source)) failures.push(message); };

const data = read("data/dsa/study-plans.ts");
for (const marker of ["StudyPlanLevel", "StudyPlanDuration", "StudyPlanPhase", "StudyPlanWeek", "StudyPlanDay", "StudyPlanPriority", "assertStudyPlanIntegrity", "coreInterviewRoadmap", "getRoadmapPracticeHref"]) requireText(data, marker, `Study plan data lacks ${marker}.`);
for (const level of ["sde1", "sde2", "senior"]) requireText(data, `${level}: {`, `Study plan data lacks ${level}.`);
for (const duration of ["30:", "60:", "90:"]) requireText(data, duration, `Study plan data lacks ${duration.replace(":", "")}-day configuration.`);
for (const phase of ["Foundation", "Core Patterns", "Advanced Patterns", "Targeted Practice", "Interview Simulation", "Spaced Repetition"]) requireText(data, phase, `Study plan data lacks ${phase}.`);
for (const topic of ["arrays-hashing", "two-pointers", "sliding-window", "trees", "graphs", "one-d-dp", "two-d-dp"]) requireText(data, topic, `Study plan data lacks canonical topic ${topic}.`);
prohibit(data, /\b(?:streak|XP|success probability|expected interview score)\b/i, "Study plan data contains unsupported progress or outcome claims.");

const page = read("features/dsa/study-plans/study-plan-page.tsx");
for (const marker of ["useSearchParams", "router.push", 'params.set(key, value)', "StudyPlanSelector", "StudyPlanOverview", "StudyPlanWeekList", "ReadinessChecklist", 'searchParams.get("company")']) requireText(page, marker, `Study plan page lacks ${marker}.`);
for (const marker of ["accountPlatformAvailable: boolean", "accountPlatformAvailable={accountPlatformAvailable}", 'key={`${plan.level}-${plan.duration}`}']) requireText(page, marker, `DSA study-plan save wiring lacks ${marker}.`);

const selector = read("features/dsa/study-plans/study-plan-selector.tsx");
for (const marker of ["Target level", "Preparation time", "aria-pressed", "SDE I", "SDE II", "Senior / SDE III", "30 Days", "60 Days", "90 Days"]) requireText(selector + data, marker, `Study plan selector lacks ${marker}.`);

const week = read("features/dsa/study-plans/study-plan-week.tsx");
for (const marker of ["aria-expanded", "aria-controls", "/dsa/roadmap?topic=", "getStudyPlanPracticeHref", "Interview focus", "Checkpoint", "Suggested daily rhythm", "Must Know", "Important", "Optional"]) requireText(week, marker, `Study plan week lacks ${marker}.`);

const readiness = read("features/dsa/study-plans/readiness-checklist.tsx");
for (const marker of ["Low priority for this plan", "Already comfortable with the fundamentals?", "Jump to interview practice", "Before interviewing, you should be able to:", "/dsa/strategy#communication", "not saved progress"]) requireText(readiness, marker, `Study plan readiness UI lacks ${marker}.`);

const route = read("app/dsa/[...segments]/page.tsx");
for (const marker of ['segments[0] === "study-plans"', "StudyPlansPage", "StudyPlanPage", "30, 60 & 90 Day Coding Interview Study Plans"]) requireText(route, marker, `Study plan route lacks ${marker}.`);
for (const marker of ['import { isAccountPlatformAvailable } from "@/lib/account-platform"', "<StudyPlanPage accountPlatformAvailable={isAccountPlatformAvailable()} />"]) requireText(route, marker, `The DSA study-plan route lacks its server-provided account availability contract: ${marker}.`);

const workspace = read("components/dsa-workspace.tsx");
for (const marker of ["Then choose your pace", "30 days for focus", "60 for balance", "90 for broader coverage", "/dsa/study-plans"]) requireText(workspace, marker, `DSA overview does not explain the role → timeframe hierarchy: ${marker}.`);

const css = read("app/globals.css");
for (const marker of [".dsa-plan-selector", ".dsa-plan-timeline", ".dsa-plan-week", ".dsa-plan-days", ".dsa-plan-readiness", "@media (max-width: 430px)", "prefers-reduced-motion"]) requireText(css, marker, `Study plan styling lacks ${marker}.`);
requireText(read("app/dsa-phase3b.css"), ".dsa-plan-segments.role { grid-template-columns: 1fr", "Mobile role choices must remain fully visible without a concealed horizontal scroller.");

if (failures.length) {
  console.error(`DSA study-plan regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("DSA study-plan regression passed: nine role-aware plans, canonical roadmap topics, URL state, server-provided account availability wiring, weekly disclosure, practice links, interview mode, and responsive accessibility hold. Rendered save outcomes still require browser validation.");
