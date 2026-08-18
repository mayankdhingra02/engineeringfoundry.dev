export type HomeProgressStatus = "not-started" | "in-progress" | "completed";

export interface HomeSystemDesignLesson {
  id: string;
  title: string;
  href: string;
  kind: "lesson" | "practice";
}

export interface HomeContinuation {
  title: string;
  href: string;
  context: string;
  completedCount: number;
}

export function getSystemDesignContinuation(
  storedProgress: unknown,
  lessons: readonly HomeSystemDesignLesson[],
): HomeContinuation | null {
  if (!storedProgress || typeof storedProgress !== "object" || Array.isArray(storedProgress)) return null;

  const progress = storedProgress as Record<string, unknown>;
  const getItemId = (lesson: HomeSystemDesignLesson) => lesson.kind === "practice"
    ? `practice:${lesson.id.slice("problem-".length)}`
    : `topic:${lesson.id}`;
  const statusFor = (lesson: HomeSystemDesignLesson): HomeProgressStatus => {
    const status = progress[getItemId(lesson)];
    return status === "completed" || status === "in-progress" ? status : "not-started";
  };

  const completedCount = lessons.filter((lesson) => statusFor(lesson) === "completed").length;
  const inProgress = lessons.find((lesson) => statusFor(lesson) === "in-progress");
  if (inProgress) {
    return {
      title: inProgress.title,
      href: inProgress.href,
      context: "A saved practice session is in progress in this browser.",
      completedCount,
    };
  }

  if (completedCount === 0) return null;

  const lastCompletedIndex = lessons.reduce(
    (latest, lesson, index) => statusFor(lesson) === "completed" ? index : latest,
    -1,
  );
  const nextLesson = lessons.slice(lastCompletedIndex + 1).find((lesson) => statusFor(lesson) !== "completed")
    ?? lessons.find((lesson) => statusFor(lesson) !== "completed")
    ?? lessons[0];
  if (!nextLesson) return null;

  return {
    title: nextLesson.title,
    href: nextLesson.href,
    context: `${completedCount} ${completedCount === 1 ? "lesson" : "lessons"} complete in this browser.`,
    completedCount,
  };
}
