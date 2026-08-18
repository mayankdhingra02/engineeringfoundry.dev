import {
  getPersonalizedTopicRecommendations,
  getPracticeProblemRecommendations,
  systemDesignLevelOptions,
  systemDesignRoleOptions,
  systemDesignTopics,
  type SystemDesignLevel,
  type SystemDesignPreparationWindow,
  type SystemDesignRecommendationGroup,
  type SystemDesignPracticeRecommendation,
  type SystemDesignTargetRole,
  type SystemDesignTopic,
  type SystemDesignTopicRecommendation,
} from "./recommendations.ts";

export type SystemDesignStudyMinutesPerDay = 30 | 60 | 120 | 180;
export type SystemDesignStudyItemStatus = "not-started" | "in-progress" | "completed";
export type SystemDesignStudyItemType = "topic" | "practice" | "review" | "simulation";
export type SystemDesignStudyPhase = "Learn" | "Apply" | "Review";

export interface SystemDesignStudyPlanInput {
  level: SystemDesignLevel;
  role?: SystemDesignTargetRole;
  preparationWindow: SystemDesignPreparationWindow;
  minutesPerDay: SystemDesignStudyMinutesPerDay;
  progress?: Readonly<Record<string, SystemDesignStudyItemStatus>>;
  missedDays?: readonly number[];
}

export interface SystemDesignStudyPlanItem {
  id: string;
  type: SystemDesignStudyItemType;
  phase: SystemDesignStudyPhase;
  title: string;
  href?: string;
  estimatedMinutes: number;
  status: SystemDesignStudyItemStatus;
  reason: string;
  topicId?: string;
  problemId?: string;
  prerequisiteIds?: readonly string[];
  concepts?: readonly string[];
  recommendationGroup?: SystemDesignRecommendationGroup;
}

export interface SystemDesignStudyPlanDay {
  day: number;
  title: string;
  items: SystemDesignStudyPlanItem[];
  totalMinutes: number;
  missed: boolean;
}

export interface SystemDesignStudyPlan {
  title: string;
  days: SystemDesignStudyPlanDay[];
  dayCount: number;
  minutesPerDay: SystemDesignStudyMinutesPerDay;
  totalItems: number;
  completedItems: number;
  percentComplete: number;
  remainingMinutes: number;
  currentDay: number;
  nextItem?: SystemDesignStudyPlanItem & { day: number };
  checklist: readonly string[];
}

export const systemDesignStudyTimeOptions: ReadonlyArray<{ value: SystemDesignStudyMinutesPerDay; label: string }> = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hr" },
  { value: 120, label: "2 hrs" },
  { value: 180, label: "3 hrs+" },
];

export const systemDesignInterviewChecklist = [
  "Clarify functional and non-functional requirements",
  "Clarify scale and estimate traffic or storage when useful",
  "Define APIs and identify core entities",
  "Draw the high-level architecture",
  "Identify bottlenecks and discuss database choices",
  "Discuss caching, scaling, reliability, and failure modes",
  "Explain trade-offs and follow the interviewer's deep dive",
] as const;

const windowDays: Record<SystemDesignPreparationWindow, number> = {
  "3-days": 3,
  "1-week": 7,
  "2-weeks": 14,
  "1-month": 30,
  "2-plus-months": 30,
};

const desiredPracticeCounts: Record<number, number> = { 3: 1, 7: 5, 14: 8, 30: 12 };
const desiredReviewCounts: Record<number, number> = { 3: 0, 7: 1, 14: 2, 30: 5 };
const rolePlanAnchors: Readonly<Record<SystemDesignTargetRole, readonly string[]>> = {
  backend: ["kafka"],
  fullstack: ["realtime-communication"],
  infrastructure: ["distributed-consensus", "raft"],
  data: ["kafka", "flink"],
  ml: ["model-serving", "vector-search", "batch-vs-streaming"],
};
const groupOrder: Record<SystemDesignRecommendationGroup, number> = { "focus-now": 0, "learn-next": 1, "skip-for-now": 2 };
const difficultyOrder = { foundation: 0, intermediate: 1, advanced: 2, specialized: 3 } as const;
const topicById = new Map(systemDesignTopics.map((topic) => [topic.id, topic]));
const topicCatalogOrder = new Map(systemDesignTopics.map((topic, index) => [topic.id, index]));

