import { BatchVsStreamingLessonContent, CqrsLessonContent, HandlingContentionLessonContent, HandlingHotPartitionsLessonContent, LargeFileProcessingLessonContent, MultiStepWorkflowsLessonContent } from "./processing-coordination";
import { BackgroundJobsLessonContent, FanOutLessonContent, FanoutReadWriteLessonContent, LongRunningJobsLessonContent } from "./fanout-jobs";
import { ReadHeavySystemsLessonContent, ScalingReadsLessonContent, ScalingWritesLessonContent, WriteHeavySystemsLessonContent } from "./load-shaping";

export const architecturePatternLessonIds = new Set([
  "scaling-reads", "scaling-writes", "read-heavy-systems", "write-heavy-systems",
  "fan-out", "fanout-read-write", "background-jobs", "long-running-jobs",
  "batch-vs-streaming", "cqrs", "handling-hot-partitions", "handling-contention",
  "multi-step-workflows", "large-file-processing",
]);

export function ArchitecturePatternLessonContent({ lessonId }: { lessonId: string }) {
  switch (lessonId) {
    case "scaling-reads": return <ScalingReadsLessonContent />;
    case "scaling-writes": return <ScalingWritesLessonContent />;
    case "read-heavy-systems": return <ReadHeavySystemsLessonContent />;
    case "write-heavy-systems": return <WriteHeavySystemsLessonContent />;
    case "fan-out": return <FanOutLessonContent />;
    case "fanout-read-write": return <FanoutReadWriteLessonContent />;
    case "background-jobs": return <BackgroundJobsLessonContent />;
    case "long-running-jobs": return <LongRunningJobsLessonContent />;
    case "batch-vs-streaming": return <BatchVsStreamingLessonContent />;
    case "cqrs": return <CqrsLessonContent />;
    case "handling-hot-partitions": return <HandlingHotPartitionsLessonContent />;
    case "handling-contention": return <HandlingContentionLessonContent />;
    case "multi-step-workflows": return <MultiStepWorkflowsLessonContent />;
    case "large-file-processing": return <LargeFileProcessingLessonContent />;
    default: return null;
  }
}
