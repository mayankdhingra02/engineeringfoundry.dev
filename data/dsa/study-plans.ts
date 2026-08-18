import { coreInterviewRoadmap, getCoreRoadmapTopic, getRoadmapPracticeHref } from "@/data/dsa/core-roadmap";

export type StudyPlanLevel = "sde1" | "sde2" | "senior";
export type StudyPlanDuration = 30 | 60 | 90;
export type StudyPlanPriority = "must-know" | "important" | "optional";
export type StudyPlanDifficulty = "easy-medium" | "mostly-medium" | "medium-hard";

export interface StudyPlanDay {
  day: number;
  guidance: string;
}

export interface StudyPlanTopic {
  topicId: string;
  priority: StudyPlanPriority;
}

export interface StudyPlanWeek {
  week: number;
  phaseId: string;
  title: string;
  focus: string;
  topics: StudyPlanTopic[];
  difficulty: StudyPlanDifficulty;
  interviewFocus: string[];
  checkpoint: string;
  days: StudyPlanDay[];
}

export interface StudyPlanPhase {
  id: string;
  title: string;
  description: string;
  firstWeek: number;
  lastWeek: number;
}

export interface StudyPlan {
  level: StudyPlanLevel;
  levelLabel: string;
  duration: StudyPlanDuration;
  title: string;
  objective: string;
  goal: string;
  weeks: StudyPlanWeek[];
  phases: StudyPlanPhase[];
  deprioritized: string[];
}

export const studyPlanLevels = [
  { value: "sde1", label: "SDE I", description: "Reliable fundamentals and medium-problem execution" },
  { value: "sde2", label: "SDE II", description: "Breadth, speed, and deeper optimization reasoning" },
  { value: "senior", label: "Senior / SDE III", description: "High-quality reasoning, testing, and communication" },
] as const;

export const studyPlanDurations = [
  { value: 30, label: "30 Days", description: "Crash plan" },
  { value: 60, label: "60 Days", description: "Balanced plan" },
  { value: 90, label: "90 Days", description: "Broader coverage + repetition" },
] as const;

type TopicBucket = "foundation-a" | "foundation-b" | "structures" | "trees" | "graphs" | "advanced" | "mixed" | "company" | "simulation";

interface RoleConfiguration {
  label: string;
  objective: string;
  goal: string;
  topics: Record<TopicBucket, string[]>;
  mustKnow: string[];
  optional: string[];
  interviewFocus: string[];
  checkpoints: string[];
  deprioritized: Record<StudyPlanDuration, string[]>;
}

