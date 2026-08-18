import { FurtherReading, PracticeConnections, RememberThis } from "@/components/system-design-article";
import { specializedSources } from "./sources";

export function SpecializedLessonEnd({ id, practice, children }: { id: string; practice: readonly string[]; children: React.ReactNode }) {
  return <><PracticeConnections ids={practice} /><FurtherReading items={specializedSources[id] ?? []} /><RememberThis><p>{children}</p></RememberThis></>;
}
