import { FurtherReading, PracticeConnections, RememberThis } from "@/components/system-design-article";
import { messagingSources } from "./sources";

export function MessagingLessonEnd({ id, practice, children }: { id: string; practice: readonly string[]; children: React.ReactNode }) {
  return <><PracticeConnections ids={practice} /><FurtherReading items={messagingSources[id]} /><RememberThis><p>{children}</p></RememberThis></>;
}