const roleConfigurations: Record<StudyPlanLevel, RoleConfiguration> = {
  sde1: {
    label: "SDE I",
    objective: "Strong fundamentals + reliable medium-problem performance.",
    goal: "Recognize the highest-frequency patterns, implement them cleanly, and explain complexity without prompting.",
    topics: {
      "foundation-a": ["arrays-hashing", "two-pointers", "sliding-window"],
      "foundation-b": ["stack", "binary-search", "linked-list"],
      structures: ["heap-priority-queue", "intervals"],
      trees: ["trees", "backtracking"],
      graphs: ["graphs"],
      advanced: ["one-d-dp", "greedy"],
      mixed: ["arrays-hashing", "sliding-window", "trees", "graphs"],
      company: ["arrays-hashing", "binary-search", "trees", "heap-priority-queue"],
      simulation: ["two-pointers", "sliding-window", "trees", "one-d-dp"],
    },
    mustKnow: ["arrays-hashing", "two-pointers", "sliding-window", "stack", "binary-search", "linked-list", "trees", "heap-priority-queue", "graphs"],
    optional: ["intervals", "greedy"],
    interviewFocus: ["State the brute-force approach before optimizing.", "Test empty input, one element, duplicates, and boundary indexes.", "Say the time and space complexity before you finish."],
    checkpoints: ["Can you identify the pattern without being told its category?", "Can you produce a clean medium solution with only minor debugging?", "Can you explain why the optimized approach is correct?"],
    deprioritized: {
      30: ["Advanced graph algorithms", "difficult multidimensional DP", "obscure bit tricks"],
      60: ["Competitive-programming graph techniques", "unusual mathematical tricks", "deep 2-D DP variants"],
      90: ["Obscure contest techniques", "proof-heavy algorithms rarely used in interviews", "advanced geometry"],
    },
  },
  sde2: {
    label: "SDE II",
    objective: "Breadth + speed + deeper reasoning.",
    goal: "Cover the major interview patterns, then transition to medium-heavy mixed sets, selected hard reasoning, and timed simulations.",
    topics: {
      "foundation-a": ["arrays-hashing", "two-pointers", "sliding-window"],
      "foundation-b": ["stack", "binary-search", "linked-list"],
      structures: ["heap-priority-queue", "intervals", "greedy"],
      trees: ["trees", "tries", "backtracking"],
      graphs: ["graphs", "advanced-graphs"],
      advanced: ["one-d-dp", "two-d-dp"],
      mixed: ["sliding-window", "trees", "graphs", "one-d-dp"],
      company: ["binary-search", "heap-priority-queue", "intervals", "graphs"],
      simulation: ["arrays-hashing", "trees", "graphs", "two-d-dp"],
    },
    mustKnow: ["arrays-hashing", "two-pointers", "sliding-window", "stack", "binary-search", "linked-list", "trees", "heap-priority-queue", "intervals", "graphs", "one-d-dp"],
    optional: ["advanced-graphs", "two-d-dp"],
    interviewFocus: ["Compare two viable approaches before choosing one.", "Name the invariant and the edge case most likely to break it.", "Explain optimization and data-structure trade-offs while coding."],
    checkpoints: ["Can you recognize the pattern quickly inside an unfamiliar problem?", "Can you solve medium questions under a realistic time limit?", "Can you recover after discarding a first approach?"],
    deprioritized: {
      30: ["Advanced graph proofs", "rare bit-manipulation tricks", "large multidimensional DP state spaces"],
      60: ["Obscure mathematical problems", "contest-specific data structures", "advanced geometry"],
      90: ["Competitive-programming-only techniques", "low-frequency mathematical tricks", "specialized string algorithms"],
    },
  },
  senior: {
    label: "Senior / SDE III",
    objective: "High-quality reasoning and execution under interview conditions.",
    goal: "Keep fundamentals sharp while practicing ambiguity, trade-offs, clean implementation, testing, and recovery under pressure.",
    topics: {
      "foundation-a": ["arrays-hashing", "two-pointers", "sliding-window"],
      "foundation-b": ["binary-search", "linked-list", "stack"],
      structures: ["heap-priority-queue", "intervals", "greedy"],
      trees: ["trees", "tries", "backtracking"],
      graphs: ["graphs", "advanced-graphs"],
      advanced: ["one-d-dp", "two-d-dp", "bit-manipulation"],
      mixed: ["binary-search", "trees", "graphs", "two-d-dp"],
      company: ["heap-priority-queue", "intervals", "advanced-graphs", "two-d-dp"],
      simulation: ["arrays-hashing", "trees", "advanced-graphs", "two-d-dp"],
    },
    mustKnow: ["arrays-hashing", "two-pointers", "sliding-window", "binary-search", "trees", "heap-priority-queue", "intervals", "graphs"],
    optional: ["bit-manipulation"],
    interviewFocus: ["Turn ambiguous requirements into explicit constraints before coding.", "Discuss maintainability, testing strategy, and optimization trade-offs.", "Narrate how you recover when the first model is incomplete."],
    checkpoints: ["Can you clarify ambiguity without over-scoping the problem?", "Can you defend solution quality beyond asymptotic complexity?", "Can you test and revise an approach while communicating clearly?"],
    deprioritized: {
      30: ["Competitive-programming techniques", "obscure bit tricks", "proof-heavy graph algorithms"],
      60: ["Specialized contest data structures", "advanced geometry", "memorizing rare hard solutions"],
      90: ["Techniques with no clear interview transfer", "deep mathematical puzzles", "speed practice without explanation or testing"],
    },
  },
};