function learningStage(topic: SystemDesignTopic) {
  if (topic.category === "System Design Interview Foundations") return 0;
  if (["Networking & APIs", "Data & Storage", "Caching"].includes(topic.category)) return 1;
  if (topic.category === "Messaging, Queues & Streaming") return 2;
  if (["Reliability & Distributed Systems", "Common Architecture Patterns"].includes(topic.category)) return 3;
  if (["Observability & Security", "Specialized Building Blocks", "Technology Deep Dives"].includes(topic.category)) return 4;
  return 3;
}

function simulationMinutes(minutesPerDay: number) {
  return Math.min(minutesPerDay < 120 ? 30 : 45, minutesPerDay);
}

function statusFor(id: string, progress?: SystemDesignStudyPlanInput["progress"]): SystemDesignStudyItemStatus {
  return progress?.[id] ?? "not-started";
}

function allowedRecommendation(group: SystemDesignRecommendationGroup, days: number) {
  if (days === 3) return group === "focus-now";
  if (days === 7 || days === 14) return group !== "skip-for-now";
  return true;
}

function prerequisiteBundle(topic: SystemDesignTopic, selected: ReadonlySet<string>, visiting = new Set<string>()): SystemDesignTopic[] {
  if (!topic.published || selected.has(topic.id) || visiting.has(topic.id)) return [];
  visiting.add(topic.id);
  const dependencies = (topic.prerequisites ?? []).flatMap((id) => {
    const dependency = topicById.get(id);
    return dependency?.published ? prerequisiteBundle(dependency, selected, visiting) : [];
  });
  visiting.delete(topic.id);
  return [...dependencies, topic].filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index && !selected.has(item.id));
}

function selectTopics(recommendations: readonly SystemDesignTopicRecommendation[], days: number, theoryBudget: number, minutesPerDay: number, role?: SystemDesignTargetRole) {
  const selected = new Set<string>();
  const prerequisiteFor = new Map<string, string>();
  let minutes = 0;

  function tryAddTopic(topic: SystemDesignTopic) {
    const bundle = prerequisiteBundle(topic, selected).filter((item) => item.estimatedMinutes <= minutesPerDay);
    const bundleMinutes = bundle.reduce((total, item) => total + item.estimatedMinutes, 0);
    if (minutes + bundleMinutes > theoryBudget) return;
    for (const item of bundle) {
      selected.add(item.id);
      minutes += item.estimatedMinutes;
      if (item.id !== topic.id && !prerequisiteFor.has(item.id)) prerequisiteFor.set(item.id, topic.title);
    }
  }

  if (role && days >= 7) {
    const anchorCount = days === 7 ? 1 : rolePlanAnchors[role].length;
    for (const id of rolePlanAnchors[role].slice(0, anchorCount)) {
      const anchor = topicById.get(id);
      if (anchor) tryAddTopic(anchor);
    }
  }

  const planningOrder = [...recommendations].sort((left, right) => {
    const defaultPriorityOrder = { "must-know": 0, important: 1, advanced: 2 } as const;
    return (days === 3 ? groupOrder[left.group] - groupOrder[right.group] : defaultPriorityOrder[left.priority] - defaultPriorityOrder[right.priority])
      || (days === 3 ? defaultPriorityOrder[left.topic.defaultPriority] - defaultPriorityOrder[right.topic.defaultPriority] : groupOrder[left.group] - groupOrder[right.group])
      || left.rank - right.rank;
  });

  for (const recommendation of planningOrder) {
    if (!allowedRecommendation(recommendation.group, days) || recommendation.topic.estimatedMinutes > minutesPerDay) continue;
    tryAddTopic(recommendation.topic);
  }
  return { selected, prerequisiteFor, minutes };
}

