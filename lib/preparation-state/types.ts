import type { RoadmapPlanId, RoadmapProgressSnapshot } from "@/data/dsa/roadmap-planning";
import type {
  SystemDesignStudyItemStatus,
  SystemDesignStudyMinutesPerDay,
} from "@/data/system-design/study-plan";
import type {
  SystemDesignLevel,
  SystemDesignPreparationWindow,
  SystemDesignTargetRole,
} from "@/data/system-design/recommendations";
import type { RoadmapLevel } from "@/data/dsa/level-roadmaps";
import type { RoadmapCompanyId } from "@/data/dsa/roadmap-companies";
import type { DSALanguage } from "@/data/dsa/languages";

export const dsaProgressItemKinds = ["problem", "roadmap-task", "mixed-set", "timed-practice"] as const;
export type DsaProgressItemKind = (typeof dsaProgressItemKinds)[number];

export const dsaProgressStatuses = ["attempted", "solved", "review", "comfortable", "in-progress", "completed"] as const;
export type DsaProgressStatus = (typeof dsaProgressStatuses)[number];
export type DsaProgressMutationStatus = DsaProgressStatus | "not-started";

export const systemDesignProgressItemKinds = ["topic", "practice", "review", "simulation"] as const;
export type SystemDesignProgressItemKind = (typeof systemDesignProgressItemKinds)[number];
export type SystemDesignProgressStatus = Exclude<SystemDesignStudyItemStatus, "not-started">;
export type SystemDesignProgressMutationStatus = SystemDesignStudyItemStatus;

export interface UserPreparationPreferences {
  dsaLevel: RoadmapLevel | null;
  dsaPlanId: RoadmapPlanId | null;
  dsaCompanySlug: RoadmapCompanyId | null;
  dsaPreferredLanguageSlug: DSALanguage["slug"] | null;
  dsaInterviewDate: string | null;
  systemDesignLevel: SystemDesignLevel | null;
  systemDesignPreparationWindow: SystemDesignPreparationWindow | null;
  systemDesignRole: SystemDesignTargetRole | null;
  systemDesignMinutesPerDay: SystemDesignStudyMinutesPerDay | null;
  localSystemDesignImportVersion: number | null;
  localSystemDesignImportedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserPreparationPreferencesPatch = Partial<{
  dsaLevel: RoadmapLevel | null;
  dsaPlanId: RoadmapPlanId | null;
  dsaCompanySlug: RoadmapCompanyId | null;
  dsaPreferredLanguageSlug: DSALanguage["slug"] | null;
  dsaInterviewDate: string | null;
  systemDesignLevel: SystemDesignLevel | null;
  systemDesignPreparationWindow: SystemDesignPreparationWindow | null;
  systemDesignRole: SystemDesignTargetRole | null;
  systemDesignMinutesPerDay: SystemDesignStudyMinutesPerDay | null;
}>;

export interface DsaProgressItem {
  itemKind: DsaProgressItemKind;
  itemId: string;
  status: DsaProgressStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DsaProgressMutation {
  itemKind: DsaProgressItemKind;
  itemId: string;
  status: DsaProgressMutationStatus;
}

export interface PreparationProgressSelector<TKind extends string> {
  itemKind: TKind;
  itemId: string;
}

export type DsaProgressSelector = PreparationProgressSelector<DsaProgressItemKind>;

export interface SystemDesignProgressItem {
  itemKind: SystemDesignProgressItemKind;
  itemId: string;
  status: SystemDesignProgressStatus;
  completedAt: string | null;
  lastInteractedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemDesignProgressMutation {
  itemKind: SystemDesignProgressItemKind;
  itemId: string;
  status: SystemDesignProgressMutationStatus;
}

export type SystemDesignProgressSelector = PreparationProgressSelector<SystemDesignProgressItemKind>;

export interface CurrentPreparationState {
  preferences: UserPreparationPreferences | null;
  dsaProgress: DsaProgressItem[];
  systemDesignProgress: SystemDesignProgressItem[];
}

export type SystemDesignProgressMap = Record<string, SystemDesignStudyItemStatus>;

export interface PreparationStateAdapters {
  dsaRoadmap: RoadmapProgressSnapshot;
  systemDesign: SystemDesignProgressMap;
}

export interface PreparationImportCandidates<T> {
  items: T[];
  rejectedKeys: string[];
}

export type PreparationStateErrorCode =
  | "account-unavailable"
  | "unauthenticated"
  | "invalid-input"
  | "persistence-failed";

export interface PreparationStateError {
  code: PreparationStateErrorCode;
  message: string;
  fieldErrors?: Readonly<Record<string, string>>;
}

export type PreparationStateResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: PreparationStateError };

export type PreparationDeleteResult = { deleted: boolean };