const scheduleTemplates: Record<StudyPlanDuration, Array<{ phaseId: string; phaseTitle: string; phaseDescription: string; title: string; bucket: TopicBucket; focus: string; difficulty: StudyPlanDifficulty }>> = {
  30: [
    { phaseId: "foundation", phaseTitle: "Foundation", phaseDescription: "Restore fluency in the patterns with the highest interview return.", title: "Core patterns", bucket: "foundation-a", focus: "Recognize array, lookup, pointer, and window patterns quickly.", difficulty: "easy-medium" },
    { phaseId: "core", phaseTitle: "Core Structures", phaseDescription: "Practice traversal, recursion, and the data structures that unlock medium questions.", title: "Trees, recursion & structures", bucket: "trees", focus: "Choose traversal state deliberately and explain recursive boundaries.", difficulty: "mostly-medium" },
    { phaseId: "advanced", phaseTitle: "Advanced + Weak Areas", phaseDescription: "Add only the advanced topics with strong interview value, then revisit recurring mistakes.", title: "Graphs, DP & weak areas", bucket: "graphs", focus: "Model state cleanly and spend review time on repeated failure modes.", difficulty: "mostly-medium" },
    { phaseId: "simulation", phaseTitle: "Interview Simulation", phaseDescription: "Finish with company-filtered mixed practice and full interview behavior.", title: "Timed company practice & mocks", bucket: "simulation", focus: "Run complete interview-style sessions: clarify, solve, test, and reflect.", difficulty: "medium-hard" },
  ],
  60: [
    { phaseId: "foundation", phaseTitle: "Foundation", phaseDescription: "Rebuild implementation fluency and recognition speed.", title: "Arrays, hashing & pointers", bucket: "foundation-a", focus: "Identify the invariant before reaching for code.", difficulty: "easy-medium" },
    { phaseId: "foundation", phaseTitle: "Foundation", phaseDescription: "Rebuild implementation fluency and recognition speed.", title: "Search, stacks & linked lists", bucket: "foundation-b", focus: "Practice boundary handling and pointer updates without guesswork.", difficulty: "easy-medium" },
    { phaseId: "core", phaseTitle: "Core Patterns", phaseDescription: "Build breadth across traversal and recursive interview patterns.", title: "Trees & recursive reasoning", bucket: "trees", focus: "Choose DFS or BFS from the shape of the required output.", difficulty: "mostly-medium" },
    { phaseId: "core", phaseTitle: "Core Patterns", phaseDescription: "Build breadth across traversal and recursive interview patterns.", title: "Graphs & state modeling", bucket: "graphs", focus: "Define vertices, edges, visited state, and termination explicitly.", difficulty: "mostly-medium" },
    { phaseId: "advanced", phaseTitle: "Advanced Patterns", phaseDescription: "Cover high-value optimization patterns without drifting into contest preparation.", title: "Heaps, intervals & greedy", bucket: "structures", focus: "Explain why ordering or a local choice is sufficient.", difficulty: "mostly-medium" },
    { phaseId: "advanced", phaseTitle: "Advanced Patterns", phaseDescription: "Cover high-value optimization patterns without drifting into contest preparation.", title: "Dynamic programming & backtracking", bucket: "advanced", focus: "State the subproblem and transition before writing a table.", difficulty: "medium-hard" },
    { phaseId: "company", phaseTitle: "Targeted Practice", phaseDescription: "Use topic and company filters to create realistic mixed sets.", title: "Company practice & mistake review", bucket: "company", focus: "Re-solve recurring mistakes before adding more new questions.", difficulty: "medium-hard" },
    { phaseId: "simulation", phaseTitle: "Interview Simulation", phaseDescription: "Practice the full interview conversation under time pressure.", title: "Mocks, recovery & final review", bucket: "simulation", focus: "Communicate, test, recover, and finish with a focused review.", difficulty: "medium-hard" },
  ],
  90: [
    { phaseId: "foundation", phaseTitle: "Foundation", phaseDescription: "Restore fundamentals and coding fluency before increasing difficulty.", title: "Arrays & lookup state", bucket: "foundation-a", focus: "Write simple, correct baselines and identify repeated lookup work.", difficulty: "easy-medium" },
    { phaseId: "foundation", phaseTitle: "Foundation", phaseDescription: "Restore fundamentals and coding fluency before increasing difficulty.", title: "Pointers, windows & search", bucket: "foundation-b", focus: "Use boundaries and invariants instead of memorized templates.", difficulty: "easy-medium" },
    { phaseId: "core", phaseTitle: "Core Patterns", phaseDescription: "Develop dependable traversal and recursive problem solving.", title: "Trees & recursion", bucket: "trees", focus: "Connect traversal order to the information the problem needs.", difficulty: "mostly-medium" },
    { phaseId: "core", phaseTitle: "Core Patterns", phaseDescription: "Develop dependable traversal and recursive problem solving.", title: "Graphs & connectivity", bucket: "graphs", focus: "Model graph state and prove termination before optimizing.", difficulty: "mostly-medium" },
    { phaseId: "core", phaseTitle: "Core Patterns", phaseDescription: "Develop dependable traversal and recursive problem solving.", title: "Heaps, intervals & ordering", bucket: "structures", focus: "Recognize when ordering converts a global problem into local decisions.", difficulty: "mostly-medium" },
    { phaseId: "advanced", phaseTitle: "Advanced Patterns", phaseDescription: "Add selected advanced patterns and focus on derivation.", title: "Dynamic programming", bucket: "advanced", focus: "Derive state, transition, base case, and evaluation order aloud.", difficulty: "medium-hard" },
    { phaseId: "advanced", phaseTitle: "Advanced Patterns", phaseDescription: "Add selected advanced patterns and focus on derivation.", title: "Backtracking & optimization", bucket: "trees", focus: "Explain pruning and distinguish search from repeated subproblems.", difficulty: "medium-hard" },
    { phaseId: "repetition", phaseTitle: "Spaced Repetition", phaseDescription: "Mix patterns, revisit mistakes, and reduce category cues.", title: "Mixed set I", bucket: "mixed", focus: "Solve without category labels, then log the clue you missed.", difficulty: "mostly-medium" },
    { phaseId: "repetition", phaseTitle: "Spaced Repetition", phaseDescription: "Mix patterns, revisit mistakes, and reduce category cues.", title: "Mixed set II & weak areas", bucket: "mixed", focus: "Re-solve failures from memory after a spaced interval.", difficulty: "medium-hard" },
    { phaseId: "company", phaseTitle: "Targeted Practice", phaseDescription: "Build realistic sets from verified filters without inventing frequency claims.", title: "Company-filtered practice", bucket: "company", focus: "Use the question browser to combine target context with weak topics.", difficulty: "medium-hard" },
    { phaseId: "simulation", phaseTitle: "Interview Simulation", phaseDescription: "Practice full interviews, feedback, and recovery.", title: "Timed interview simulations", bucket: "simulation", focus: "Run 45-minute sessions with clarification, narration, and verbal tests.", difficulty: "medium-hard" },
    { phaseId: "simulation", phaseTitle: "Interview Simulation", phaseDescription: "Practice full interviews, feedback, and recovery.", title: "Final revision & interview mode", bucket: "simulation", focus: "Reduce scope, review repeat mistakes, and prioritize clean execution.", difficulty: "medium-hard" },
  ],
};