function topologicalTopics(selected: ReadonlySet<string>, recommendations: readonly SystemDesignTopicRecommendation[], role?: SystemDesignTargetRole) {
  const recommendationById = new Map(recommendations.map((item) => [item.topic.id, item]));
  const priorityOrder = { "must-know": 0, important: 1, advanced: 2 } as const;
  const anchorOrder = new Map((role ? rolePlanAnchors[role] : []).map((id, index) => [id, index]));
  const ordered: SystemDesignTopic[] = [];
  const visited = new Set<string>();

  function visit(topic: SystemDesignTopic, visiting = new Set<string>()) {
    if (visited.has(topic.id) || visiting.has(topic.id)) return;
    visiting.add(topic.id);
    for (const id of topic.prerequisites ?? []) {
      const dependency = topicById.get(id);
      if (dependency && selected.has(id)) visit(dependency, visiting);
    }
    visiting.delete(topic.id);
    visited.add(topic.id);
    ordered.push(topic);
  }

  const candidates = [...selected].map((id) => topicById.get(id)!).sort((left, right) => {
    const leftAnchor = anchorOrder.get(left.id);
    const rightAnchor = anchorOrder.get(right.id);
    if (leftAnchor !== undefined || rightAnchor !== undefined) return (leftAnchor ?? Number.POSITIVE_INFINITY) - (rightAnchor ?? Number.POSITIVE_INFINITY);
    const leftRecommendation = recommendationById.get(left.id);
    const rightRecommendation = recommendationById.get(right.id);
    const groupDifference = groupOrder[leftRecommendation?.group ?? "skip-for-now"] - groupOrder[rightRecommendation?.group ?? "skip-for-now"];
    const priorityDifference = priorityOrder[leftRecommendation?.priority ?? left.defaultPriority] - priorityOrder[rightRecommendation?.priority ?? right.defaultPriority];
    return groupDifference
      || (leftRecommendation?.rank ?? 999) - (rightRecommendation?.rank ?? 999)
      || priorityDifference
      || learningStage(left) - learningStage(right)
      || (topicCatalogOrder.get(left.id) ?? 0) - (topicCatalogOrder.get(right.id) ?? 0);
  });
  for (const topic of candidates) visit(topic);
  return ordered;
}

function topicReason(topic: SystemDesignTopic, recommendation: SystemDesignTopicRecommendation | undefined, input: SystemDesignStudyPlanInput, prerequisiteFor?: string) {
  if (prerequisiteFor) return `Prerequisite for ${prerequisiteFor}`;
  if (input.role && topic.rolePriority?.[input.role]) {
    const roleLabel = systemDesignRoleOptions.find((option) => option.value === input.role)?.label ?? input.role;
    return `Recommended for ${roleLabel}`;
  }
  if (recommendation?.group === "focus-now") {
    const levelLabel = systemDesignLevelOptions.find((option) => option.value === input.level)?.label ?? input.level;
    return `Common ${levelLabel} topic`;
  }
  return recommendation?.group === "learn-next" ? "Builds useful interview depth" : "Selected advanced depth";
}

