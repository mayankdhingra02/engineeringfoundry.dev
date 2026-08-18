import type { DSARoadmap, ProblemClassification, RoadmapProblem, RoadmapProblemAssignment } from "./level-roadmaps.ts";
import { sde1Problems } from "./sde1-problems.ts";
import { sde2Problems } from "./sde2-problems.ts";
import { sde3Problems } from "./sde3-problems.ts";

export const roadmapProblems: readonly RoadmapProblem[] = [...sde1Problems, ...sde2Problems, ...sde3Problems];
export const roadmapProblemById = new Map(roadmapProblems.map((problem) => [problem.id, problem]));

function assignmentMap(assignments?: readonly RoadmapProblemAssignment[]) {
  return new Map(assignments?.map((assignment) => [assignment.problemId, assignment]) ?? []);
}

export function resolveRoadmapProblems(problemIds: readonly string[], assignments?: readonly RoadmapProblemAssignment[]) {
  const overlays = assignmentMap(assignments);
  return problemIds.map((id) => {
    const problem = roadmapProblemById.get(id);
    if (!problem) throw new Error(`Unknown roadmap problem: ${id}`);
    const assignment = overlays.get(id);
    if (!assignment) return problem;
    return {
      ...problem,
      classification: assignment.classification,
      levelRationale: assignment.levelRationale,
      levelRationaleLabel: assignment.levelRationaleLabel,
      followUps: [...(problem.followUps ?? []), ...(assignment.followUps ?? [])],
      alternativeApproaches: assignment.alternativeApproaches,
      alternativeLabel: assignment.alternativeLabel,
      designBridge: assignment.designBridge,
      invariants: assignment.invariants,
      categorizedFollowUps: assignment.categorizedFollowUps,
      failureChecks: assignment.failureChecks,
      apiContract: assignment.apiContract,
      companyRelevance: assignment.companyRelevance,
    } satisfies RoadmapProblem;
  });
}

export function getRoadmapProblemIds(roadmap: DSARoadmap) {
  if (roadmap.problemAssignments?.length) return roadmap.problemAssignments.map((assignment) => assignment.problemId);
  return [...new Set([
    ...roadmap.modules.flatMap((module) => module.topics.flatMap((topic) => topic.problemIds ?? topic.problems?.map((problem) => problem.id) ?? [])),
    ...(roadmap.optionalTopics ?? []).flatMap((topic) => topic.problemIds ?? topic.problems?.map((problem) => problem.id) ?? []),
  ])];
}

export function getRoadmapProblemCounts(roadmap: DSARoadmap) {
  return resolveRoadmapProblems(getRoadmapProblemIds(roadmap), roadmap.problemAssignments).reduce<Record<ProblemClassification, number>>((counts, problem) => {
    counts[problem.classification] += 1;
    return counts;
  }, { learn: 0, core: 0, practice: 0, stretch: 0 });
}

export function assertRoadmapProblemRegistryIntegrity() {
  const ids = roadmapProblems.map((problem) => problem.id);
  if (new Set(ids).size !== ids.length) throw new Error("The shared roadmap registry contains duplicate canonical problem IDs.");
}

assertRoadmapProblemRegistryIntegrity();