const dailyGuidance: Record<StudyPlanDuration, string[]> = {
  30: ["Review the pattern and solve a focused set.", "Add a second pattern and compare recognition clues.", "Complete a mixed, time-boxed set.", "Review mistakes and re-code one failed solution.", "Solve a medium without category hints.", "Run a timed interview-style session.", "Re-solve misses and plan the next week."],
  60: ["Review the pattern and solve focused problems.", "Practice the first topic with increasing difficulty.", "Practice the second topic and compare approaches.", "Complete an untimed mixed set.", "Complete a timed mixed set.", "Review mistakes and re-code one failure.", "Run an interview-style session and reflect."],
  90: ["Learn or refresh the week’s first pattern.", "Solve a focused set and write recognition clues.", "Add the next pattern and compare trade-offs.", "Complete mixed practice without category labels.", "Revisit a problem from an earlier week.", "Run a timed set while explaining aloud.", "Review the mistake log and re-solve one miss."],
};

function priorityFor(topicId: string, role: RoleConfiguration): StudyPlanPriority {
  if (role.mustKnow.includes(topicId)) return "must-know";
  if (role.optional.includes(topicId)) return "optional";
  return "important";
}

function buildPlan(level: StudyPlanLevel, duration: StudyPlanDuration): StudyPlan {
  const role = roleConfigurations[level];
  const weeks = scheduleTemplates[duration].map((template, index): StudyPlanWeek => {
    let topicIds = role.topics[template.bucket];
    if (duration === 30 && index === 0) topicIds = [...role.topics["foundation-a"], ...role.topics["foundation-b"]];
    if (duration === 30 && index === 1) topicIds = [...role.topics.trees, ...role.topics.structures.slice(0, 1)];
    if (duration === 30 && index === 2) topicIds = [...role.topics.graphs, ...role.topics.advanced.slice(0, level === "sde1" ? 1 : 2)];
    return {
      week: index + 1,
      phaseId: template.phaseId,
      title: template.title,
      focus: template.focus,
      topics: [...new Set(topicIds)].map((topicId) => ({ topicId, priority: priorityFor(topicId, role) })),
      difficulty: level === "sde1" && template.difficulty === "medium-hard" ? "mostly-medium" : template.difficulty,
      interviewFocus: [role.interviewFocus[index % role.interviewFocus.length], role.interviewFocus[(index + 1) % role.interviewFocus.length]],
      checkpoint: role.checkpoints[index % role.checkpoints.length],
      days: dailyGuidance[duration].map((guidance, day) => ({ day: day + 1, guidance })),
    };
  });
  const phases: StudyPlanPhase[] = [];
  for (const template of scheduleTemplates[duration]) {
    if (phases.some((phase) => phase.id === template.phaseId)) continue;
    const matchingWeeks = weeks.filter((week) => week.phaseId === template.phaseId);
    phases.push({ id: template.phaseId, title: template.phaseTitle, description: template.phaseDescription, firstWeek: matchingWeeks[0].week, lastWeek: matchingWeeks.at(-1)!.week });
  }
  return {
    level,
    levelLabel: role.label,
    duration,
    title: `${role.label} • ${duration}-Day Plan`,
    objective: role.objective,
    goal: role.goal,
    weeks,
    phases,
    deprioritized: role.deprioritized[duration],
  };
}