function createTaskSequence(
  topics: readonly SystemDesignTopic[],
  practices: readonly SystemDesignPracticeRecommendation[],
  recommendations: readonly SystemDesignTopicRecommendation[],
  prerequisiteFor: ReadonlyMap<string, string>,
  input: SystemDesignStudyPlanInput,
  includeSimulation: boolean,
) {
  const recommendationById = new Map(recommendations.map((item) => [item.topic.id, item]));
  const learned = new Set<string>();
  const remainingPractices = [...practices];
  const items: SystemDesignStudyPlanItem[] = [];
  let lessonsSincePractice = 0;

  function addEligiblePractice(force = false) {
    if (!force && lessonsSincePractice < 3) return;
    const index = remainingPractices.findIndex(({ problem }) => problem.concepts.every((id) => learned.has(id)));
    if (index < 0) return;
    const [{ problem, group }] = remainingPractices.splice(index, 1);
    const conceptTitles = problem.concepts.slice(0, 2).map((id) => topicById.get(id)?.title ?? id);
    const id = `practice:${problem.id}`;
    items.push({
      id,
      type: "practice",
      phase: "Apply",
      title: `Design ${problem.title}`,
      href: problem.href,
      estimatedMinutes: problem.estimatedMinutes,
      status: statusFor(id, input.progress),
      reason: `Practice for ${conceptTitles.join(" + ")}`,
      problemId: problem.id,
      concepts: problem.concepts,
      recommendationGroup: group,
    });
    lessonsSincePractice = 0;
  }

  for (const topic of topics) {
    const recommendation = recommendationById.get(topic.id);
    const id = `topic:${topic.id}`;
    items.push({
      id,
      type: "topic",
      phase: "Learn",
      title: topic.title,
      href: topic.href,
      estimatedMinutes: topic.estimatedMinutes,
      status: statusFor(id, input.progress),
      reason: topicReason(topic, recommendation, input, prerequisiteFor.get(topic.id)),
      topicId: topic.id,
      prerequisiteIds: topic.prerequisites,
      recommendationGroup: recommendation?.group,
    });
    learned.add(topic.id);
    lessonsSincePractice += 1;
    addEligiblePractice();
  }
  while (remainingPractices.length) {
    const before = remainingPractices.length;
    addEligiblePractice(true);
    if (remainingPractices.length === before) break;
  }
  if (includeSimulation) {
    const id = "simulation:final";
    items.push({ id, type: "simulation", phase: "Apply", title: "Timed System Design simulation", estimatedMinutes: simulationMinutes(input.minutesPerDay), status: statusFor(id, input.progress), reason: "Practice the full interview flow" });
  }
  return items;
}

function distributeItems(items: readonly SystemDesignStudyPlanItem[], dayCount: number, minutesPerDay: number) {
  const days = Array.from({ length: dayCount }, (_, index) => ({ day: index + 1, title: "Focused preparation", items: [] as SystemDesignStudyPlanItem[], totalMinutes: 0, missed: false }));
  const simulation = items.find((item) => item.type === "simulation");
  const schedulableItems = items.filter((item) => item.type !== "simulation");
  const sourceOrder = new Map(items.map((item, index) => [item.id, index]));
  const topicDay = new Map<string, number>();
  if (simulation) {
    days[days.length - 1].items.push(simulation);
    days[days.length - 1].totalMinutes = simulation.estimatedMinutes;
  }
  const totalMinutes = items.reduce((total, item) => total + item.estimatedMinutes, 0);
  const target = Math.min(minutesPerDay, Math.ceil(totalMinutes / dayCount));

  for (const item of schedulableItems) {
    const dependencyIds = item.type === "practice" ? item.concepts ?? [] : item.prerequisiteIds ?? [];
    const dependencyDay = dependencyIds.reduce((latest, id) => Math.max(latest, topicDay.get(id) ?? 0), 0);
    // Source order is already topological. Artificially reserving later days
    // by curriculum section can strand a prerequisite even when the total
    // plan fits the user's budget, so daily placement only enforces actual
    // dependency order.
    const minimumDay = dependencyDay;
    const candidates = days.map((day, index) => ({ day, index })).filter(({ index, day }) => index >= minimumDay && day.totalMinutes + item.estimatedMinutes <= minutesPerDay);
    const targetCandidate = candidates.find(({ day }) => day.totalMinutes + item.estimatedMinutes <= target);
    // Learning stages are a soft sequencing preference. If later days are full,
    // use any dependency-safe slot instead of silently dropping a selected topic.
    const dependencySafeFallback = days.map((day, index) => ({ day, index })).find(({ index, day }) => index >= dependencyDay && day.totalMinutes + item.estimatedMinutes <= minutesPerDay);
    const destination = targetCandidate ?? candidates[0] ?? dependencySafeFallback;
    if (!destination) continue;
    destination.day.items.push(item);
    destination.day.totalMinutes += item.estimatedMinutes;
    if (item.topicId && item.type === "topic") topicDay.set(item.topicId, destination.index);
  }
  for (const day of days) day.items.sort((left, right) => (sourceOrder.get(left.id) ?? 0) - (sourceOrder.get(right.id) ?? 0));
  return days;
}

