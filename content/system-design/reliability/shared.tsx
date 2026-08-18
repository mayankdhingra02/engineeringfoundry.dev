import { FurtherReading, PracticeConnections, RememberThis } from "@/components/system-design-article";
import { reliabilitySources } from "./sources";

export function ReliabilityLessonEnd({ id, practice, children }: { id: string; practice: readonly string[]; children: React.ReactNode }) {
  return <><PracticeConnections ids={practice} /><FurtherReading items={reliabilitySources[id] ?? []} /><RememberThis><p>{children}</p></RememberThis></>;
}