export const dsaStudyPlans: StudyPlan[] = (["sde1", "sde2", "senior"] as const).flatMap((level) => ([30, 60, 90] as const).map((duration) => buildPlan(level, duration)));

export function getDsaStudyPlan(level: string | null, duration: string | number | null) {
  const days = Number(duration);
  return dsaStudyPlans.find((plan) => plan.level === level && plan.duration === days);
}

export function getStudyPlanTopic(topicId: string) {
  return getCoreRoadmapTopic(topicId);
}

export function getStudyPlanPracticeHref(topicId: string, difficulty: StudyPlanDifficulty) {
  const topic = getCoreRoadmapTopic(topicId);
  if (!topic) return undefined;
  const href = getRoadmapPracticeHref(topic);
  if (!href) return undefined;
  if (difficulty === "easy-medium") return href;
  return `${href}&difficulty=medium`;
}

export function assertStudyPlanIntegrity(plans: StudyPlan[] = dsaStudyPlans) {
  if (plans.length !== 9) throw new Error(`Expected 9 DSA study plans, received ${plans.length}.`);
  const canonicalIds = new Set(coreInterviewRoadmap.topics.map((topic) => topic.id));
  const keys = new Set<string>();
  for (const plan of plans) {
    const key = `${plan.level}:${plan.duration}`;
    if (keys.has(key)) throw new Error(`Duplicate DSA study plan: ${key}`);
    keys.add(key);
    const expectedWeeks = plan.duration === 30 ? 4 : plan.duration === 60 ? 8 : 12;
    if (plan.weeks.length !== expectedWeeks) throw new Error(`${key} has ${plan.weeks.length} weeks; expected ${expectedWeeks}.`);
    if (plan.weeks.at(-1)?.phaseId !== "simulation") throw new Error(`${key} does not end in interview simulation.`);
    for (const week of plan.weeks) for (const topic of week.topics) if (!canonicalIds.has(topic.topicId)) throw new Error(`${key} references unknown roadmap topic ${topic.topicId}.`);
  }
  return true;
}

assertStudyPlanIntegrity();