function addReviews(days: SystemDesignStudyPlanDay[], reviewCount: number, input: SystemDesignStudyPlanInput) {
  const topicLocations = days.flatMap((day) => day.items.filter((item) => item.type === "topic").map((item) => ({ day: day.day, item })));
  let added = 0;
  for (const source of topicLocations) {
    if (added >= reviewCount) break;
    const targetStart = Math.min(days.length - 1, source.day - 1 + Math.max(3, Math.floor(days.length / 4)));
    const targetIndex = days.findIndex((day, index) => index >= targetStart && day.totalMinutes + 10 <= input.minutesPerDay);
    if (targetIndex < 0 || targetIndex <= source.day - 1) continue;
    const id = `review:${source.item.topicId}`;
    days[targetIndex].items.unshift({ id, type: "review", phase: "Review", title: `Quick review: ${source.item.title}`, estimatedMinutes: 10, status: statusFor(id, input.progress), reason: "Short spaced review", topicId: source.item.topicId });
    days[targetIndex].totalMinutes += 10;
    added += 1;
  }
}

function fillEmptyDaysWithReviews(days: SystemDesignStudyPlanDay[], input: SystemDesignStudyPlanInput) {
  const topics = days.flatMap((day) => day.items.filter((item) => item.type === "topic"));
  for (const day of days) {
    if (day.items.length || topics.length === 0) continue;
    const source = topics[(day.day - 1) % topics.length];
    const id = `review:${source.topicId}:day-${day.day}`;
    day.items.push({ id, type: "review", phase: "Review", title: `Quick review: ${source.title}`, estimatedMinutes: 10, status: statusFor(id, input.progress), reason: "Keep a core concept fresh", topicId: source.topicId });
    day.totalMinutes = 10;
  }
}

function redistributeMissedDays(days: SystemDesignStudyPlanDay[], missedDays: readonly number[], minutesPerDay: number) {
  for (const missedDay of [...new Set(missedDays)].sort((a, b) => a - b)) {
    const sourceIndex = missedDay - 1;
    if (!days[sourceIndex] || sourceIndex >= days.length - 1) continue;
    days[sourceIndex].missed = true;
    const completed = days[sourceIndex].items.filter((item) => item.status === "completed");
    const movable = days[sourceIndex].items.filter((item) => item.status !== "completed");
    const retained: SystemDesignStudyPlanItem[] = [];
    const additions = new Map<number, SystemDesignStudyPlanItem[]>();
    for (const item of movable) {
      const targetIndex = days.findIndex((day, index) => index > sourceIndex && day.totalMinutes + item.estimatedMinutes <= minutesPerDay);
      if (targetIndex < 0) {
        retained.push(item);
        continue;
      }
      additions.set(targetIndex, [...(additions.get(targetIndex) ?? []), item]);
      days[targetIndex].totalMinutes += item.estimatedMinutes;
    }
    days[sourceIndex].items = [...completed, ...retained];
    days[sourceIndex].totalMinutes = days[sourceIndex].items.reduce((total, item) => total + item.estimatedMinutes, 0);
    for (const [targetIndex, items] of additions) days[targetIndex].items.unshift(...items);
  }
}

function dayTitle(day: SystemDesignStudyPlanDay) {
  if (day.items.some((item) => item.type === "simulation")) return "Interview simulation";
  if (day.items.length > 0 && day.items.every((item) => item.type === "review")) return "Review & reinforce";
  const categories = day.items.flatMap((item) => item.topicId ? [topicById.get(item.topicId)?.category] : []).filter(Boolean) as string[];
  const category = categories.sort((left, right) => categories.filter((item) => item === right).length - categories.filter((item) => item === left).length)[0];
  const titles: Record<string, string> = {
    "System Design Interview Foundations": "Interview foundations",
    "Data & Storage": "Data layer",
    Caching: "Scaling reads",
    "Messaging, Queues & Streaming": "Messaging & events",
    "Networking & APIs": "Traffic & API design",
    "Reliability & Distributed Systems": "Reliability & distributed systems",
    "Observability & Security": "Production readiness",
    "Common Architecture Patterns": "Architecture patterns",
    "Specialized Building Blocks": "Specialized systems",
    "Technology Deep Dives": "Technology choices",
  };
  return titles[category] ?? (day.items.some((item) => item.type === "practice") ? "Learn & apply" : "Core concepts");
}

