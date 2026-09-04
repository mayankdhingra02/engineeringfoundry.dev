import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  type FeedbackCategory,
  type FeedbackStatus,
} from "../feedback/model.ts";

export const ADMIN_FEEDBACK_QUEUE_LIMIT = 100;

export class AdminPrivateDataUnavailableError extends Error {
  constructor() {
    super("Private admin data is temporarily unavailable. Please try again.");
    this.name = "AdminPrivateDataUnavailableError";
  }
}

export type AdminFeedbackQueueItem = Readonly<{
  id: string;
  reference_id: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  page_context: string | null;
  message: string;
  created_at: string;
}>;

export type AdminFeedbackDetail = AdminFeedbackQueueItem &
  Readonly<{
    contact_email: string | null;
    contact_consent: boolean;
    submitted_as_authenticated: boolean;
    admin_note: string | null;
    updated_at: string;
  }>;

export type AdminFeedbackQueue = Readonly<{
  items: readonly AdminFeedbackQueueItem[];
  limit: typeof ADMIN_FEEDBACK_QUEUE_LIMIT;
  page: number;
  totalCount: number;
  totalPages: number;
}>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const REFERENCE_PATTERN = /^EF-FB-[A-F0-9]{32}$/;
const PAGE_CONTEXT_PATTERN = /^\/[A-Za-z0-9/_-]*(?:\/\.\.\.)?$/;
const CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATABASE_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;
const FEEDBACK_CATEGORY_IDS = new Set<unknown>(
  FEEDBACK_CATEGORIES.map((category) => category.id),
);
const FEEDBACK_STATUS_IDS = new Set<unknown>(FEEDBACK_STATUSES);

function unavailable(): never {
  throw new AdminPrivateDataUnavailableError();
}

export function isCanonicalAdminFeedbackId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function resolveAdminFeedbackPage(value: unknown): number {
  if (value === undefined) return 1;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= 100_000 ? page : 1;
}

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

function isBoundedText(value: unknown, max: number, min = 0): value is string {
  return (
    typeof value === "string" &&
    !value.includes("\u0000") &&
    Array.from(value).length >= min &&
    Array.from(value).length <= max
  );
}

function isNullableBoundedText(value: unknown, max: number) {
  return value === null || isBoundedText(value, max);
}

function isDatabaseTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 64 &&
    DATABASE_TIMESTAMP_PATTERN.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function parseQueueItem(value: unknown): AdminFeedbackQueueItem | null {
  if (!isPlainRecord(value)) return null;
  const expected = [
    "id",
    "reference_id",
    "category",
    "status",
    "page_context",
    "message",
    "created_at",
  ] as const;
  if (
    !hasExactKeys(value, expected) ||
    !isCanonicalAdminFeedbackId(value.id) ||
    typeof value.reference_id !== "string" ||
    !REFERENCE_PATTERN.test(value.reference_id) ||
    !FEEDBACK_CATEGORY_IDS.has(value.category) ||
    !FEEDBACK_STATUS_IDS.has(value.status) ||
    !isNullableBoundedText(value.page_context, 180) ||
    (typeof value.page_context === "string" &&
      !PAGE_CONTEXT_PATTERN.test(value.page_context)) ||
    !isBoundedText(value.message, 5_000, 1) ||
    !isDatabaseTimestamp(value.created_at)
  ) {
    return null;
  }
  return {
    id: value.id,
    reference_id: value.reference_id,
    category: value.category as FeedbackCategory,
    status: value.status as FeedbackStatus,
    page_context: value.page_context as string | null,
    message: value.message,
    created_at: value.created_at,
  };
}

function parseDetail(value: unknown): AdminFeedbackDetail | null {
  if (!isPlainRecord(value)) return null;
  const expected = [
    "id",
    "reference_id",
    "category",
    "status",
    "message",
    "page_context",
    "contact_email",
    "contact_consent",
    "submitted_as_authenticated",
    "created_at",
    "admin_note",
    "updated_at",
  ] as const;
  if (!hasExactKeys(value, expected)) return null;
  const queueItem = parseQueueItem({
    id: value.id,
    reference_id: value.reference_id,
    category: value.category,
    status: value.status,
    page_context: value.page_context,
    message: value.message,
    created_at: value.created_at,
  });
  if (
    !queueItem ||
    !isNullableBoundedText(value.contact_email, 254) ||
    (typeof value.contact_email === "string" &&
      !CONTACT_EMAIL_PATTERN.test(value.contact_email)) ||
    typeof value.contact_consent !== "boolean" ||
    typeof value.submitted_as_authenticated !== "boolean" ||
    !isNullableBoundedText(value.admin_note, 2_000) ||
    !isDatabaseTimestamp(value.updated_at)
  ) {
    return null;
  }
  return {
    ...queueItem,
    contact_email: value.contact_email as string | null,
    contact_consent: value.contact_consent,
    submitted_as_authenticated: value.submitted_as_authenticated,
    admin_note: value.admin_note as string | null,
    updated_at: value.updated_at,
  };
}

export function resolveAdminMembershipResult(input: unknown): boolean {
  if (
    !isPlainRecord(input) ||
    !hasExactKeys(input, ["data", "error"]) ||
    input.error !== null ||
    typeof input.data !== "boolean"
  ) {
    return unavailable();
  }
  return input.data;
}

export function resolveAdminCountResult(input: unknown): number {
  if (
    !isPlainRecord(input) ||
    !hasExactKeys(input, ["count", "error"]) ||
    input.error !== null ||
    !Number.isSafeInteger(input.count) ||
    (input.count as number) < 0
  ) {
    return unavailable();
  }
  return input.count as number;
}

export function resolveAdminFeedbackQueueResult(
  input: unknown,
  page: number,
): AdminFeedbackQueue {
  if (
    !isPlainRecord(input) ||
    !hasExactKeys(input, ["data", "error", "count"]) ||
    input.error !== null ||
    !Array.isArray(input.data) ||
    !Number.isSafeInteger(input.count) ||
    (input.count as number) < 0 ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100_000
  ) {
    return unavailable();
  }
  const totalCount = input.count as number;
  const offset = (page - 1) * ADMIN_FEEDBACK_QUEUE_LIMIT;
  const expectedLength = Math.min(
    ADMIN_FEEDBACK_QUEUE_LIMIT,
    Math.max(totalCount - offset, 0),
  );
  if (input.data.length !== expectedLength) return unavailable();
  const items = input.data.map(parseQueueItem);
  if (items.some((item) => item === null)) return unavailable();
  const parsed = items as AdminFeedbackQueueItem[];
  if (
    new Set(parsed.map((item) => item.id)).size !== parsed.length ||
    new Set(parsed.map((item) => item.reference_id)).size !== parsed.length
  ) {
    return unavailable();
  }
  return {
    items: parsed,
    limit: ADMIN_FEEDBACK_QUEUE_LIMIT,
    page,
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / ADMIN_FEEDBACK_QUEUE_LIMIT)),
  };
}

export function resolveAdminFeedbackDetailResult(
  input: unknown,
): AdminFeedbackDetail | null {
  if (
    !isPlainRecord(input) ||
    !hasExactKeys(input, ["data", "error"]) ||
    input.error !== null
  ) {
    return unavailable();
  }
  if (input.data === null) return null;
  return parseDetail(input.data) ?? unavailable();
}
