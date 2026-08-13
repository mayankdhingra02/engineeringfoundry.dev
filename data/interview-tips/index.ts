import type { InterviewChecklist, InterviewTip, InterviewTipCategory } from "@/types";
import checklistsData from "./checklists.json";
import tipsData from "./tips.json";

export const interviewTipCategories: InterviewTipCategory[] = [
  "Preparation", "Before the Interview", "Coding", "System Design", "ML Design",
  "Behavioral", "Communication", "Recovering When Stuck", "Closing", "After the Interview",
];
export const interviewTips = tipsData as InterviewTip[];
export const activeInterviewTips = interviewTips.filter((tip) => tip.status === "active");
export const interviewChecklists = checklistsData as InterviewChecklist[];
export const activeInterviewChecklists = interviewChecklists.filter((checklist) => checklist.status === "active");

export const interviewPlaybookSections = interviewTipCategories.map((category) => ({
  id: category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
  title: category,
  count: activeInterviewTips.filter((tip) => tip.category === category).length,
}));