export function generateSystemDesignStudyPlan(input: SystemDesignStudyPlanInput): SystemDesignStudyPlan {
  const dayCount = windowDays[input.preparationWindow];
  const recommendations = getPersonalizedTopicRecommendations(input)!;
  const practiceRecommendations = getPracticeProblemRecommendations(input)!;
  const totalBudget = dayCount * input.minutesPerDay;
  const practiceCount = Math.min(desiredPracticeCounts[dayCount], Math.max(1, Math.floor(totalBudget / 90)));
  const reviewCount = Math.min(desiredReviewCounts[dayCount], Math.floor(totalBudget / 240));
  const includeSimulation = totalBudget >= 150;
  // Practice estimates vary from 25–50 minutes. Reserving 32 minutes here keeps
  // enough room for role-critical concepts; the exact practice durations are
  // enforced again below before tasks are scheduled into daily budgets.
  const reservedMinutes = practiceCount * 32 + reviewCount * 10 + (includeSimulation ? simulationMinutes(input.minutesPerDay) : 0);
  const theoryBudget = Math.max(input.minutesPerDay, totalBudget - reservedMinutes);
  const selectedTopics = selectTopics(recommendations, dayCount, theoryBudget, input.minutesPerDay, input.role);
  const orderedTopics = topologicalTopics(selectedTopics.selected, recommendations, input.role);
  const remainingBudget = totalBudget - selectedTopics.minutes - reviewCount * 10 - (includeSimulation ? simulationMinutes(input.minutesPerDay) : 0);
  const selectedPractices = practiceRecommendations
    .filter(({ problem }) => problem.estimatedMinutes <= input.minutesPerDay && problem.concepts.every((id) => selectedTopics.selected.has(id)))
    .sort((left, right) => difficultyOrder[left.problem.difficulty] - difficultyOrder[right.problem.difficulty] || left.rank - right.rank)
    .reduce<typeof practiceRecommendations>((selected, recommendation) => {
      const minutes = selected.reduce((total, item) => total + item.problem.estimatedMinutes, 0);
      return selected.length < practiceCount && minutes + recommendation.problem.estimatedMinutes <= remainingBudget ? [...selected, recommendation] : selected;
    }, []);
  const tasks = createTaskSequence(orderedTopics, selectedPractices, recommendations, selectedTopics.prerequisiteFor, input, includeSimulation);
  const days = distributeItems(tasks, dayCount, input.minutesPerDay);
  addReviews(days, reviewCount, input);
  fillEmptyDaysWithReviews(days, input);
  redistributeMissedDays(days, input.missedDays ?? [], input.minutesPerDay);
  for (const day of days) day.title = dayTitle(day);

  const allItems = days.flatMap((day) => day.items);
  const completedItems = allItems.filter((item) => item.status === "completed").length;
  const nextLocation = days.flatMap((day) => day.items.map((item) => ({ day: day.day, item }))).find(({ item }) => item.status !== "completed");
  const currentDay = nextLocation?.day ?? dayCount;
  return {
    title: `${dayCount}-Day System Design Plan`,
    days,
    dayCount,
    minutesPerDay: input.minutesPerDay,
    totalItems: allItems.length,
    completedItems,
    percentComplete: allItems.length ? Math.round((completedItems / allItems.length) * 100) : 0,
    remainingMinutes: allItems.filter((item) => item.status !== "completed").reduce((total, item) => total + item.estimatedMinutes, 0),
    currentDay,
    nextItem: nextLocation ? { ...nextLocation.item, day: nextLocation.day } : undefined,
    checklist: systemDesignInterviewChecklist,
  };
}

export function getSystemDesignStudyPlanDays(preparationWindow: SystemDesignPreparationWindow) {
  return windowDays[preparationWindow];
}
