import { PatternsClosureLessonContent } from "./patterns";
import { PlatformOperationsLessonContent } from "./platform-operations";
import { ReliabilityOperationsLessonContent } from "./reliability-operations";
import { StoragePaymentsLessonContent } from "./storage-payments";

export const requiredClosureLessonIds = new Set([
  "schema-data-migration", "incident-recovery-postmortems",
  "security-threat-modeling", "cost-efficiency", "operational-ownership",
  "backfill-rebuild", "control-plane-data-plane",
  "payments-ledgers", "distributed-file-systems", "storage-compute-separation",
]);

export function RequiredClosureLessonContent({ lessonId }: { lessonId: string }) {
  if (["schema-data-migration", "incident-recovery-postmortems"].includes(lessonId)) return <ReliabilityOperationsLessonContent lessonId={lessonId} />;
  if (["security-threat-modeling", "cost-efficiency", "operational-ownership"].includes(lessonId)) return <PlatformOperationsLessonContent lessonId={lessonId} />;
  if (["backfill-rebuild", "control-plane-data-plane"].includes(lessonId)) return <PatternsClosureLessonContent lessonId={lessonId} />;
  if (["payments-ledgers", "distributed-file-systems", "storage-compute-separation"].includes(lessonId)) return <StoragePaymentsLessonContent lessonId={lessonId} />;
  return null;
}
