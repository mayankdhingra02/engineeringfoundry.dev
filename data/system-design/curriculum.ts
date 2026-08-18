import {
  systemDesignManifestSections,
  systemDesignPracticeProblemManifest,
  type SystemDesignContentStatus as ManifestContentStatus,
  type SystemDesignPracticeProblemManifest,
  type SystemDesignSectionManifest,
  type SystemDesignTopicManifest,
} from "./manifest.ts";

export type SystemDesignDifficulty = "Foundation" | "Intermediate" | "Advanced" | "Specialized";
export type SystemDesignContentStatus = "published" | "coming-soon";
export type SystemDesignCurriculumNodeType = "major-category" | "section" | "lesson";

export interface SystemDesignCurriculumNode {
  id: string;
  title: string;
  navigationTitle?: string;
  slug?: string;
  description?: string;
  type: SystemDesignCurriculumNodeType;
  category: string;
  difficulty?: SystemDesignDifficulty;
  estimatedReadTime?: number;
  keywords?: string[];
  concepts?: string[];
  status?: SystemDesignContentStatus;
  researchStatus?: ManifestContentStatus;
  lastReviewed?: string;
  pager?: { previousSlug: string; nextSlug: string };
  children?: SystemDesignCurriculumNode[];
}

export interface SystemDesignLessonProgress {
  completedLessonSlugs: readonly string[];
  bookmarkedLessonSlugs: readonly string[];
  recentlyViewedLessonSlug?: string;
}

const difficultyByPriority = {
  "must-know": "Foundation",
  important: "Intermediate",
  advanced: "Advanced",
} as const;

function topicLesson(item: SystemDesignTopicManifest): SystemDesignCurriculumNode {
  return {
    id: item.id,
    title: item.title,
    navigationTitle: item.navigationTitle,
    slug: item.slug,
    description: item.description,
    type: "lesson",
    category: item.section,
    difficulty: difficultyByPriority[item.priority],
    estimatedReadTime: item.estimatedMinutes,
    keywords: [item.title, item.section, ...item.subtopics.map((subtopic) => subtopic.title), "system design", "software engineering interview"],
    concepts: [item.id, ...item.subtopics.map((subtopic) => subtopic.id)],
    status: item.published ? "published" : "coming-soon",
    researchStatus: item.contentStatus,
    lastReviewed: item.lastReviewed,
  };
}

function manifestSection(section: SystemDesignSectionManifest): SystemDesignCurriculumNode {
  return {
    id: section.id,
    title: section.title,
    description: section.description,
    type: "major-category",
    category: section.title,
    children: section.topics.map(topicLesson),
  };
}

const practiceDifficulty: Record<SystemDesignPracticeProblemManifest["difficulty"], SystemDesignDifficulty> = {
  foundation: "Foundation",
  intermediate: "Intermediate",
  advanced: "Advanced",
  specialized: "Specialized",
};

function practiceLesson(item: SystemDesignPracticeProblemManifest): SystemDesignCurriculumNode {
  return {
    id: `problem-${item.id}`,
    title: item.title,
    slug: item.slug,
    description: `Practice scoping, estimating, diagramming, and defending ${item.title} in a System Design interview.`,
    type: "lesson",
    category: `System Design Problems · ${item.group}`,
    difficulty: practiceDifficulty[item.difficulty],
    estimatedReadTime: item.estimatedMinutes,
    keywords: [item.title, item.group, ...item.concepts, "system design practice"],
    concepts: [...item.concepts],
    status: item.contentStatus === "published" ? "published" : "coming-soon",
    researchStatus: item.contentStatus,
    lastReviewed: item.lastReviewed,
  };
}

const practiceGroups = [...new Set(systemDesignPracticeProblemManifest.map((item) => item.group))];
const problems: SystemDesignCurriculumNode = {
  id: "practice-problems",
  title: "System Design Problems",
  description: "Practice turning ambiguous prompts into scoped, defensible architectures.",
  type: "major-category",
  category: "System Design Problems",
  children: practiceGroups.map((group) => ({
    id: `practice-${group.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: group,
    type: "section",
    category: "System Design Problems",
    children: systemDesignPracticeProblemManifest.filter((item) => item.group === group).map(practiceLesson),
  })),
};

export const systemDesignCurriculum: SystemDesignCurriculumNode[] = [
  ...systemDesignManifestSections.map(manifestSection),
  problems,
];

function flattenLessons(nodes: readonly SystemDesignCurriculumNode[]): SystemDesignCurriculumNode[] {
  return nodes.flatMap((node) => node.type === "lesson" ? [node] : flattenLessons(node.children ?? []));
}

export const systemDesignLessons = flattenLessons(systemDesignCurriculum);
export const systemDesignProblemLessons = flattenLessons([problems]);

export function getSystemDesignLesson(slug: string) {
  return systemDesignLessons.find((item) => item.slug === slug);
}

export function getSystemDesignLessonTrail(slug: string) {
  function visit(nodes: readonly SystemDesignCurriculumNode[], trail: SystemDesignCurriculumNode[]): SystemDesignCurriculumNode[] | null {
    for (const node of nodes) {
      const nextTrail = [...trail, node];
      if (node.slug === slug) return nextTrail;
      const found = visit(node.children ?? [], nextTrail);
      if (found) return found;
    }
    return null;
  }
  return visit(systemDesignCurriculum, []) ?? [];
}

export function getSystemDesignLessonPager(slug: string) {
  const lessonItem = getSystemDesignLesson(slug);
  if (!lessonItem) return { previous: undefined, next: undefined };
  if (lessonItem.pager) {
    return {
      previous: getSystemDesignLesson(lessonItem.pager.previousSlug),
      next: getSystemDesignLesson(lessonItem.pager.nextSlug),
    };
  }
  const index = systemDesignLessons.findIndex((item) => item.slug === slug);
  return { previous: systemDesignLessons[index - 1], next: systemDesignLessons[index + 1] };
}

export function getSystemDesignCategory(categoryTitle: string) {
  return systemDesignCurriculum.find((item) => item.title === categoryTitle);
}
