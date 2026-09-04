import type { BehavioralStory } from "../supabase/database.types.ts";
import { STORY_THEMES } from "./options.ts";
import {
  isCanonicalBehavioralStoryRevision,
  parseCanonicalBehavioralStoryId,
} from "./story-action-input.ts";

const STORY_STATUSES = new Set<unknown>([
  "Draft",
  "Needs Work",
  "Ready",
  "Retired",
]);
const STORY_KEYS = [
  "id",
  "user_id",
  "title",
  "company_or_context",
  "role",
  "approximate_period",
  "project",
  "situation",
  "task",
  "action",
  "result",
  "reflection",
  "short_summary",
  "status",
  "notes",
  "created_at",
  "updated_at",
  "behavioral_story_themes",
] as const;
const NULLABLE_TEXT_LIMITS = {
  company_or_context: 200,
  role: 160,
  approximate_period: 100,
  project: 200,
  situation: 50_000,
  task: 50_000,
  action: 50_000,
  result: 50_000,
  reflection: 50_000,
  short_summary: 5_000,
  notes: 50_000,
} as const;

export type BehavioralStoryEditSnapshot = Readonly<{
  story: BehavioralStory;
  themes: readonly (typeof STORY_THEMES)[number][];
}>;

export type BehavioralStoryEditSnapshotResolution =
  | Readonly<{ status: "ready"; value: BehavioralStoryEditSnapshot }>
  | Readonly<{ status: "missing" }>
  | Readonly<{ status: "unavailable" }>;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const keys = Reflect.ownKeys(value);
  return (
    keys.length === expected.length &&
    keys.every((key) => typeof key === "string" && expected.includes(key))
  );
}

function isBoundedText(value: unknown, minimum: number, maximum: number) {
  return (
    typeof value === "string" &&
    !value.includes("\u0000") &&
    Array.from(value.trim()).length >= minimum &&
    Array.from(value).length <= maximum
  );
}

function isNullableBoundedText(value: unknown, maximum: number) {
  return value === null || isBoundedText(value, 0, maximum);
}

function parseThemes(value: unknown) {
  if (!Array.isArray(value) || value.length > STORY_THEMES.length) return null;
  const themes: string[] = [];
  for (const item of value) {
    if (
      !isPlainRecord(item) ||
      !hasExactKeys(item, ["theme"]) ||
      typeof item.theme !== "string" ||
      !STORY_THEMES.includes(item.theme as (typeof STORY_THEMES)[number]) ||
      themes.includes(item.theme)
    ) {
      return null;
    }
    themes.push(item.theme);
  }
  return STORY_THEMES.filter((theme) => themes.includes(theme));
}

export function resolveBehavioralStoryEditSnapshot(
  value: unknown,
  expectedStoryId: unknown,
  expectedUserId: unknown,
): BehavioralStoryEditSnapshotResolution {
  const storyId = parseCanonicalBehavioralStoryId(expectedStoryId);
  const userId = parseCanonicalBehavioralStoryId(expectedUserId);
  if (!storyId || !userId || !isPlainRecord(value)) {
    return { status: "unavailable" };
  }
  if (
    !hasExactKeys(value, ["data", "error"]) ||
    !Object.hasOwn(value, "data") ||
    !Object.hasOwn(value, "error") ||
    value.error !== null
  ) {
    return { status: "unavailable" };
  }
  if (value.data === null) return { status: "missing" };
  if (!isPlainRecord(value.data) || !hasExactKeys(value.data, STORY_KEYS)) {
    return { status: "unavailable" };
  }

  const row = value.data;
  const parsedId = parseCanonicalBehavioralStoryId(row.id);
  const parsedUserId = parseCanonicalBehavioralStoryId(row.user_id);
  const themes = parseThemes(row.behavioral_story_themes);
  if (
    parsedId !== storyId ||
    parsedUserId !== userId ||
    !isBoundedText(row.title, 2, 200) ||
    !STORY_STATUSES.has(row.status) ||
    !isCanonicalBehavioralStoryRevision(row.created_at) ||
    !isCanonicalBehavioralStoryRevision(row.updated_at) ||
    themes === null ||
    Object.entries(NULLABLE_TEXT_LIMITS).some(
      ([key, maximum]) => !isNullableBoundedText(row[key], maximum),
    )
  ) {
    return { status: "unavailable" };
  }

  return {
    status: "ready",
    value: {
      story: {
        id: storyId,
        user_id: userId,
        title: row.title as string,
        company_or_context: row.company_or_context as string | null,
        role: row.role as string | null,
        approximate_period: row.approximate_period as string | null,
        project: row.project as string | null,
        situation: row.situation as string | null,
        task: row.task as string | null,
        action: row.action as string | null,
        result: row.result as string | null,
        reflection: row.reflection as string | null,
        short_summary: row.short_summary as string | null,
        status: row.status as string,
        notes: row.notes as string | null,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
      },
      themes,
    },
  };
}
