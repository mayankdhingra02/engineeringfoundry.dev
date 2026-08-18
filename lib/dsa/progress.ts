import { getDsaLevelRoadmap, type RoadmapLevel } from "@/data/dsa/level-roadmaps";
import { getRoadmapProblemIds } from "@/data/dsa/roadmap-problem-registry";
import { canonicalDsaQuestionById, canonicalDsaQuestions, type CanonicalDsaQuestion } from "@/lib/dsa/catalog";
import type { DsaQuestionProgressRow } from "@/lib/supabase/database.types";

export type DsaQuestionStatus = DsaQuestionProgressRow["status"];
export type DsaConfidence = NonNullable<DsaQuestionProgressRow["confidence"]>;
export type DsaProgressMap = Readonly<Record<string, DsaQuestionProgressRow>>;

export const emptyProgress = (questionId: string): DsaQuestionProgressRow => ({
  user_id: "",
  question_id: questionId,
  status: "not_started",
  confidence: null,
  bookmarked: false,
  notes: null,
  first_attempted_at: null,
  last_practiced_at: null,
  solved_at: null,
  created_at: "",
  updated_at: "",
});

export function progressByQuestionId(rows: readonly DsaQuestionProgressRow[]): DsaProgressMap {
  return Object.fromEntries(rows.map((row) => [row.question_id, row]));
}

export function isQuestionComplete(status: DsaQuestionStatus) {
  return status === "solved" || status === "review";
}

export function getRoadmapProgress(level: RoadmapLevel, progress: DsaProgressMap) {
  const ids = getRoadmapProblemIds(getDsaLevelRoadmap(level));
  const completed = ids.filter((id) => isQuestionComplete(progress[id]?.status ?? "not_started")).length;
  return { level, completed, total: ids.length, remaining: ids.length - completed };
}

export function chooseContinueQuestion(level: RoadmapLevel, progress: DsaProgressMap): CanonicalDsaQuestion | null {
  const rows = Object.values(progress);
  const byOldestPractice = (left: DsaQuestionProgressRow, right: DsaQuestionProgressRow) =>
    (left.last_practiced_at ?? "").localeCompare(right.last_practiced_at ?? "") || left.question_id.localeCompare(right.question_id);
  const review = rows.filter((row) => row.status === "review").sort(byOldestPractice)[0];
  if (review) return canonicalDsaQuestionById.get(review.question_id) ?? null;
  const attempted = rows.filter((row) => row.status === "attempted").sort(byOldestPractice)[0];
  if (attempted) return canonicalDsaQuestionById.get(attempted.question_id) ?? null;
  const roadmapQuestion = getRoadmapProblemIds(getDsaLevelRoadmap(level))
    .find((id) => !isQuestionComplete(progress[id]?.status ?? "not_started"));
  if (roadmapQuestion) return canonicalDsaQuestionById.get(roadmapQuestion) ?? null;
  const lowConfidence = rows
    .filter((row) => row.confidence === "low")
    .sort((left, right) => (right.last_practiced_at ?? "").localeCompare(left.last_practiced_at ?? ""))[0];
  return lowConfidence ? canonicalDsaQuestionById.get(lowConfidence.question_id) ?? null : null;
}

export function getNeedsReview(progress: DsaProgressMap) {
  return Object.values(progress)
    .filter((row) => row.status === "attempted" || row.status === "review" || (row.status === "solved" && row.confidence === "low"))
    .sort((left, right) => (right.last_practiced_at ?? "").localeCompare(left.last_practiced_at ?? ""))
    .map((row) => ({ question: canonicalDsaQuestionById.get(row.question_id), progress: row }))
    .filter((entry): entry is { question: CanonicalDsaQuestion; progress: DsaQuestionProgressRow } => Boolean(entry.question));
}

export function getTopicProgress(progress: DsaProgressMap) {
  const totals = new Map<string, { topic: string; completed: number; practiced: number; total: number }>();
  for (const question of canonicalDsaQuestions) {
    for (const topic of question.topics) {
      const current = totals.get(topic) ?? { topic, completed: 0, practiced: 0, total: 0 };
      current.total += 1;
      const row = progress[question.id];
      if (row && row.status !== "not_started") current.practiced += 1;
      if (row && isQuestionComplete(row.status)) current.completed += 1;
      totals.set(topic, current);
    }
  }
  return [...totals.values()].filter((topic) => topic.practiced > 0).sort((a, b) => b.practiced - a.practiced || a.topic.localeCompare(b.topic));
}
